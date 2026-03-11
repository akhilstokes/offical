import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './AboutPage.css';

const AboutPage = () => {
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

    const pillars = [
        {
            title: 'Uncompromised Quality',
            desc: 'State-of-the-art laboratory testing ensuring consistently high Dry Rubber Content (DRC).',
            icon: 'fa-check-circle'
        },
        {
            title: 'Heritage & Trust',
            desc: 'A quarter-century legacy of being India’s premier natural rubber supplier.',
            icon: 'fa-history'
        },
        {
            title: 'Smart Innovation',
            desc: 'Integrating AI-driven ERP and real-time tracking into traditional manufacturing.',
            icon: 'fa-lightbulb'
        }
    ];

    return (
        <div className="about-redesign-root">
            <Navbar />

            {/* Premium Hero Section */}
            <section className="about-hero-modern">
                <div className="container">
                    <div className="about-hero-grid">
                        <div className="hero-text-side" data-reveal id="about-hero-text">
                            <span className="subtitle-brand">About Us</span>
                            <h1>Architects of <span className="text-highlight">Modern Latex</span></h1>
                            <p>
                                Shaping the industry for 25 years with a perfect blend of natural resources and high-tech precision.
                            </p>
                        </div>
                        <div className="hero-visual-side" data-reveal id="about-hero-viz">
                            <div className="glass-feature-card">
                                <img src="/images/holy1.jpg" alt="Manufacturing Core" />
                                <div className="card-badge">Est. 1999</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Strategic Pillars Grid */}
            <section className="pillars-section-premium">
                <div className="container">
                    <div className="section-head-modern" data-reveal id="pillars-head">
                        <h2>Our Foundation</h2>
                        <p>Built on ethics, sustained by technology.</p>
                    </div>

                    <div className="pillars-grid-modern">
                        {pillars.map((p, i) => (
                            <div key={i} className="pillar-card-glass" data-reveal id={`pillar-${i}`}>
                                <div className="pillar-icon-wrap">
                                    <i className={`fas ${p.icon}`}></i>
                                </div>
                                <h3>{p.title}</h3>
                                <p>{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Detailed Narrative Section */}
            <section className="narrative-section">
                <div className="container">
                    <div className="narrative-container-modern" data-reveal id="about-narrative">
                        <div className="narrative-block">
                            <h3>Leading the Way in Indian Rubber</h3>
                            <p>
                                The Holy Family Polymers group, headquartered in Kooroppada, Kottayam, has been at the forefront of natural rubber processing for over two decades. What started as a local initiative has grown into a leading producer of centrifuged latex, serving global markets with unwavering quality.
                            </p>
                        </div>
                        <div className="narrative-block">
                            <h3>Direct Link to Farms</h3>
                            <p>
                                By managing extensive rubber plantation holdings and maintaining a direct link with local farmers, we ensure a sustainable and premium raw material supply. Our facility is equipped with modern centrifugal machinery and a dedicated quality-control laboratory.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="about-cta-modern">
                <div className="container">
                    <div className="cta-box-premium" data-reveal id="about-cta">
                        <h2>Experience Industrial Excellence</h2>
                        <div className="cta-action-row">
                            <Link to="/products" className="btn-modern primary">Browse Products</Link>
                            <Link to="/contact" className="btn-modern outline">Talk to Experts</Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AboutPage;
