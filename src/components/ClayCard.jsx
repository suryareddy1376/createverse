import { motion } from 'framer-motion'
import './ClayCard.css'

function ClayCard({ children, className = '', delay = 0, icon, title }) {
    return (
        <motion.div
            className={`clay-card-component ${className}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={{ y: -4 }}
        >
            {icon && (
                <div className="clay-card-icon">{icon}</div>
            )}
            {title && (
                <h3 className="clay-card-title">{title}</h3>
            )}
            <div className="clay-card-content">
                {children}
            </div>
        </motion.div>
    )
}

export default ClayCard
