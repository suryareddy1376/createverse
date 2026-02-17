import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase, getRegistrations, deleteAllRegistrations, wipeAllData, getSettings, setRegistrationsOpen, getRegistrationLimit, setRegistrationLimit, getAttendance, markAttendance, removeAttendance } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import './Dashboard.css'

function Dashboard() {
    const navigate = useNavigate()
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(true)
    const [registrationLimit, setRegLimit] = useState(0)
    const [limitInput, setLimitInput] = useState('')
    const [actionLoading, setActionLoading] = useState('')
    const [message, setMessage] = useState({ text: '', type: '' })
    const [expandedTeamId, setExpandedTeamId] = useState(null)

    // Attendance state (kept for compatibility, though might need updates for teams)
    const [attendanceSet, setAttendanceSet] = useState(new Set())
    const [markingPresent, setMarkingPresent] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [fetchedTeams, openStatus, limit, attendanceData] = await Promise.all([
                getRegistrations(), // Now returns teams with members
                getSettings(),
                getRegistrationLimit(),
                getAttendance()
            ])
            setTeams(fetchedTeams || [])
            setIsOpen(openStatus)
            setRegLimit(limit)
            setAttendanceSet(new Set((attendanceData || []).map(a => String(a.reg_number).trim())))
            setLimitInput(limit.toString())
        } catch (error) {
            showMessage('Failed to load data: ' + error.message, 'error')
        }
        setLoading(false)
    }

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type })
        setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }

    const handleToggleRegistrations = async () => {
        setActionLoading('toggle')
        try {
            await setRegistrationsOpen(!isOpen)
            setIsOpen(!isOpen)
            showMessage(`Registrations ${!isOpen ? 'opened' : 'closed'} successfully`)
        } catch (error) {
            showMessage('Failed to update: ' + error.message, 'error')
        }
        setActionLoading('')
    }

    const handleRefresh = async () => {
        setActionLoading('refresh')
        await loadData()
        showMessage('Data refreshed successfully')
        setActionLoading('')
    }

    // Resetting deletes all teams AND attendance
    const handleReset = async () => {
        if (!window.confirm('⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to DELETE ALL DATA?\n\nThis will permanently delete:\n- All Registered Teams\n- All Team Members\n- All Attendance Records\n\nThis action cannot be undone!')) {
            return
        }
        setActionLoading('reset')
        try {
            await wipeAllData()

            setTeams([])
            setAttendanceSet(new Set())
            showMessage('All data (teams, members, attendance) has been wiped successfully')
        } catch (error) {
            showMessage('Failed to complete reset: ' + error.message, 'error')
        }
        setActionLoading('')
    }

    const handleExportExcel = () => {
        if (teams.length === 0) {
            showMessage('No registrations to export', 'error')
            return
        }

        setActionLoading('export')
        try {
            // Flatten team data for Excel
            const excelData = []

            teams.forEach((team, teamIndex) => {
                if (team.team_members && team.team_members.length > 0) {
                    team.team_members.forEach((member, memberIndex) => {
                        // Check attendance status
                        const isPresent = attendanceSet.has(String(member.reg_number).trim())

                        excelData.push({
                            'Team ID': teamIndex + 1,
                            'Team Name': team.team_name,
                            'Role': member.is_leader ? 'Leader' : 'Member',
                            'Attendance': isPresent ? 'Present' : 'Absent', // Added Attendance Column
                            'Full Name': member.full_name,
                            'Reg Number': member.reg_number,
                            'Gender': member.gender,
                            'Department': member.dept,
                            'Year': member.year,
                            'Section': member.section,
                            'Email': member.email,
                            'Mobile': member.mobile,
                            'Registered At': new Date(team.created_at).toLocaleString()
                        })
                    })
                } else {
                    // Empty team case
                    excelData.push({
                        'Team ID': teamIndex + 1,
                        'Team Name': team.team_name,
                        'Role': '-',
                        'Attendance': '-',
                        'Full Name': '-',
                        'Reg Number': '-',
                        // ... fill others
                        'Registered At': new Date(team.created_at).toLocaleString()
                    })
                }
            })

            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams')

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            saveAs(blob, `CREATEVERSE_Teams_${new Date().toISOString().split('T')[0]}.xlsx`)

            showMessage('Excel exported successfully')
        } catch (error) {
            showMessage('Export failed: ' + error.message, 'error')
        }
        setActionLoading('')
    }

    const handleUpdateLimit = async () => {
        const newLimit = parseInt(limitInput, 10)
        if (isNaN(newLimit) || newLimit < 0) {
            showMessage('Please enter a valid number (0 for unlimited)', 'error')
            return
        }
        setActionLoading('limit')
        try {
            await setRegistrationLimit(newLimit)
            setRegLimit(newLimit)
            showMessage(`Registration limit ${newLimit === 0 ? 'removed (unlimited)' : `set to ${newLimit}`}`)
        } catch (error) {
            showMessage('Failed to update limit: ' + error.message, 'error')
        }
        setActionLoading('')
    }

    const handleToggleAttendance = async (member, currentStatus) => {
        const regNumber = String(member.reg_number).trim()
        setActionLoading(`att-${regNumber}`)
        try {
            if (currentStatus) {
                // Currently present -> Mark Absent (Remove)
                await removeAttendance(regNumber)
                const newSet = new Set(attendanceSet)
                newSet.delete(regNumber)
                setAttendanceSet(newSet)
                showMessage(`Marked ${member.full_name} as Absent`)
            } else {
                // Currently absent -> Mark Present (Add)
                await markAttendance(regNumber)
                const newSet = new Set(attendanceSet)
                newSet.add(regNumber)
                setAttendanceSet(newSet)
                showMessage(`Marked ${member.full_name} as Present`)
            }
        } catch (error) {
            showMessage(`Failed to update attendance: ${error.message}`, 'error')
        }
        setActionLoading('')
    }

    const toggleTeamRow = (teamId) => {
        setExpandedTeamId(expandedTeamId === teamId ? null : teamId)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="dashboard">
            <div className="dashboard-container">
                <motion.div className="dashboard-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="header-content">
                        <h1>CREATEVERSE Admin</h1>
                        <p>Manage Team Registrations</p>
                    </div>
                    <div className="header-actions">
                        <button className="nav-btn" onClick={() => navigate('/attendance')} style={{ marginRight: '1rem' }}>
                            📷 Attendance
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
                    </div>
                </motion.div>

                {message.text && (
                    <motion.div className={`message ${message.type}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        {message.text}
                    </motion.div>
                )}

                <motion.div className="dashboard-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <button className="action-btn" onClick={() => navigate('/attendance')} style={{ backgroundColor: '#646cff' }}>
                        📷 Attendance Check
                    </button>
                    <button className={`action-btn ${isOpen ? 'open' : 'closed'}`} onClick={handleToggleRegistrations} disabled={actionLoading === 'toggle'}>
                        {actionLoading === 'toggle' ? '...' : isOpen ? '🟢 Registrations Open' : '🔴 Registrations Closed'}
                    </button>
                    <button className="action-btn refresh" onClick={handleRefresh} disabled={actionLoading === 'refresh'}>
                        {actionLoading === 'refresh' ? '...' : '🔄 Refresh'}
                    </button>
                    <button className="action-btn export" onClick={handleExportExcel} disabled={actionLoading === 'export'}>
                        {actionLoading === 'export' ? '...' : '📊 Export Excel'}
                    </button>
                    <button className="action-btn reset" onClick={handleReset} disabled={actionLoading === 'reset'}>
                        {actionLoading === 'reset' ? '...' : '🗑️ Reset All'}
                    </button>
                </motion.div>

                <motion.div className="stats-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <span className="stat">
                        <strong>{teams.length}</strong> {registrationLimit > 0 ? `/ ${registrationLimit}` : ''} Teams Registered
                    </span>
                    <div className="limit-control">
                        <label>Max Teams:</label>
                        <input type="number" min="0" value={limitInput} onChange={(e) => setLimitInput(e.target.value)} placeholder="0 = unlimited" className="limit-input" />
                        <button className="action-btn limit" onClick={handleUpdateLimit} disabled={actionLoading === 'limit'}>
                            {actionLoading === 'limit' ? '...' : '💾 Set Limit'}
                        </button>
                    </div>
                </motion.div>

                <motion.div className="table-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    {loading ? (
                        <div className="loading">Loading teams...</div>
                    ) : teams.length === 0 ? (
                        <div className="empty">No teams registered yet</div>
                    ) : (
                        <table className="registrations-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Team Name</th>
                                    <th>Leader</th>
                                    <th>Members</th>
                                    <th>Registered At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map((team, index) => {
                                    const leader = team.team_members?.find(m => m.is_leader) || team.team_members?.[0]
                                    const memberCount = team.team_members?.length || 0

                                    return (
                                        <>
                                            <tr key={team.id} onClick={() => toggleTeamRow(team.id)} className="team-row">
                                                <td>{index + 1}</td>
                                                <td><strong>{team.team_name}</strong></td>
                                                <td>{leader ? leader.full_name : '-'}</td>
                                                <td>
                                                    <span className="member-count-badge">{memberCount} Members</span>
                                                </td>
                                                <td>{new Date(team.created_at).toLocaleString()}</td>
                                                <td>
                                                    <button className="action-btn small-btn">
                                                        {expandedTeamId === team.id ? '▼' : '▶'} Details
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedTeamId === team.id && (
                                                <tr className="members-row">
                                                    <td colSpan="6">
                                                        <div className="members-details">
                                                            <h4>Team Members:</h4>
                                                            <div className="members-grid-display">
                                                                {team.team_members?.map((member, idx) => {
                                                                    const isPresent = attendanceSet.has(String(member.reg_number).trim())
                                                                    return (
                                                                        <div key={member.id || idx} className={`member-card-display ${isPresent ? 'present' : 'absent'}`}>
                                                                            <div className="member-status-actions" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <div className="member-role">
                                                                                    {member.is_leader ? '👑 Leader' : `👤 Member ${idx + 1}`}
                                                                                </div>
                                                                                <button
                                                                                    className={`action-btn small-btn ${isPresent ? 'absent-btn' : 'present-btn'}`}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleToggleAttendance(member, isPresent);
                                                                                    }}
                                                                                    style={{
                                                                                        backgroundColor: isPresent ? '#ef4444' : '#10b981',
                                                                                        padding: '0.25rem 0.5rem',
                                                                                        fontSize: '0.8rem'
                                                                                    }}
                                                                                >
                                                                                    {isPresent ? 'Mark Absent' : 'Mark Present'}
                                                                                </button>
                                                                            </div>
                                                                            <span className={`status-badge ${isPresent ? 'present' : 'absent'}`} style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
                                                                                {isPresent ? '✅ Present' : '❌ Absent'}
                                                                            </span>
                                                                            <p><strong>Name:</strong> {member.full_name}</p>
                                                                            <p><strong>Reg Number:</strong> {member.reg_number}</p>
                                                                            <p><strong>Dept:</strong> {member.dept} - {member.year} - {member.section}</p>
                                                                            <p><strong>Email:</strong> {member.email}</p>
                                                                            <p><strong>Mobile:</strong> {member.mobile}</p>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

export default Dashboard
