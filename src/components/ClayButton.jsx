import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './ClayButton.css'

function ClayButton({
    children,
    to,
    onClick,
    type = 'button',
    variant = 'default',
    size = 'default',
    loading = false,
    disabled = false,
    glow = false,
    className = ''
}) {
    const buttonClasses = `
    clay-btn 
    clay-btn--${variant} 
    clay-btn--${size}
    ${glow ? 'clay-btn--glow' : ''}
    ${loading ? 'clay-btn--loading' : ''}
    ${className}
  `.trim()

    const buttonContent = (
        <>
            {loading && <span className="spinner"></span>}
            <span className={loading ? 'btn-text-hidden' : ''}>{children}</span>
        </>
    )

    const motionProps = {
        whileHover: { y: -3 },
        whileTap: { scale: 0.96 },
        transition: { duration: 0.2 }
    }

    if (to) {
        return (
            <motion.div {...motionProps}>
                <Link to={to} className={buttonClasses}>
                    {buttonContent}
                </Link>
            </motion.div>
        )
    }

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={buttonClasses}
            {...motionProps}
        >
            {buttonContent}
        </motion.button>
    )
}

export default ClayButton
