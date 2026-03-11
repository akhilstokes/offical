import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './HistoryPage.css';

const HistoryPage = () => {
    const [isVisible, setIsVisible] = useState({});

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
                        entry.target.classList.add('reveal');
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('[data-reveal]').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const milestones = [
        {
            year: '1995',
            title: 'Foundational Roots',
            desc: 'Established as a boutique rubber unit with a commitment to quality and local community growth.',
            icon: 'fa-seedling'
        },
        {
            year: '2005',
            title: 'Global Certification',
            desc: 'Achieved international quality benchmarks, opening doors to global export markets.',
            icon: 'fa-certificate'
        },
        {
            year: '2015',
            title: 'Digital Paradigm',
            desc: 'Launched comprehensive ERP solutions, bridging traditional craft with modern efficiency.',
            icon: 'fa-microchip'
        },
        {
            year: '2025',
            title: 'Industry Vanguard',
            desc: 'Leading the smart manufacturing era with AI-integrated operations and sustainability.',
            icon: 'fa-trophy'
        }
    ];

    return (
        <div className="journey-redesign-root">
            <Navbar />

            {/* Split Hero Section */}
            <section className="journey-hero-modern">
                <div className="container">
                    <div className="hero-split-grid">
                        <div className="hero-left" data-reveal id="hero-title">
                            <h1>Our Journey</h1>
                        </div>
                        <div className="hero-right" data-reveal id="hero-desc">
                            <p>Three decades of innovation, growth, and excellence in rubber manufacturing and smart technology solutions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeless Milestones */}
            <section className="milestones-modern">
                <div className="container">
                    <div className="milestone-head" data-reveal id="milestone-head">
                        <span className="subtitle-premium">Succession of Excellence</span>
                        <h2>Our Milestones</h2>
                        <p>From humble beginnings to industry leadership</p>
                    </div>

                    <div className="timeline-v2-container">
                        <div className="timeline-central-line"></div>
                        {milestones.map((m, i) => (
                            <div key={i} className={`milestone-node ${i % 2 === 0 ? 'left' : 'right'}`} data-reveal id={`node-${i}`}>
                                <div className="node-marker">
                                    <span>{m.year}</span>
                                </div>
                                <div className="milestone-glass-card">
                                    <div className="card-icon">
                                        <i className={`fas ${m.icon}`}></i>
                                    </div>
                                    <h3>{m.title}</h3>
                                    <p>{m.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Future Vision Section */}
            <section className="vision-journey-premium">
                <div className="container">
                    <div className="vision-card-modern">
                        <div className="vision-grid">
                            <div className="vision-content-wrap" data-reveal id="vision-text">
                                <span className="tag-modern">Vision 2030</span>
                                <h2>Sculpting the Future of Latex</h2>
                                <p>
                                    As we look ahead, Holy Family Polymers remains committed to pushing the boundaries of innovation. Our goal is to set new industry standards through intelligent automation and sustainable practices.
                                </p>
                                <div className="vision-perks">
                                    <div className="perk"><i className="fas fa-leaf"></i> Zero Waste</div>
                                    <div className="perk"><i className="fas fa-robot"></i> AI-Operations</div>
                                </div>
                            </div>
                            <div className="vision-image-wrap" data-reveal id="vision-img">
                                <img src="/images/holy5.jpg" alt="Future Horizon" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default HistoryPage;
