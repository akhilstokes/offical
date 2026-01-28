import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './NewLandingPage.css';

const NewLandingPage = () => {
    return (
        <div className="new-landing-page">
            <Navbar />
            
            {/* Hero Section */}
            <section className="hero-section-new">
                <div className="hero-container">
                    <div className="hero-content-new">
                        <div className="hero-badge-new">
                            <i className="fas fa-industry"></i>
                            <span>Rubber Manufacturing Excellence Since 1999</span>
                        </div>
                        <h1 className="hero-title-new">
                            Transform Your Rubber Manufacturing with <span className="text-gradient">Complete ERP Automation</span>
                        </h1>
                        <p className="hero-description">
                            Streamline operations, boost efficiency, and maximize profits with our comprehensive rubber manufacturing ERP solution
                        </p>
                        <div className="hero-buttons">
                            <Link to="/register" className="btn-hero btn-primary-hero">
                                <i className="fas fa-rocket"></i>
                                Get Started Free
                            </Link>
                            <Link to="/contact" className="btn-hero btn-secondary-hero">
                                <i className="fas fa-phone"></i>
                                Contact Sales
                            </Link>
                        </div>
                        <div className="hero-stats">
                            <div className="stat-box">
                                <i className="fas fa-users stat-icon"></i>
                                <div className="stat-number">500+</div>
                                <div className="stat-label">Clients</div>
                            </div>
                            <div className="stat-box">
                                <i className="fas fa-server stat-icon"></i>
                                <div className="stat-number">99.9%</div>
                                <div className="stat-label">Uptime</div>
                            </div>
                            <div className="stat-box">
                                <i className="fas fa-headset stat-icon"></i>
                                <div className="stat-number">24/7</div>
                                <div className="stat-label">Support</div>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual-new">
                        <div className="dashboard-mockup-new">
                            <div className="mockup-header">
                                <div className="mockup-dots">
                                    <span className="dot red"></span>
                                    <span className="dot yellow"></span>
                                    <span className="dot green"></span>
                                </div>
                                <span className="mockup-title">Holy Family Polymers Dashboard</span>
                            </div>
                            <div className="mockup-content">
                                <img src="/images/logo.png" alt="Dashboard" className="mockup-image" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section-new">
                <div className="container-new">
                    <div className="section-header-new">
                        <span className="section-tag-new">Core Features</span>
                        <h2 className="section-title-new">Everything You Need for Rubber Manufacturing</h2>
                        <p className="section-subtitle-new">
                            Comprehensive tools designed specifically for rubber and polymer manufacturing operations
                        </p>
                    </div>
                    <div className="features-grid-new">
                        <div className="feature-card-new">
                            <div className="feature-icon-new billing-icon">
                                <i className="fas fa-file-invoice-dollar"></i>
                            </div>
                            <h3>Smart Billing System</h3>
                            <p>Automated latex billing with DRC calculation, GST compliance, and instant invoice generation</p>
                            <ul className="feature-list-new">
                                <li><i className="fas fa-check"></i> DRC-based pricing</li>
                                <li><i className="fas fa-check"></i> GST integration</li>
                                <li><i className="fas fa-check"></i> Payment tracking</li>
                            </ul>
                        </div>
                        <div className="feature-card-new">
                            <div className="feature-icon-new inventory-icon">
                                <i className="fas fa-boxes"></i>
                            </div>
                            <h3>Inventory Management</h3>
                            <p>Real-time barrel tracking, stock management, and automated alerts for low inventory</p>
                            <ul className="feature-list-new">
                                <li><i className="fas fa-check"></i> Barrel tracking</li>
                                <li><i className="fas fa-check"></i> Stock alerts</li>
                                <li><i className="fas fa-check"></i> QR code scanning</li>
                            </ul>
                        </div>
                        <div className="feature-card-new">
                            <div className="feature-icon-new payroll-icon">
                                <i className="fas fa-money-check-alt"></i>
                            </div>
                            <h3>Payroll Automation</h3>
                            <p>RFID attendance tracking, automated salary calculation, and instant payment processing</p>
                            <ul className="feature-list-new">
                                <li><i className="fas fa-check"></i> RFID attendance</li>
                                <li><i className="fas fa-check"></i> Auto calculations</li>
                                <li><i className="fas fa-check"></i> Salary reports</li>
                            </ul>
                        </div>
                        <div className="feature-card-new">
                            <div className="feature-icon-new analytics-icon">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <h3>Analytics & Reports</h3>
                            <p>Comprehensive dashboards, real-time insights, and detailed reports for better decisions</p>
                            <ul className="feature-list-new">
                                <li><i className="fas fa-check"></i> Live dashboards</li>
                                <li><i className="fas fa-check"></i> Custom reports</li>
                                <li><i className="fas fa-check"></i> Data export</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Company Section */}
            <section className="about-section-new">
                <div className="container-new">
                    <div className="about-grid">
                        <div className="about-content">
                            <span className="section-tag-new">About Us</span>
                            <h2 className="section-title-new">Holy Family Polymers</h2>
                            <p className="about-text">
                                Since 1999, Holy Family Polymers has been at the forefront of rubber manufacturing 
                                excellence. We combine traditional craftsmanship with cutting-edge technology to 
                                deliver premium quality rubber products.
                            </p>
                            <p className="about-text">
                                Our state-of-the-art facilities and dedicated team of professionals ensure that 
                                every product meets the highest standards of quality and sustainability.
                            </p>
                            <div className="about-highlights">
                                <div className="highlight-item">
                                    <i className="fas fa-award"></i>
                                    <div>
                                        <strong>ISO Certified</strong>
                                        <span>Quality Assured</span>
                                    </div>
                                </div>
                                <div className="highlight-item">
                                    <i className="fas fa-leaf"></i>
                                    <div>
                                        <strong>Eco-Friendly</strong>
                                        <span>Sustainable Practices</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="about-image">
                            <img src="/images/logo.png" alt="Holy Family Polymers" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section-new">
                <div className="container-new">
                    <div className="cta-content-new">
                        <h2>Ready to Transform Your Manufacturing?</h2>
                        <p>Join hundreds of manufacturers who trust our platform for their operations</p>
                        <div className="cta-buttons-new">
                            <Link to="/register" className="btn-cta btn-primary-cta">
                                <i className="fas fa-user-plus"></i>
                                Sign Up Now
                            </Link>
                            <Link to="/login" className="btn-cta btn-secondary-cta">
                                <i className="fas fa-sign-in-alt"></i>
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer-new">
                <div className="container-new">
                    <div className="footer-grid">
                        <div className="footer-col">
                            <div className="footer-logo">
                                <img src="/images/logo.png" alt="Logo" className="footer-logo-img" />
                                <span>Holy Family Polymers</span>
                            </div>
                            <p className="footer-desc">
                                Leading rubber manufacturing company with excellence in quality production and innovation since 1999.
                            </p>
                        </div>
                        <div className="footer-col">
                            <h4>Quick Links</h4>
                            <ul className="footer-links">
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/about">About</Link></li>
                                <li><Link to="/history">History</Link></li>
                                <li><Link to="/gallery">Gallery</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4>Services</h4>
                            <ul className="footer-links">
                                <li><Link to="/contact">Contact</Link></li>
                                <li><Link to="/awards">Awards</Link></li>
                                <li><Link to="/login">Login</Link></li>
                                <li><Link to="/register">Register</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4>Contact</h4>
                            <div className="footer-contact">
                                <p><i className="fas fa-map-marker-alt"></i> Kottayam, Kerala, India</p>
                                <p><i className="fas fa-phone"></i> +91 1234567890</p>
                                <p><i className="fas fa-envelope"></i> info@holyfamily.com</p>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2026 Holy Family Polymers. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default NewLandingPage;
