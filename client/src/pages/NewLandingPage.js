

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './NewLandingPage.css';

const NewLandingPage = () => {
    const [scrollY, setScrollY] = useState(0);
    const [isVisible, setIsVisible] = useState({});
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState('');

    const sliderImages = [
        '/images/holy1.jpg',
        '/images/holy2.jpg',
        '/images/holy3.jpg',
        '/images/holy4.jpg',
        '/images/holy5.jpg',
        '/images/holy6.jpg',
        '/images/holy7.jpg'
    ];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % sliderImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
    };

    const openFullScreen = (img) => {
        setFullScreenImage(img);
        setIsFullScreen(true);
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeFullScreen = () => {
        setIsFullScreen(false);
        setFullScreenImage('');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    };

    useEffect(() => {
        const timer = setInterval(nextImage, 5000);
        return () => clearInterval(timer);
    }, [sliderImages.length]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('[data-animate]').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: 'fa-file-invoice-dollar',
            title: 'Latex Billing System',
            description: 'Automated billing based on DRC value with GST calculation and invoice generation.',
            color: 'billing-icon',
            items: ['DRC-based billing', 'GST calculation', 'Invoice records'],
            delay: '0s'
        },
        {
            icon: 'fa-boxes',
            title: 'Inventory & Barrel Tracking',
            description: 'Track barrels, stock movement, and warehouse status in real time.',
            color: 'inventory-icon',
            items: ['Barrel lifecycle', 'Stock monitoring', 'Low stock alerts'],
            delay: '0.1s'
        },
        {
            icon: 'fa-money-check-alt',
            title: 'Staff & Payroll Management',
            description: 'Manage attendance, wages, and payroll calculations with minimal manual effort.',
            color: 'payroll-icon',
            items: ['Attendance tracking', 'Salary calculation', 'Payroll reports'],
            delay: '0.2s'
        },
        {
            icon: 'fa-chart-line',
            title: 'Reports & Dashboards',
            description: 'Visual dashboards and downloadable reports for operational and financial analysis.',
            color: 'analytics-icon',
            items: ['Live dashboards', 'Export reports', 'Performance insights'],
            delay: '0.3s'
        }
    ];

    const stats = [
        { icon: 'fa-layer-group', number: '6+', label: 'Core Modules' },
        { icon: 'fa-user-shield', number: 'Role', label: 'Based Access' },
        { icon: 'fa-clock', number: '24/7', label: 'System Availability' }
    ];

    return (
        <div className="new-landing-page">
            <Navbar />

            {/* Animated Background Shapes */}
            <div className="bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            {/* Hero Section */}
            <section className="hero-section-new">
                <div className="hero-container">
                    <div className="hero-content-new" data-animate id="hero-content">
                        <div className="hero-badge-new animate-badge">
                            <i className="fas fa-industry"></i>
                            <span>Rubber Latex Manufacturing Since 1999</span>
                        </div>

                        <h1 className="hero-title-new animate-title">
                            Digitize Rubber Manufacturing with{' '}
                            <span className="text-gradient">Smart ERP Automation</span>
                        </h1>

                        <p className="hero-description animate-description">
                            Centralize barrel tracking, billing, inventory, payroll, and reporting
                            with a powerful ERP system designed specifically for rubber latex
                            manufacturing operations.
                        </p>

                        <div className="hero-buttons animate-buttons">
                            <Link to="/contact" className="btn-hero btn-primary-hero">
                                <i className="fas fa-envelope"></i>
                                <span>Contact Us</span>
                                <div className="btn-shine"></div>
                            </Link>
                        </div>

                        <div className="hero-stats animate-stats">
                            {stats.map((stat, index) => (
                                <div 
                                    key={index} 
                                    className="stat-box"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <i className={`fas ${stat.icon} stat-icon`}></i>
                                    <div className="stat-number">{stat.number}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div 
                        className="hero-visual-new animate-visual" 
                        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
                    >
                        <div className="dashboard-mockup-new">
                            <div className="mockup-content slider-container">
                                {sliderImages.map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt={`ERP Dashboard ${index + 1}`}
                                        className={`mockup-image slider-image ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => openFullScreen(img)}
                                        style={{ cursor: 'zoom-in' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/images/logo.png';
                                        }}
                                    />
                                ))}
                                
                                <button className="slider-arrow prev" onClick={prevImage} aria-label="Previous image">
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <button className="slider-arrow next" onClick={nextImage} aria-label="Next image">
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                                
                                <div className="slider-dots">
                                    {sliderImages.map((_, index) => (
                                        <span 
                                            key={index} 
                                            className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                                            onClick={() => setCurrentImageIndex(index)}
                                        ></span>
                                    ))}
                                </div>
                            </div>
                            <div className="mockup-glow"></div>
                        </div>
                        {/* Floating Elements */}
                        <div className="floating-element element-1">
                            <i className="fas fa-chart-bar"></i>
                        </div>
                        <div className="floating-element element-2">
                            <i className="fas fa-cog"></i>
                        </div>
                        <div className="floating-element element-3">
                            <i className="fas fa-database"></i>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="scroll-indicator">
                    <div className="mouse">
                        <div className="wheel"></div>
                    </div>
                    <p>Scroll to explore</p>
                </div>
            </section>

            {/* Who We Are Section */}
            <section className="who-we-are-section">
                <div className="who-we-are-container">
                    <div className="who-we-are-content" data-animate>
                        <div className="who-we-are-text">
                            <h2>Who We Are</h2>
                            <p>
                                The Holy Family Polymers group of companies with its head office in Kooroppada, 
                                Kottayam have been processing natural rubber for the last 25 years. 
                                The group's major activity, Holy Family Polymers, is a leading producer of 
                                centrifuged latex, becoming over the years one of the largest exporters 
                                of all grades of natural rubber from India.
                            </p>
                        </div>
                        <div className="who-we-are-action">
                            <Link to="/about" className="btn-learn-more">
                                <span>Learn more</span>
                                <i className="fas fa-arrow-circle-right"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section className="mission-vision-grid-section">
                <div className="container-new">
                    <div className="mission-vision-flex">
                        <div className="mission-item" data-animate>
                            <h3 className="section-tag-green">Our Mission</h3>
                            <h4>Environmentally -friendly companies</h4>
                            <p>
                                We are fully conversant with the need for environmental sustainability 
                                and comply with all the rules and regulations relating to these matters. 
                                Participating in local society, promoting awareness in the need for 
                                proper drainage and clean sanitary conditions.
                            </p>
                        </div>
                        <div className="vision-item" data-animate>
                            <h3 className="section-tag-green">Our Vision</h3>
                            <h4>Credibility & Integrity</h4>
                            <p>
                                We will provide the best possible service to our customers by setting 
                                the highest standards for our products and people. We believe that 
                                mutually beneficial relationships will lead to long term partnerships 
                                with our customers and suppliers.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section-new">
                <div className="container-new">
                    <div className="section-header-new" data-animate id="features-header">
                        <span className="section-tag-new">Core Modules</span>
                        <h2 className="section-title-new">
                            Complete ERP for Rubber Manufacturing
                        </h2>
                        <p className="section-subtitle-new">
                            Purpose-built modules to manage latex collection, processing,
                            workforce, and finance efficiently.
                        </p>
                    </div>

                    <div className="features-grid-new">
                        {features.map((feature, index) => (
                            <div 
                                key={index}
                                className="feature-card-new"
                                data-animate
                                id={`feature-${index}`}
                                style={{ animationDelay: feature.delay }}
                            >
                                <div className={`feature-icon-new ${feature.color}`}>
                                    <i className={`fas ${feature.icon}`}></i>
                                    <div className="icon-bg"></div>
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <ul className="feature-list-new">
                                    {feature.items.map((item, idx) => (
                                        <li key={idx}>
                                            <i className="fas fa-check"></i>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="card-hover-effect"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section-new" data-animate id="cta-section">
                <div className="cta-particles">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="particle" style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${3 + Math.random() * 2}s`
                        }}></div>
                    ))}
                </div>
                <div className="container-new">
                    <div className="cta-content-new">
                        <h2>Ready to Modernize Your Manufacturing?</h2>
                        <p>
                            Experience how ERP automation simplifies rubber latex operations
                            and improves decision-making.
                        </p>
                        <div className="cta-buttons-new">
                            <Link to="/register" className="btn-cta btn-primary-cta">
                                <i className="fas fa-user-plus"></i>
                                <span>Get Started</span>
                                <div className="btn-shine"></div>
                            </Link>
                            <Link to="/login" className="btn-cta btn-secondary-cta">
                                <i className="fas fa-sign-in-alt"></i>
                                <span>Login</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />

            {/* Full Screen Image Modal */}
            {isFullScreen && (
                <div className="fullscreen-modal" onClick={closeFullScreen}>
                    <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
                        <img src={fullScreenImage} alt="Full Screen" className="fullscreen-image" />
                        <button className="fullscreen-close" onClick={closeFullScreen}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewLandingPage;