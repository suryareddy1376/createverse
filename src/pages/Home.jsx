import { motion } from 'framer-motion'
import ClayCard from '../components/ClayCard'
import ClayButton from '../components/ClayButton'
import './Home.css'

// Logo from public folder
const logoUrl = '/kare-logo.png'

function Home() {
    const eventDetails = [
        { icon: '📅', title: 'Date & Time', content: ['14th February', '11:00 AM'] },
        { icon: '📍', title: 'Venue', content: ['9th Block'] },
        { icon: '🎤', title: 'Chief Guest', content: ['Hari Prasad'] }
    ]

    const officials = [
        {
            category: '👑 Chief Patrons',
            members: [
                { name: 'Illayavallal Dr. K. Sridharan', role: 'Chancellor' },
                { name: 'Dr. S. Shasi Anand', role: 'Vice President (Academic)' }
            ]
        },
        {
            category: '🎖 Patrons',
            members: [
                { name: 'Dr. S. P. Balakannan', role: 'Director / Student Affairs' }
            ]
        },
        {
            category: '🎯 Convenors',
            members: [
                { name: 'Dr. P. Siva Kumar', role: 'Dean / SEET' },
                { name: 'Dr. J. Charles Pravin', role: 'HOD / ECE' }
            ]
        },
        {
            category: '🎓 Faculty Advisor',
            members: [
                { name: 'Dr. Jayalakshmi M', role: 'Associate Professor / CSE' }
            ]
        },
        {
            category: '📌 Faculty Coordinator',
            members: [
                { name: 'Mrs. Loyala Jasmin J', role: 'Assistant Professor / ECE' }
            ]
        }
    ]

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <motion.div
                        className="hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <img
                            src={logoUrl}
                            alt="Kalasalingam Academy of Research and Education"
                            className="hero-logo"
                        />
                        <p className="hero-university">
                            Kalasalingam Academy of Research and Education
                        </p>
                        <p className="hero-department">
                            School of Computing – Department of CSE
                        </p>

                        <motion.h1
                            className="hero-title"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            CREATEVERSE
                        </motion.h1>

                        <motion.h2
                            className="hero-club-name"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.7 }}
                        >
                            <span className="rainbow-text">Campus Creative Club</span>
                        </motion.h2>

                        <motion.p
                            className="hero-subtitle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.6 }}
                        >
                            Launch Event
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.5 }}
                        >
                            <button
                                className="explore-btn"
                                onClick={() => document.getElementById('event-details').scrollIntoView({ behavior: 'smooth' })}
                            >
                                <span>Explore Event</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M19 12l-7 7-7-7" />
                                </svg>
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Event Details Section */}
            <section id="event-details" className="section event-details">
                <div className="container">
                    <motion.h2
                        className="section-title"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Event Details
                    </motion.h2>

                    <div className="event-grid">
                        {eventDetails.map((item, index) => (
                            <ClayCard
                                key={item.title}
                                icon={item.icon}
                                title={item.title}
                                delay={index * 0.1}
                            >
                                {item.content.map((line, i) => (
                                    <p key={i}><strong>{line}</strong></p>
                                ))}
                            </ClayCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Officials Section - Compact List Layout */}
            <section className="section officials">
                <div className="container">
                    <motion.h2
                        className="section-title"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Event Officials
                    </motion.h2>

                    <motion.div
                        className="officials-card"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="officials-list">
                            {officials.map((group, index) => (
                                <motion.div
                                    key={group.category}
                                    className="officials-group"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.4 }}
                                >
                                    <div className="group-header">
                                        <span className="group-icon">{group.category.split(' ')[0]}</span>
                                        <span className="group-title">{group.category.slice(2)}</span>
                                    </div>
                                    <ul className="members-list">
                                        {group.members.map((member) => (
                                            <li key={member.name} className="member-item">
                                                <span className="member-name">{member.name}</span>
                                                <span className="member-role">{member.role}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="section cta-section">
                <div className="container text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="cta-title">Ready to Join?</h2>
                        <p className="cta-subtitle">Be part of the creative revolution!</p>
                        <ClayButton to="/register" size="large" glow>
                            Register Now
                        </ClayButton>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default Home
