import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import './SuccessModal.css'

function SuccessModal({ isOpen, onClose }) {
    const [confetti, setConfetti] = useState([])
    const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/HWylsCG12XO8eBl4AziVnX?mode=gi_t'

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

            // Auto close after 10 seconds
            const timer = setTimeout(() => {
                onClose()
            }, 10000)

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
                    <a
                        href={WHATSAPP_GROUP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-btn"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Join WhatsApp Group
                    </a>
                </motion.div>
            </motion.div>
        </>
    )
}

export default SuccessModal
