import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './ContactPage.css';

const ContactPage = () => {
    return (
        <div className="contact-page">
            <Navbar />

            <section className="contact-content">
                <div className="container">
                    <div className="contact-info-center">
                        <div className="contact-header-section">
                            <h1>Contact Us</h1>
                            <h2>Holy Family Polymers</h2>
                        </div>

                        <div className="contact-info-blocks">
                            <div className="contact-block">
                                <h3>Office :-</h3>
                                <div className="contact-details-list">
                                    <div className="contact-item">
                                        <i className="fas fa-globe"></i>
                                        <span>www.holyfamilypolymers.com</span>
                                    </div>
                                    <div className="contact-item">
                                        <i className="fas fa-box"></i>
                                        <span>P.O. Box 686502</span>
                                    </div>
                                    <div className="contact-item">
                                        <i className="fas fa-phone-alt"></i>
                                        <span>+91 9526264949, +91 9447155510, +91 9447155513</span>
                                    </div>
                                    <div className="contact-item">
                                        <i className="fas fa-envelope"></i>
                                        <span>info@holyfamilypolymers.com</span>
                                    </div>
                                    <div className="contact-item">
                                        <i className="fas fa-envelope"></i>
                                        <span>support@holyfamilypolymers.com</span>
                                    </div>
                                </div>
                            </div>

                            <div className="contact-block">
                                <h3>Factory:-</h3>
                                <div className="contact-details-list">
                                    <div className="contact-item">
                                        <i className="fas fa-map-marker-alt"></i>
                                        <div className="address-details">
                                            <strong>Holy Family Polymers</strong>
                                            <span>V/114 V-114, HOLYFAMILY BUILDINGS, KOOROPPADA, PAMPADY Kottayam (Dt), Kerala, India</span>
                                        </div>
                                    </div>
                                    <div className="contact-item">
                                        <i className="fas fa-phone-alt"></i>
                                        <span>+91 9526264949, +91 9447155512, +91 9447155510</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="contact-footer">
                            <h2>Connect with Us Effortlessly!</h2>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default ContactPage;