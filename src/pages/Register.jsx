import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ClayButton from '../components/ClayButton'
import SuccessModal from '../components/SuccessModal'
import { submitRegistration, getSettings } from '../lib/supabase'
import './Register.css'

function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        regNumber: '',
        dept: '',
        section: '',
        email: '',
        mobile: ''
    })

    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [registrationsOpen, setRegistrationsOpen] = useState(true)
    const [checkingStatus, setCheckingStatus] = useState(true)

    useEffect(() => {
        checkRegistrationStatus()
    }, [])

    const checkRegistrationStatus = async () => {
        try {
            const isOpen = await getSettings()
            setRegistrationsOpen(isOpen)
        } catch (error) {
            console.error('Failed to check registration status:', error)
            // Default to open if we can't check
            setRegistrationsOpen(true)
        }
        setCheckingStatus(false)
    }

    const validateField = (name, value) => {
        switch (name) {
            case 'fullName':
                return value.trim() ? '' : 'Full name is required'
            case 'regNumber':
                return value.trim() ? '' : 'Registration number is required'
            case 'dept':
                return value.trim() ? '' : 'Department is required'
            case 'section':
                return value.trim() ? '' : 'Section is required'
            case 'email':
                if (!value.trim()) return 'Email is required'
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
                return ''
            case 'mobile':
                if (!value.trim()) return 'Mobile number is required'
                if (!/^\d{10}$/.test(value)) return 'Must be exactly 10 digits'
                return ''
            default:
                return ''
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
        }
    }

    const handleBlur = (e) => {
        const { name, value } = e.target
        setTouched(prev => ({ ...prev, [name]: true }))
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate all fields
        const newErrors = {}
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key])
            if (error) newErrors[key] = error
        })

        setErrors(newErrors)
        setTouched({
            fullName: true,
            regNumber: true,
            dept: true,
            section: true,
            email: true,
            mobile: true
        })

        if (Object.keys(newErrors).length > 0) {
            // Trigger shake animation on form
            document.querySelector('.register-form')?.classList.add('shake')
            setTimeout(() => {
                document.querySelector('.register-form')?.classList.remove('shake')
            }, 400)
            return
        }

        setLoading(true)

        try {
            await submitRegistration(formData)
            setShowSuccess(true)
            // Reset form
            setFormData({
                fullName: '',
                regNumber: '',
                dept: '',
                section: '',
                email: '',
                mobile: ''
            })
            setTouched({})
        } catch (error) {
            console.error('Registration failed:', error)
            alert('Registration failed. Please try again.')
        }

        setLoading(false)
    }

    const fields = [
        { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
        { name: 'regNumber', label: 'Registration Number', type: 'text', placeholder: 'Enter your registration number' },
        { name: 'dept', label: 'Department', type: 'text', placeholder: 'e.g., CSE, ECE, MECH' },
        { name: 'section', label: 'Section', type: 'text', placeholder: 'Enter your section' },
        { name: 'email', label: 'Email ID', type: 'email', placeholder: 'Enter your email address' },
        { name: 'mobile', label: 'Mobile / WhatsApp Number', type: 'tel', placeholder: '10-digit mobile number' }
    ]

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
                    <motion.div
                        className="register-card closed-card"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link to="/" className="back-link">
                            ← Back to Home
                        </Link>
                        <div className="closed-message">
                            <span className="closed-icon">🔒</span>
                            <h2>Registrations Closed</h2>
                            <p>Sorry, registrations for CREATEVERSE are currently closed. Please check back later!</p>
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
                    <Link to="/" className="back-link">
                        ← Back to Home
                    </Link>

                    <div className="register-header">
                        <h1>CREATEVERSE</h1>
                        <p>Registration Form</p>
                    </div>

                    <form className="register-form" onSubmit={handleSubmit}>
                        {fields.map((field, index) => (
                            <motion.div
                                key={field.name}
                                className="form-group"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                            >
                                <label htmlFor={field.name} className="form-label">
                                    {field.label} <span className="required">*</span>
                                </label>
                                <input
                                    type={field.type}
                                    id={field.name}
                                    name={field.name}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder={field.placeholder}
                                    className={`clay-input ${errors[field.name] && touched[field.name] ? 'error' : ''}`}
                                />
                                {errors[field.name] && touched[field.name] && (
                                    <motion.span
                                        className="error-message"
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors[field.name]}
                                    </motion.span>
                                )}
                            </motion.div>
                        ))}

                        <motion.div
                            className="form-actions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <ClayButton
                                type="submit"
                                size="large"
                                loading={loading}
                            >
                                Submit Registration
                            </ClayButton>
                        </motion.div>
                    </form>
                </motion.div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
            />
        </div>
    )
}

export default Register
