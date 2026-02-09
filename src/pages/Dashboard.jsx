import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase, getRegistrations, deleteAllRegistrations, getSettings, setRegistrationsOpen } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import './Dashboard.css'

function Dashboard() {
    const navigate = useNavigate()
    const [registrations, setRegistrations] = useState([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(true)
    const [actionLoading, setActionLoading] = useState('')
    const [message, setMessage] = useState({ text: '', type: '' })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [regs, openStatus] = await Promise.all([
                getRegistrations(),
                getSettings()
            ])
            setRegistrations(regs || [])
            setIsOpen(openStatus)
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

    const handleReset = async () => {
        if (!window.confirm('⚠️ Are you sure you want to DELETE ALL registrations? This cannot be undone!')) {
            return
        }
        setActionLoading('reset')
        try {
            await deleteAllRegistrations()
            setRegistrations([])
            showMessage('All registrations deleted successfully')
        } catch (error) {
            showMessage('Failed to reset: ' + error.message, 'error')
        }
        setActionLoading('')
    }

    const handleExportExcel = () => {
        if (registrations.length === 0) {
            showMessage('No registrations to export', 'error')
            return
        }

        setActionLoading('export')
        try {
            // Prepare data for Excel
            const excelData = registrations.map((reg, index) => ({
                'S.No': index + 1,
                'Full Name': reg.full_name,
                'Reg Number': reg.reg_number,
                'Department': reg.dept || '',
                'Section': reg.section,
                'Email': reg.email,
                'Mobile': reg.mobile,
                'Registered At': new Date(reg.created_at).toLocaleString()
            }))

            // Create workbook and worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations')

            // Auto-size columns
            const maxWidth = 20
            worksheet['!cols'] = Object.keys(excelData[0] || {}).map(() => ({ wch: maxWidth }))

            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            saveAs(blob, `CREATEVERSE_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`)

            showMessage('Excel exported successfully')
        } catch (error) {
            showMessage('Export failed: ' + error.message, 'error')
        }
        setActionLoading('')
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="dashboard">
            <div className="dashboard-container">
                <motion.div
                    className="dashboard-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="header-content">
                        <h1>CREATEVERSE Admin</h1>
                        <p>Manage event registrations</p>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </motion.div>

                {message.text && (
                    <motion.div
                        className={`message ${message.type}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message.text}
                    </motion.div>
                )}

                <motion.div
                    className="dashboard-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <button
                        className={`action-btn ${isOpen ? 'open' : 'closed'}`}
                        onClick={handleToggleRegistrations}
                        disabled={actionLoading === 'toggle'}
                    >
                        {actionLoading === 'toggle' ? '...' : isOpen ? '🟢 Registrations Open' : '🔴 Registrations Closed'}
                    </button>

                    <button
                        className="action-btn refresh"
                        onClick={handleRefresh}
                        disabled={actionLoading === 'refresh'}
                    >
                        {actionLoading === 'refresh' ? '...' : '🔄 Refresh'}
                    </button>

                    <button
                        className="action-btn export"
                        onClick={handleExportExcel}
                        disabled={actionLoading === 'export'}
                    >
                        {actionLoading === 'export' ? '...' : '📊 Export Excel'}
                    </button>

                    <button
                        className="action-btn reset"
                        onClick={handleReset}
                        disabled={actionLoading === 'reset'}
                    >
                        {actionLoading === 'reset' ? '...' : '🗑️ Reset All'}
                    </button>
                </motion.div>

                <motion.div
                    className="stats-bar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="stat">
                        <strong>{registrations.length}</strong> Total Registrations
                    </span>
                </motion.div>

                <motion.div
                    className="table-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {loading ? (
                        <div className="loading">Loading registrations...</div>
                    ) : registrations.length === 0 ? (
                        <div className="empty">No registrations yet</div>
                    ) : (
                        <table className="registrations-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Full Name</th>
                                    <th>Reg Number</th>
                                    <th>Dept</th>
                                    <th>Section</th>
                                    <th>Email</th>
                                    <th>Mobile</th>
                                    <th>Registered At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map((reg, index) => (
                                    <tr key={reg.id}>
                                        <td>{index + 1}</td>
                                        <td>{reg.full_name}</td>
                                        <td>{reg.reg_number}</td>
                                        <td>{reg.dept || '-'}</td>
                                        <td>{reg.section}</td>
                                        <td>{reg.email}</td>
                                        <td>{reg.mobile}</td>
                                        <td>{new Date(reg.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

export default Dashboard
