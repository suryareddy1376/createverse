import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import ClayButton from '../components/ClayButton'
import SuccessModal from '../components/SuccessModal'
import { submitRegistration, getSettings, checkCanRegister } from '../lib/supabase'
import './Register.css'

const MEMBER_TEMPLATE = {
    fullName: '',
    regNumber: '',
    gender: 'Male',
    dept: '',
    year: '1st Year',
    section: '',
    email: '',
    mobile: ''
}

function Register() {
    const [teamName, setTeamName] = useState('')
    const [members, setMembers] = useState(Array(4).fill(null).map(() => ({ ...MEMBER_TEMPLATE })))
    const [expandedMember, setExpandedMember] = useState(0) // Index of currently expanded member

    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [registrationsOpen, setRegistrationsOpen] = useState(true)
    const [limitReached, setLimitReached] = useState(false)
    const [limitInfo, setLimitInfo] = useState({ currentCount: 0, limit: 0 })
    const [checkingStatus, setCheckingStatus] = useState(true)

    useEffect(() => {
        checkRegistrationStatus()
    }, [])

    const checkRegistrationStatus = async () => {
        try {
            const [isOpen, canRegisterInfo] = await Promise.all([
                getSettings(),
                checkCanRegister()
            ])
            setRegistrationsOpen(isOpen)
            setLimitReached(!canRegisterInfo.canRegister)
            setLimitInfo({ currentCount: canRegisterInfo.currentCount, limit: canRegisterInfo.limit })
        } catch (error) {
            console.error('Failed to check registration status:', error)
            setRegistrationsOpen(true)
        }
        setCheckingStatus(false)
    }

    const validateField = (name, value) => {
        if (!value) return 'Required'
        const strVal = String(value).trim()
        if (!strVal) return 'Required'

        if (name === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) return 'Invalid email format'
        }
        if (name === 'mobile') {
            if (!/^\d{10}$/.test(strVal)) return 'Must be 10 digits'
        }
        return ''
    }

    const handleTeamNameChange = (e) => {
        setTeamName(e.target.value)
        if (touched.teamName) {
            setErrors(prev => ({
                ...prev,
                teamName: e.target.value.trim() ? '' : 'Team Name is required'
            }))
        }
    }

    const handleMemberChange = (index, field, value) => {
        setMembers(prev => {
            const newMembers = [...prev]
            newMembers[index] = { ...newMembers[index], [field]: value }
            return newMembers
        })

        if (touched[`member_${index}_${field}`]) {
            setErrors(prev => ({
                ...prev,
                [`member_${index}_${field}`]: validateField(field, value)
            }))
        }
    }

    const handleBlur = (index, field) => {
        const key = index === -1 ? 'teamName' : `member_${index}_${field}`
        setTouched(prev => ({ ...prev, [key]: true }))

        if (index === -1) {
            setErrors(prev => ({ ...prev, teamName: teamName.trim() ? '' : 'Team Name is required' }))
        } else {
            const value = members[index][field]
            setErrors(prev => ({ ...prev, [key]: validateField(field, value) }))
        }
    }

    const toggleMember = (index) => {
        if (expandedMember === index) {
            setExpandedMember(-1)
        } else {
            setExpandedMember(index)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const newErrors = {}
        const newTouched = { teamName: true }

        // Validate Team Name
        if (!teamName.trim()) newErrors.teamName = 'Team Name is required'

        // Validate Members
        members.forEach((member, idx) => {
            Object.keys(member).forEach(key => {
                newTouched[`member_${idx}_${key}`] = true
                const error = validateField(key, member[key])
                if (error) newErrors[`member_${idx}_${key}`] = error
            })
        })

        setErrors(newErrors)
        setTouched(newTouched)

        if (Object.keys(newErrors).length > 0) {
            // Find first error and expand that member
            const firstErrorKey = Object.keys(newErrors)[0]
            if (firstErrorKey.startsWith('member_')) {
                const memberIdx = parseInt(firstErrorKey.split('_')[1])
                setExpandedMember(memberIdx)
            }

            document.querySelector('.register-form')?.classList.add('shake')
            setTimeout(() => {
                document.querySelector('.register-form')?.classList.remove('shake')
            }, 400)
            return
        }

        setLoading(true)

        try {
            await submitRegistration({ teamName }, members)
            setShowSuccess(true)
            setTeamName('')
            setMembers(Array(4).fill(null).map(() => ({ ...MEMBER_TEMPLATE })))
            setTouched({})
            setExpandedMember(0)
        } catch (error) {
            console.error('Registration failed:', error)
            alert(error.message || 'Registration failed. Please try again.')
        }

        setLoading(false)
    }

    if (checkingStatus) {
        return (
            <div className="register-page">
                <div className="container">
                    <div className="register-card">
                        <div className="loading-status">Checking registration status...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (!registrationsOpen) {
        return (
            <div className="register-page">
                <div className="container">
                    <motion.div className="register-card closed-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <Link to="/" className="back-link">← Back to Home</Link>
                        <div className="closed-message">
                            <span className="closed-icon">🔒</span>
                            <h2>Registrations Closed</h2>
                            <p>Sorry, registrations for CREATEVERSE are currently closed.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    if (limitReached) {
        return (
            <div className="register-page">
                <div className="container">
                    <motion.div className="register-card closed-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <Link to="/" className="back-link">← Back to Home</Link>
                        <div className="closed-message">
                            <span className="closed-icon">📊</span>
                            <h2>Registrations Full</h2>
                            <p>We've reached the maximum limit of {limitInfo.limit} teams.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="register-page">
            <div className="container">
                <motion.div
                    className="register-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Link to="/" className="back-link">← Back to Home</Link>

                    <div className="register-header">
                        <h1>CREATEVERSE</h1>
                        <p>Team Registration (4 Members)</p>
                    </div>

                    <form className="register-form" onSubmit={handleSubmit}>
                        {/* Team Name Section */}
                        <div className="form-group">
                            <label className="form-label">Team Name <span className="required">*</span></label>
                            <input
                                type="text"
                                value={teamName}
                                onChange={handleTeamNameChange}
                                onBlur={() => handleBlur(-1, 'teamName')}
                                placeholder="Enter your team name"
                                className={`clay-input ${errors.teamName && touched.teamName ? 'error' : ''}`}
                            />
                            {errors.teamName && touched.teamName && (
                                <span className="error-message">{errors.teamName}</span>
                            )}
                        </div>

                        {/* Members Accordion */}
                        <div className="members-accordion">
                            {members.map((member, index) => (
                                <div key={index} className={`member-section ${expandedMember === index ? 'expanded' : ''}`}>
                                    <div
                                        className="member-header"
                                        onClick={() => toggleMember(index)}
                                    >
                                        <h3>
                                            {index === 0 ? '👑 Team Leader' : `👤 Team Member ${index}`}
                                            {member.fullName && <span className="member-preview"> - {member.fullName}</span>}
                                        </h3>
                                        <span className="toggle-icon">{expandedMember === index ? '−' : '+'}</span>
                                    </div>

                                    <AnimatePresence>
                                        {expandedMember === index && (
                                            <motion.div
                                                className="member-content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="form-grid">
                                                    <div className="form-group">
                                                        <label>Full Name *</label>
                                                        <input
                                                            type="text"
                                                            value={member.fullName}
                                                            onChange={(e) => handleMemberChange(index, 'fullName', e.target.value)}
                                                            onBlur={() => handleBlur(index, 'fullName')}
                                                            className={`clay-input ${errors[`member_${index}_fullName`] ? 'error' : ''}`}
                                                        />
                                                        {errors[`member_${index}_fullName`] && <span className="error-message">{errors[`member_${index}_fullName`]}</span>}
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Registration Number *</label>
                                                        <input
                                                            type="number"
                                                            value={member.regNumber}
                                                            onChange={(e) => handleMemberChange(index, 'regNumber', e.target.value)}
                                                            onBlur={() => handleBlur(index, 'regNumber')}
                                                            className={`clay-input ${errors[`member_${index}_regNumber`] ? 'error' : ''}`}
                                                        />
                                                        {errors[`member_${index}_regNumber`] && <span className="error-message">{errors[`member_${index}_regNumber`]}</span>}
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Gender *</label>
                                                        <select
                                                            value={member.gender}
                                                            onChange={(e) => handleMemberChange(index, 'gender', e.target.value)}
                                                            className="clay-input"
                                                        >
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Department *</label>
                                                        <input
                                                            type="text"
                                                            value={member.dept}
                                                            onChange={(e) => handleMemberChange(index, 'dept', e.target.value)}
                                                            onBlur={() => handleBlur(index, 'dept')}
                                                            className={`clay-input ${errors[`member_${index}_dept`] ? 'error' : ''}`}
                                                        />
                                                        {errors[`member_${index}_dept`] && <span className="error-message">{errors[`member_${index}_dept`]}</span>}
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Year *</label>
                                                        <select
                                                            value={member.year}
                                                            onChange={(e) => handleMemberChange(index, 'year', e.target.value)}
                                                            className="clay-input"
                                                        >
                                                            <option value="1st Year">1st Year</option>
                                                            <option value="2nd Year">2nd Year</option>
                                                            <option value="3rd Year">3rd Year</option>
                                                            <option value="4th Year">4th Year</option>
                                                        </select>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Section *</label>
                                                        <input
                                                            type="text"
                                                            value={member.section}
                                                            onChange={(e) => handleMemberChange(index, 'section', e.target.value)}
                                                            onBlur={() => handleBlur(index, 'section')}
                                                            className={`clay-input ${errors[`member_${index}_section`] ? 'error' : ''}`}
                                                        />
                                                        {errors[`member_${index}_section`] && <span className="error-message">{errors[`member_${index}_section`]}</span>}
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Email ID *</label>
                                                        <input
                                                            type="email"
                                                            value={member.email}
                                                            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                                                            onBlur={() => handleBlur(index, 'email')}
                                                            className={`clay-input ${errors[`member_${index}_email`] ? 'error' : ''}`}
                                                        />
                                                        {errors[`member_${index}_email`] && <span className="error-message">{errors[`member_${index}_email`]}</span>}
                                                    </div>

                                                    <div className="form-group">
                                                        <label>WhatsApp Number *</label>
                                                        <input
                                                            type="tel"
                                                            value={member.mobile}
                                                            onChange={(e) => handleMemberChange(index, 'mobile', e.target.value)}
                                                            onBlur={() => handleBlur(index, 'mobile')}
                                                            placeholder="10 digits"
                                                            className={`clay-input ${errors[`member_${index}_mobile`] ? 'error' : ''}`}
                                                        />
                                                        {errors[`member_${index}_mobile`] && <span className="error-message">{errors[`member_${index}_mobile`]}</span>}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        <div className="form-actions">
                            <ClayButton type="submit" size="large" loading={loading}>
                                Submit Team Registration
                            </ClayButton>
                        </div>
                    </form>
                </motion.div>
            </div>
            <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} />
        </div>
    )
}

export default Register
