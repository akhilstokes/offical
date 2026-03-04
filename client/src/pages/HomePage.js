import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="homepage">
            <Navbar />
            
            {/* Hero Section */}
            <section className="hero-section">
                {/* REMOVED ANIMATED BACKGROUND - CAUSING BLACK AREA WITH BUBBLES */}
                {/* <div className="hero-background">
                    <div className="hero-shape hero-shape-1"></div>
                    <div className="hero-shape hero-shape-2"></div>
                    <div className="hero-shape hero-shape-3"></div>
                </div> */}
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <div className="hero-badge">
                                <i className="fas fa-award"></i>
                                <span>Industry Leading Solution Since 1999</span>
                            </div>
                            <h1 className="hero-title">
                                Transform Your <span className="gradient-text">Rubber Manufacturing</span> Operations
                            </h1>
                            <p className="hero-subtitle">
                                Complete ERP solution for latex billing, inventory management, payroll automation, and real-time analytics. 
                                Trusted by 500+ manufacturers across India with 99.9% uptime guarantee.
                            </p>
                            <div className="hero-actions">
                                <Link to="/login" className="btn btn-primary btn-large">
                                    <i className="fas fa-sign-in-alt"></i>
                                    <span>Get Started</span>
                                </Link>
                                <Link to="/contact" className="btn btn-outline btn-large">
                                    <i className="fas fa-calendar-check"></i>
                                    <span>Contact Us</span>
                                </Link>
                            </div>

                            <div className="home-feature-cards">
                                <div className="home-feature-card">
                                    <div className="home-feature-icon">
                                        <i className="fas fa-file-invoice-dollar"></i>
                                    </div>
                                    <div className="home-feature-title">Billing</div>
                                    <div className="home-feature-desc">Automated latex billing with DRC & GST support.</div>
                                </div>
                                <div className="home-feature-card">
                                    <div className="home-feature-icon">
                                        <i className="fas fa-cubes"></i>
                                    </div>
                                    <div className="home-feature-title">Inventory</div>
                                    <div className="home-feature-desc">Track barrels and stock with real-time updates.</div>
                                </div>
                                <div className="home-feature-card">
                                    <div className="home-feature-icon">
                                        <i className="fas fa-chart-line"></i>
                                    </div>
                                    <div className="home-feature-title">Analytics</div>
                                    <div className="home-feature-desc">Clear dashboards for decisions and reporting.</div>
                                </div>
                            </div>
                        </div>
                        <div className="hero-visual">
                            <div className="dashboard-preview">
                                <div className="preview-window">
                                    <div className="window-header">
                                        <div className="window-dots">
                                            <span className="dot-red"></span>
                                            <span className="dot-yellow"></span>
                                            <span className="dot-green"></span>
                                        </div>
                                        <div className="window-title">
                                            <i className="fas fa-chart-line"></i>
                                            Holy Family Polymers Dashboard
                                        </div>
                                    </div>
                                    <div className="window-content">
                                        <div className="dashboard-mockup">
                                            <img src="/images/logo.png" alt="Dashboard Preview" className="dashboard-img" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Strip */}
            <section className="features-strip">
                <div className="container">
                    <div className="features-strip-grid">
                        <div className="feature-strip-item">
                            <div className="feature-strip-icon billing">
                                <i className="fas fa-file-invoice-dollar"></i>
                            </div>
                            <div className="feature-strip-content">
                                <h4>Smart Billing</h4>
                                <p>Automated DRC-based billing with GST compliance</p>
                            </div>
                        </div>
                        <div className="feature-strip-item">
                            <div className="feature-strip-icon payroll">
                                <i className="fas fa-money-check-alt"></i>
                            </div>
                            <div className="feature-strip-content">
                                <h4>Payroll System</h4>
                                <p>RFID attendance & automated salary calculation</p>
                            </div>
                        </div>
                        <div className="feature-strip-item">
                            <div className="feature-strip-icon inventory">
                                <i className="fas fa-boxes"></i>
                            </div>
                            <div className="feature-strip-content">
                                <h4>Inventory Control</h4>
                                <p>Real-time barrel tracking & stock management</p>
                            </div>
                        </div>
                        <div className="feature-strip-item">
                            <div className="feature-strip-icon analytics">
                                <i className="fas fa-chart-pie"></i>
                            </div>
                            <div className="feature-strip-content">
                                <h4>Analytics</h4>
                                <p>Comprehensive reports & business insights</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Company Values Section */}
            <section className="company-values-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">About Us</span>
                        <h2 className="section-title">Holy Family Polymers</h2>
                        <p className="section-subtitle">
                            Leading rubber manufacturing company with decades of excellence in quality production and innovation
                        </p>
                    </div>
                    <div className="values-grid">
                        <div className="value-card vision-card">
                            <div className="value-icon">
                                <i className="fas fa-eye"></i>
                            </div>
                            <h3>Our Vision</h3>
                            <p>
                                To be the most trusted and innovative rubber manufacturing company, setting industry standards 
                                for quality, sustainability, and technological advancement.
                            </p>
                            <div className="value-highlight">
                                <i className="fas fa-check-circle"></i>
                                <span>Excellence Driven</span>
                            </div>
                        </div>
                        <div className="value-card mission-card">
                            <div className="value-icon">
                                <i className="fas fa-bullseye"></i>
                            </div>
                            <h3>Our Mission</h3>
                            <p>
                                Delivering premium quality rubber products through sustainable practices, cutting-edge technology, 
                                and unwavering commitment to customer satisfaction.
                            </p>
                            <div className="value-highlight">
                                <i className="fas fa-check-circle"></i>
                                <span>Quality First</span>
                            </div>
                        </div>
                        <div className="value-card about-card">
                            <div className="value-icon">
                                <i className="fas fa-industry"></i>
                            </div>
                            <h3>About Us</h3>
                            <p>
                                Established in 1999, Holy Family Polymers has grown into a leading manufacturer with 
                                state-of-the-art facilities and a dedicated team of professionals.
                            </p>
                            <div className="value-highlight">
                                <i className="fas fa-check-circle"></i>
                                <span>25+ Years Legacy</span>
                            </div>
                        </div>
                    </div>
                    <div className="company-stats">
                        <div className="stat-item">
                            <div className="stat-icon">
                                <i className="fas fa-calendar-alt"></i>
                            </div>
                            <div className="stat-number">25+</div>
                            <div className="stat-label">Years Experience</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="stat-number">500+</div>
                            <div className="stat-label">Happy Clients</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon">
                                <i className="fas fa-award"></i>
                            </div>
                            <div className="stat-number">99.9%</div>
                            <div className="stat-label">Quality Rate</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon">
                                <i className="fas fa-globe"></i>
                            </div>
                            <div className="stat-number">15+</div>
                            <div className="stat-label">States Served</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Products Section */}
            <section className="products-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Products</span>
                        <h2 className="section-title">Our Products</h2>
                        <p className="section-subtitle">
                            Premium quality rubber products manufactured with cutting-edge technology and strict quality control
                        </p>
                    </div>
                    <div className="products-grid">
                        <div className="product-card">
                            <div className="product-icon">
                                <i className="fas fa-flask"></i>
                            </div>
                            <h3>Natural Rubber Latex</h3>
                            <p>
                                High-quality natural rubber latex with consistent DRC levels, perfect for various industrial applications.
                            </p>
                            <ul className="product-features">
                                <li><i className="fas fa-check"></i> Premium Grade Quality</li>
                                <li><i className="fas fa-check"></i> Consistent DRC Levels</li>
                                <li><i className="fas fa-check"></i> ISO Certified</li>
                            </ul>
                        </div>
                        <div className="product-card">
                            <div className="product-icon">
                                <i className="fas fa-cube"></i>
                            </div>
                            <h3>Rubber Compounds</h3>
                            <p>
                                Custom rubber compounds formulated to meet specific requirements for diverse industrial needs.
                            </p>
                            <ul className="product-features">
                                <li><i className="fas fa-check"></i> Custom Formulations</li>
                                <li><i className="fas fa-check"></i> High Performance</li>
                                <li><i className="fas fa-check"></i> Quality Tested</li>
                            </ul>
                        </div>
                        <div className="product-card">
                            <div className="product-icon">
                                <i className="fas fa-industry"></i>
                            </div>
                            <h3>Industrial Rubber Products</h3>
                            <p>
                                Wide range of industrial rubber products designed for durability and optimal performance.
                            </p>
                            <ul className="product-features">
                                <li><i className="fas fa-check"></i> Durable Materials</li>
                                <li><i className="fas fa-check"></i> Wide Application Range</li>
                                <li><i className="fas fa-check"></i> Competitive Pricing</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Navigation Section - COMMENTED OUT TO REMOVE WHITE SPACE */}
            {/* <section className="quick-nav-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Explore</span>
                        <h2 className="section-title">Quick Navigation</h2>
                        <p className="section-subtitle">
                            Discover more about our company, services, and get in touch with us
                        </p>
                    </div>
                    <div className="quick-nav-grid">
                        <Link to="/history" className="nav-card">
                            <div className="nav-icon history">
                                <i className="fas fa-history"></i>
                            </div>
                            <h3>Our History</h3>
                            <p>Explore our journey from 1999 to becoming an industry leader in rubber manufacturing</p>
                            <div className="nav-arrow">
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>
                        <Link to="/gallery" className="nav-card">
                            <div className="nav-icon gallery">
                                <i className="fas fa-images"></i>
                            </div>
                            <h3>Gallery</h3>
                            <p>View our state-of-the-art facilities, production processes, and team in action</p>
                            <div className="nav-arrow">
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>
                        <Link to="/contact" className="nav-card">
                            <div className="nav-icon contact">
                                <i className="fas fa-envelope"></i>
                            </div>
                            <h3>Contact Us</h3>
                            <p>Get in touch with our team for inquiries, support, or partnership opportunities</p>
                            <div className="nav-arrow">
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>
                        <Link to="/login" className="nav-card login-card">
                            <div className="nav-icon login">
                                <i className="fas fa-sign-in-alt"></i>
                            </div>
                            <h3>Login Portal</h3>
                            <p>Access your dashboard to manage operations, view reports, and track performance</p>
                            <div className="nav-arrow">
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </Link>
                    </div>
                </div>
            </section> */}

            {/* CTA Section - COMMENTED OUT TO REMOVE BLACK SPACE */}
            {/* <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Transform Your Operations?</h2>
                        <p>
                            Join hundreds of manufacturers who trust Holy Family Polymers for their rubber manufacturing needs. 
                            Get started today and experience the difference.
                        </p>
                        <div className="cta-buttons">
                            <Link to="/login" className="btn btn-primary btn-large">
                                <i className="fas fa-sign-in-alt"></i>
                                <span>Access Portal</span>
                            </Link>
                            <Link to="/contact" className="btn btn-secondary btn-large">
                                <i className="fas fa-phone"></i>
                                <span>Contact Sales</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* Footer */}
            <footer className="modern-footer">
                <div className="container">
                    <div className="footer-main">
                        <div className="footer-company">
                            <div className="company-logo-section">
                                <div className="footer-logo">
                                    <div className="logo-icon">HF</div>
                                    <div className="logo-text">
                                        <span className="company-name">Holy Family Polymers</span>
                                        <span className="company-tagline">Excellence in Manufacturing</span>
                                    </div>
                                </div>
                            </div>
                            <p className="company-description">
                                Leading rubber manufacturing company since 1999, committed to delivering premium quality 
                                products through innovation, sustainability, and customer-centric approach.
                            </p>
                            <div className="social-links">
                                <a href="https://facebook.com" className="social-link facebook" target="_blank" rel="noopener noreferrer">
                                    <i className="fab fa-facebook-f"></i>
                                </a>
                                <a href="https://twitter.com" className="social-link twitter" target="_blank" rel="noopener noreferrer">
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href="https://linkedin.com" className="social-link linkedin" target="_blank" rel="noopener noreferrer">
                                    <i className="fab fa-linkedin-in"></i>
                                </a>
                            </div>
                        </div>
                        <div className="footer-links">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/history">History</Link></li>
                                <li><Link to="/gallery">Gallery</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                                <li><Link to="/login">Login</Link></li>
                            </ul>
                        </div>
                        <div className="footer-office">
                            <h4>Head Office</h4>
                            <div className="office-info">
                                <div className="office-address">
                                    <p>Holy Family Polymers</p>
                                    <p>Kottayam, Kerala</p>
                                    <p>India - 686001</p>
                                </div>
                                <div className="contact-info">
                                    <div className="contact-item">
                                        <i className="fas fa-phone"></i>
                                        <span>+91 1234567890</span>
                                    </div>
                                    <div className="contact-item">
                                        <i className="fas fa-envelope"></i>
                                        <span>info@holyfamilypolymers.com</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="footer-factory">
                            <h4>Factory</h4>
                            <div className="factory-info">
                                <div className="factory-address">
                                    <p>Manufacturing Unit</p>
                                    <p>Industrial Area</p>
                                    <p>Kottayam, Kerala</p>
                                </div>
                                <div className="contact-info">
                                    <div className="contact-item">
                                        <i className="fas fa-clock"></i>
                                        <span>Mon - Sat: 9AM - 6PM</span>
                                    </div>
                                </div>
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

export default HomePage;