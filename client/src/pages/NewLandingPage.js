import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './NewLandingPage.css';

const NewLandingPage = () => {
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

    const features = [
        {
            icon: 'fa-microchip',
            title: 'AI-Driven Analytics',
            desc: 'Real-time data processing for predictive manufacturing insights.',
            delay: '0.1s'
        },
        {
            icon: 'fa-fingerprint',
            title: 'Secure Access Control',
            desc: 'Advanced role-based encryption protecting your critical data.',
            delay: '0.2s'
        },
        {
            icon: 'fa-globe',
            title: 'Global Supply Chain',
            desc: 'Seamlessly track barrel movements across international borders.',
            delay: '0.3s'
        }
    ];

    return (
        <div className="landing-redesign-root">
            <Navbar />

            {/* Premium Hero Section */}
            <section className="hero-modern">
                <div className="hero-glow-blob"></div>
                <div className="container-hero">
                    <div className="hero-text-wrap" data-reveal id="hero-main">
                        <div className="hero-top-tag">
                            <span className="dot-pulse"></span>
                            Trusted by Global Leaders Since 1999
                        </div>
                        <h1>
                            Modernize Your <span className="text-highlight">Industrial Legacy</span>
                        </h1>
                        <p>
                            The ultimate ERP ecosystem for rubber latex manufacturing. Precision, automation, and intelligent scaling in one unified platform.
                        </p>
                        <div className="hero-actions-new">
                            <Link to="/register" className="btn-premium primary">
                                Get Started Free <i className="fas fa-arrow-right"></i>
                            </Link>
                            <Link to="/about" className="btn-premium secondary">
                                Explore Vision
                            </Link>
                        </div>
                    </div>

                    <div className="hero-visual-premium">
                        <div className="glass-card main-mockup">
                            <img src="/images/holy1.jpg" alt="Platform Dashboard" />
                            <div className="glass-overlay"></div>
                        </div>
                        <div className="floating-bubble-card stat-1" data-reveal id="stat-1">
                            <h3>25+</h3>
                            <p>Years of Excellence</p>
                        </div>
                        <div className="floating-bubble-card stat-2" data-reveal id="stat-2">
                            <h3>100%</h3>
                            <p>Data Accuracy</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Industrial Statistics Section */}
            <section className="stats-strip">
                <div className="container">
                    <div className="stats-flex-modern">
                        <div className="stat-unit">
                            <h4>500+</h4>
                            <span>MT Capacity</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-unit">
                            <h4>2000+</h4>
                            <span>Registered Partners</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-unit">
                            <h4>15+</h4>
                            <span>Countries Reached</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Glass Grid */}
            <section className="solutions-grid-premium">
                <div className="container">
                    <div className="section-head-modern" data-reveal id="sol-head">
                        <span className="subtitle-modern">Core Solutions</span>
                        <h2>Engineered for Performance</h2>
                    </div>

                    <div className="glass-grid-modern">
                        {features.map((f, i) => (
                            <div key={i} className="solution-card-glass" data-reveal id={`feature-${i}`}>
                                <div className="card-icon-wrap">
                                    <i className={`fas ${f.icon}`}></i>
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Vision & Mission Section */}
            <section className="vision-mission-section">
                <div className="container">
                    <div className="vision-mission-grid">
                        <div className="vm-card vision" data-reveal id="vision-card">
                            <div className="vm-icon"><i className="fas fa-eye"></i></div>
                            <h3>Our Vision</h3>
                            <p>To be the global benchmark for quality and innovation in the natural rubber industry by bridging time-honored traditions with future technologies.</p>
                        </div>
                        <div className="vm-card mission" data-reveal id="mission-card">
                            <div className="vm-icon"><i className="fas fa-bullseye"></i></div>
                            <h3>Our Mission</h3>
                            <p>To consistently provide superior centrifuged latex through sustainable sourcing, cutting-edge analytics, and a relentless commitment to our partners' growth.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Snapshot */}
            <section className="about-snapshot-section">
                <div className="container">
                    <div className="about-snapshot-flex">
                        <div className="snapshot-content" data-reveal id="about-snap">
                            <span className="subtitle-modern">About Us</span>
                            <h2>Architects of Modern Latex</h2>
                            <p>
                                Shaping the industry for 25 years with a perfect blend of natural resources and high-tech precision.
                                We are India’s premier natural rubber supplier, headquartered in the heart of Kerala’s rubber belt.
                            </p>
                            <Link to="/about" className="link-arrow-premium">
                                Learn More About Us <i className="fas fa-chevron-right"></i>
                            </Link>
                        </div>
                        <div className="snapshot-visual" data-reveal id="about-viz">
                            <div className="feature-img-stack">
                                <img src="/images/holy1.jpg" alt="Factory" />
                                <div className="floating-badge">Since 1999</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="featured-products-home">
                <div className="container">
                    <div className="section-head-modern" data-reveal id="prod-head">
                        <span className="subtitle-modern">Our Products</span>
                        <h2>Engineered for Excellence</h2>
                    </div>
                    <div className="products-preview-grid">
                        <div className="product-mini-card" data-reveal id="prod-1">
                            <img src="/images/amber_bands.png" alt="Amber Bands" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1590012314607-cda9d9b6a917?w=400'; }} />
                            <h3>Amber Rubber Bands</h3>
                            <p>Premium quality natural rubber bands with excellent elasticity.</p>
                        </div>
                        <div className="product-mini-card" data-reveal id="prod-2">
                            <img src="/images/colored_bands.png" alt="Colored Bands" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1590012314607-cda9d9b6a917?w=400'; }} />
                            <h3>Colored Rubber Bands</h3>
                            <p>Vibrant assorted colors, perfect for office and organizational use.</p>
                        </div>
                        <div className="product-mini-card" data-reveal id="prod-3">
                            <img src="/images/industrial_bands.png" alt="Industrial Bands" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1590012314607-cda9d9b6a917?w=400'; }} />
                            <h3>Industrial Rubber Bands</h3>
                            <p>Heavy-duty reinforced rubber bands designed for packaging.</p>
                        </div>
                    </div>
                    <div className="center-action" data-reveal id="prod-action">
                        <Link to="/products" className="btn-modern secondary">Explore All Products</Link>
                    </div>
                </div>
            </section>

            {/* Awards & Recognition Highlight */}
            <section className="awards-highlight-home">
                <div className="container">
                    <div className="awards-highlight-flex">
                        <div className="awards-text" data-reveal id="awards-snap">
                            <span className="subtitle-modern">Recognition</span>
                            <h2>The Hall of Fame</h2>
                            <p>Celebrating decades of leadership in the global natural rubber industry through consistency and quality.</p>
                            <div className="mini-awards-list">
                                <div className="mini-award-item">
                                    <i className="fas fa-medal"></i>
                                    <span>Export Award 2013</span>
                                </div>
                                <div className="mini-award-item">
                                    <i className="fas fa-medal"></i>
                                    <span>Export Award 2014</span>
                                </div>
                                <div className="mini-award-item">
                                    <i className="fas fa-medal"></i>
                                    <span>Export Award 2015</span>
                                </div>
                            </div>
                            <Link to="/awards" className="link-arrow-premium">
                                View Full Recognition <i className="fas fa-chevron-right"></i>
                            </Link>
                        </div>
                        <div className="awards-visual" data-reveal id="awards-viz">
                            <img src="/images/holy2.jpg" alt="Award Ceremony" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Preview */}
            <section className="gallery-preview-home">
                <div className="container">
                    <div className="section-head-modern" data-reveal id="gal-head">
                        <span className="subtitle-modern">Gallery</span>
                        <h2>Lenses of Excellence</h2>
                    </div>
                    <div className="gallery-highlights">
                        <div className="gallery-item-home" data-reveal id="gal-1">
                            <img src="/images/holy1.jpg" alt="Plant" />
                        </div>
                        <div className="gallery-item-home" data-reveal id="gal-2">
                            <img src="/images/holy2.jpg" alt="Quality" />
                        </div>
                        <div className="gallery-item-home" data-reveal id="gal-3">
                            <img src="/images/holy3.jpg" alt="Logistics" />
                        </div>
                    </div>
                    <div className="center-action" data-reveal id="gal-action">
                        <Link to="/gallery" className="btn-modern secondary">View More Media</Link>
                    </div>
                </div>
            </section>

            {/* Contact Quick Section */}
            <section className="contact-quick-home">
                <div className="container">
                    <div className="contact-card-premium" data-reveal id="contact-quick">
                        <div className="contact-header">
                            <h2>Connect with Us</h2>
                            <p>Ready to transform your operations with premium latex solutions?</p>
                        </div>
                        <div className="contact-methods">
                            <div className="method">
                                <i className="fas fa-phone-alt"></i>
                                <div>
                                    <h4>Call Us</h4>
                                    <p>+91 9526264949</p>
                                </div>
                            </div>
                            <div className="method">
                                <i className="fas fa-envelope"></i>
                                <div>
                                    <h4>Email</h4>
                                    <p>info@holyfamilypolymers.com</p>
                                </div>
                            </div>
                            <div className="method">
                                <i className="fas fa-map-marker-alt"></i>
                                <div>
                                    <h4>Visit</h4>
                                    <p>Kottayam, Kerala, India</p>
                                </div>
                            </div>
                        </div>
                        <div className="contact-btns">
                            <Link to="/contact" className="btn-premium primary">Get in Touch</Link>
                            <Link to="/register" className="btn-premium outline">Partner with Us</Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default NewLandingPage;