import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase, getAttendance, markAttendance, clearAttendance, getRegistrations } from '../lib/supabase'
import BarcodeScanner from '../components/BarcodeScanner'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import './Attendance.css'

function Attendance() {
    const navigate = useNavigate()
    const [attendance, setAttendance] = useState([])
    const [totalRegistered, setTotalRegistered] = useState(0)
    const [loading, setLoading] = useState(true)
    const [scanResult, setScanResult] = useState(null) // { type: 'success'|'error'|'duplicate', student, message }
    const [actionLoading, setActionLoading] = useState('')
    const [message, setMessage] = useState({ text: '', type: '' })
    const [scannerEnabled, setScannerEnabled] = useState(true)
    const [manualRegNumber, setManualRegNumber] = useState('')
    const [manualLoading, setManualLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [attendanceData, registrations] = await Promise.all([
                getAttendance(),
                getRegistrations()
            ])
            setAttendance(attendanceData)
            setTotalRegistered(registrations?.length || 0)
        } catch (error) {
            showMessage('Failed to load data: ' + error.message, 'error')
        }
        setLoading(false)
    }

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type })
        setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }

    // Debounce: prevent the same barcode from triggering twice rapidly
    const lastScanRef = useRef({ value: '', time: 0 })

    const handleScanSuccess = async (decodedText) => {
        // Sanitize: strip invisible chars, collapse whitespace
        const regNumber = String(decodedText)
            .trim()
            .replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\u200B-\u200D\u2060]/g, '')
            .replace(/\s+/g, ' ')
            .trim()

        // Reject empty or obviously invalid scans
        if (!regNumber || regNumber.length < 2) {
            setScanResult({
                type: 'error',
                student: null,
                message: `❌ Invalid scan — no readable data detected`
            })
            setTimeout(() => setScanResult(null), 3000)
            return
        }

        // Debounce: skip if same value scanned within 3 seconds
        const now = Date.now()
        if (
            regNumber === lastScanRef.current.value &&
            now - lastScanRef.current.time < 3000
        ) {
            return // silently skip duplicate rapid scan
        }
        lastScanRef.current = { value: regNumber, time: now }

        try {
            const result = await markAttendance(regNumber)
            setScanResult({
                type: 'success',
                student: result.student,
                message: `✅ ${result.student.full_name} checked in!`
            })
            // Refresh attendance list
            const updated = await getAttendance()
            setAttendance(updated)

            // Auto-clear result after 3s
            setTimeout(() => setScanResult(null), 3000)
        } catch (error) {
            if (error.message === 'NOT_FOUND') {
                setScanResult({
                    type: 'error',
                    student: null,
                    message: `❌ Reg. number "${regNumber}" not found in registrations`
                })
            } else if (error.message === 'ALREADY_CHECKED_IN') {
                setScanResult({
                    type: 'duplicate',
                    student: null,
                    message: `⚠️ "${regNumber}" is already checked in`
                })
            } else if (error.message === 'INVALID_INPUT') {
                setScanResult({
                    type: 'error',
                    student: null,
                    message: `❌ Invalid input — could not parse barcode data`
                })
            } else {
                setScanResult({
                    type: 'error',
                    student: null,
                    message: `❌ Error: ${error.message}`
                })
            }
            setTimeout(() => setScanResult(null), 3000)
        }
    }

    const handleManualEntry = async () => {
        const regNum = manualRegNumber.trim()
        if (!regNum) return
        setManualLoading(true)
        await handleScanSuccess(regNum)
        setManualRegNumber('')
        setManualLoading(false)
    }

    const handleManualKeyDown = (e) => {
        if (e.key === 'Enter') handleManualEntry()
    }

    const handleClearAttendance = async () => {
        if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL attendance records? This cannot be undone!')) {
            return
        }
        setActionLoading('clear')
        try {
            await clearAttendance()
            setAttendance([])
            showMessage('All attendance records cleared')
        } catch (error) {
            showMessage('Failed to clear: ' + error.message, 'error')
        }
        setActionLoading('')
    }

    const handleExportAttendance = () => {
        if (attendance.length === 0) {
            showMessage('No attendance records to export', 'error')
            return
        }

        setActionLoading('export')
        try {
            const excelData = attendance.map((record, index) => ({
                'S.No': index + 1,
                'Reg Number': record.reg_number,
                'Full Name': record.full_name || '',
                'Department': record.dept || '',
                'Year': record.year || '',
                'Section': record.section || '',
                'Checked In At': new Date(record.checked_in_at).toLocaleString()
            }))

            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

            const maxWidth = 20
            worksheet['!cols'] = Object.keys(excelData[0] || {}).map(() => ({ wch: maxWidth }))

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            saveAs(blob, `CREATEVERSE_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`)

            showMessage('Attendance exported successfully')
        } catch (error) {
            showMessage('Export failed: ' + error.message, 'error')
        }
        setActionLoading('')
    }

    const handleRefresh = async () => {
        setActionLoading('refresh')
        await loadData()
        showMessage('Data refreshed successfully')
        setActionLoading('')
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="attendance-page">
            <div className="attendance-container">
                {/* Header */}
                <motion.div
                    className="attendance-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="header-content">
                        <h1>📷 Attendance Scanner</h1>
                        <p>Scan student ID barcodes to mark attendance</p>
                    </div>
                    <div className="header-actions">
                        <button className="nav-btn" onClick={() => navigate('/admin')}>
                            📋 Dashboard
                        </button>
                        <button className="nav-btn logout" onClick={handleLogout}>
                            🚪 Logout
                        </button>
                    </div>
                </motion.div>

                {message.text && (
                    <motion.div
                        className={`att-message ${message.type}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {message.text}
                    </motion.div>
                )}

                {/* Scanner Section */}
                <motion.div
                    className="scanner-section"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="scanner-toggle">
                        <button
                            className={`toggle-btn ${scannerEnabled ? 'active' : ''}`}
                            onClick={() => setScannerEnabled(!scannerEnabled)}
                        >
                            {scannerEnabled ? '⏸️ Pause Scanner' : '▶️ Resume Scanner'}
                        </button>
                    </div>

                    {scannerEnabled && (
                        <BarcodeScanner
                            onScanSuccess={handleScanSuccess}
                            enabled={scannerEnabled}
                        />
                    )}

                    {/* Scan Result Feedback */}
                    <AnimatePresence>
                        {scanResult && (
                            <motion.div
                                className={`scan-feedback ${scanResult.type}`}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <p className="scan-feedback-message">{scanResult.message}</p>
                                {scanResult.student && (
                                    <div className="scan-student-info">
                                        <span>{scanResult.student.dept} • Year {scanResult.student.year} • Section {scanResult.student.section}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Manual Entry */}
                    <div className="manual-entry-section">
                        <h3>Or enter manually</h3>
                        <div className="manual-entry-row">
                            <input
                                type="text"
                                className="manual-input"
                                placeholder="Enter Registration Number"
                                value={manualRegNumber}
                                onChange={(e) => setManualRegNumber(e.target.value)}
                                onKeyDown={handleManualKeyDown}
                                disabled={manualLoading}
                            />
                            <button
                                className="action-btn mark-present"
                                onClick={handleManualEntry}
                                disabled={manualLoading || !manualRegNumber.trim()}
                            >
                                {manualLoading ? '...' : '✅ Mark Present'}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats & Actions */}
                <motion.div
                    className="att-stats-bar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="att-stats">
                        <div className="att-stat">
                            <strong>{attendance.length}</strong>
                            <span>Present</span>
                        </div>
                        <div className="att-stat-divider">/</div>
                        <div className="att-stat">
                            <strong>{totalRegistered}</strong>
                            <span>Registered</span>
                        </div>
                    </div>

                    <div className="att-actions">
                        <button
                            className="action-btn refresh"
                            onClick={handleRefresh}
                            disabled={actionLoading === 'refresh'}
                        >
                            {actionLoading === 'refresh' ? '...' : '🔄 Refresh'}
                        </button>
                        <button
                            className="action-btn export"
                            onClick={handleExportAttendance}
                            disabled={actionLoading === 'export'}
                        >
                            {actionLoading === 'export' ? '...' : '📊 Export'}
                        </button>
                        <button
                            className="action-btn reset"
                            onClick={handleClearAttendance}
                            disabled={actionLoading === 'clear'}
                        >
                            {actionLoading === 'clear' ? '...' : '🗑️ Clear All'}
                        </button>
                    </div>
                </motion.div>

                {/* Attendance Table */}
                <motion.div
                    className="att-table-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {loading ? (
                        <div className="loading">Loading attendance...</div>
                    ) : attendance.length === 0 ? (
                        <div className="empty">No attendance records yet — start scanning!</div>
                    ) : (
                        <table className="att-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Name</th>
                                    <th>Reg Number</th>
                                    <th>Dept</th>
                                    <th>Year</th>
                                    <th>Section</th>
                                    <th>Checked In</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map((record, index) => (
                                    <motion.tr
                                        key={record.id}
                                        initial={index === 0 ? { backgroundColor: 'rgba(125, 211, 168, 0.3)' } : {}}
                                        animate={{ backgroundColor: 'transparent' }}
                                        transition={{ duration: 2 }}
                                    >
                                        <td>{index + 1}</td>
                                        <td>{record.full_name}</td>
                                        <td>{record.reg_number}</td>
                                        <td>{record.dept || '-'}</td>
                                        <td>{record.year || '-'}</td>
                                        <td>{record.section || '-'}</td>
                                        <td>{new Date(record.checked_in_at).toLocaleTimeString()}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

export default Attendance
