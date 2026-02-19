import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-new">
            <div className="container-new">
                <div className="footer-grid">
                    <div className="footer-column company-info">
                        <div className="footer-logo">
                            <img src="/images/logo.png" alt="Holy Family Polymers" />
                            <div className="logo-text">
                                <h3>HOLY FAMILY POLYMERS</h3>
                                <span>PVT LTD</span>
                            </div>
                        </div>
                        <p className="footer-desc">
                            The Holy Family Polymers group of companies with its head office in Kooroppada, 
                            Kottayam have been processing natural rubber for the last 25 years.
                        </p>
                        <div className="social-links">
                            <a href="#"><i className="fab fa-facebook-f"></i></a>
                            <a href="#"><i className="fab fa-twitter"></i></a>
                            <a href="#"><i className="fab fa-linkedin-in"></i></a>
                        </div>
                    </div>

                    <div className="footer-column">
                        <h3>Quick Links</h3>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/awards">Awards</Link></li>
                            <li><Link to="/gallery">Gallery</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Office</h3>
                        <div className="contact-info-footer">
                            <p>Holy Family Polymers (India) Pvt Ltd.</p>
                            <p>V/114 V-114, Holy Family Buildings,</p>
                            <p>Kooroppada, Kottayam, Kerala</p>
                            <p>686502, India</p>
                            <div className="footer-contact-items">
                                <p><i className="fas fa-phone-alt"></i> +91 9526264949</p>
                                <p><i className="fas fa-phone-alt"></i> +91 9447155513</p>
                                <p><i className="fas fa-phone-alt"></i> +91 9447155510</p>
                                <p><i className="fas fa-envelope"></i> info@holyfamilypolymers.com</p>
                            </div>
                        </div>
                    </div>

                    <div className="footer-column">
                        <h3>Factory</h3>
                        <div className="contact-info-footer">
                            <p>Holy Family Polymers (India) Pvt Ltd.</p>
                            <p>Kuruvamoozhy P.O</p>
                            <p>686509, Erumely, Kottayam</p>
                            <p>(Dt), India</p>
                            <div className="footer-contact-items">
                                <p><i className="fas fa-phone-alt"></i> +91 9447155512</p>
                                <p><i className="fas fa-phone-alt"></i> +91 9447155513</p>
                                <p><i className="fas fa-phone-alt"></i> +91 9447155510</p>
                                <p><i className="fas fa-envelope"></i> info@holyfamilypolymers.com</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Holy Family Polymers. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
