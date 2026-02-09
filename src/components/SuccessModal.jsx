import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import './SuccessModal.css'

function SuccessModal({ isOpen, onClose }) {
    const [confetti, setConfetti] = useState([])

    useEffect(() => {
        if (isOpen) {
            // Generate confetti pieces
            const pieces = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                color: ['#9B8FCE', '#E8E0F0', '#D4E4F7', '#F7D4E4', '#D4F7E8'][Math.floor(Math.random() * 5)],
                rotation: Math.random() * 360,
                size: Math.random() * 8 + 6
            }))
            setConfetti(pieces)

            // Auto close after 4 seconds
            const timer = setTimeout(() => {
                onClose()
            }, 4000)

            return () => clearTimeout(timer)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <>
            {/* Confetti */}
            <div className="confetti">
                {confetti.map((piece) => (
                    <div
                        key={piece.id}
                        className="confetti-piece"
                        style={{
                            left: `${piece.left}%`,
                            animationDelay: `${piece.delay}s`,
                            backgroundColor: piece.color,
                            width: `${piece.size}px`,
                            height: `${piece.size}px`,
                            transform: `rotate(${piece.rotation}deg)`
                        }}
                    />
                ))}
            </div>

            {/* Modal */}
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="success-modal"
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        className="success-icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                    >
                        ✓
                    </motion.div>
                    <h2>Registration Successful!</h2>
                    <p>See you at CREATEVERSE.</p>
                </motion.div>
            </motion.div>
        </>
    )
}

export default SuccessModal
