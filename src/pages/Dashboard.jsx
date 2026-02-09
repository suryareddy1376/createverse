import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase, getRegistrations, deleteAllRegistrations, getSettings, setRegistrationsOpen } from '../lib/supabase'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel } from 'docx'
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

    const handleExportDocx = async () => {
        if (registrations.length === 0) {
            showMessage('No registrations to export', 'error')
            return
        }

        setActionLoading('export')
        try {
            const tableRows = [
                // Header row
                new TableRow({
                    children: ['S.No', 'Full Name', 'Reg Number', 'Section', 'Email', 'Mobile'].map(text =>
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text, bold: true })],
                                alignment: AlignmentType.CENTER
                            })],
                            shading: { fill: '9B8FCE' }
                        })
                    )
                }),
                // Data rows
                ...registrations.map((reg, index) =>
                    new TableRow({
                        children: [
                            String(index + 1),
                            reg.full_name,
                            reg.reg_number,
                            reg.section,
                            reg.email,
                            reg.mobile
                        ].map(text =>
                            new TableCell({
                                children: [new Paragraph({ text: text || '' })]
                            })
                        )
                    })
                )
            ]

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: 'CREATEVERSE - Registration List',
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            text: `Campus Creative Club Launch Event`,
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            text: `Generated on: ${new Date().toLocaleString()}`,
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({ text: '' }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: tableRows
                        }),
                        new Paragraph({ text: '' }),
                        new Paragraph({
                            text: `Total Registrations: ${registrations.length}`,
                            alignment: AlignmentType.RIGHT
                        })
                    ]
                }]
            })

            const blob = await Packer.toBlob(doc)
            saveAs(blob, `CREATEVERSE_Registrations_${new Date().toISOString().split('T')[0]}.docx`)
            showMessage('DOCX exported successfully')
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
                        onClick={handleExportDocx}
                        disabled={actionLoading === 'export'}
                    >
                        {actionLoading === 'export' ? '...' : '📄 Export DOCX'}
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
