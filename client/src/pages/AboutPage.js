import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './AboutPage.css';

const AboutPage = () => {
    return (
        <div className="about-page">
            <Navbar />
            
            {/* Hero Banner Image */}
            <section className="about-banner">
                <div className="banner-image-container">
                    <img 
                        src="/images/holy1.jpg" 
                        alt="Rubber Plantation" 
                        className="banner-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1590424600021-9538a7c64673?w=1600&q=80';
                        }}
                    />
                </div>
            </section>

            {/* About Content Section */}
            <section className="about-content-section">
                <div className="container">
                    <div className="about-main-content">
                        <h1>About Holy Family Polymers</h1>
                        
                        <div className="about-text-content">
                            <p>
                                The Holy Family Polymers group of companies with its head office in Kooroppada, Kottayam 
                                have been processing natural rubber for the last 25 years.
                            </p>
                            
                            <p>
                                The group's major activity, Holy Family Polymers, is a leading producer of centrifuged latex, 
                                becoming over the years one of the largest suppliers of all grades of natural rubber from India.
                            </p>
                            
                            <p>
                                We operate with a state-of-the-art manufacturing facility equipped with modern centrifugal 
                                machines and a dedicated laboratory for ensuring the highest quality standards in DRC 
                                (Dry Rubber Content) and chemical properties.
                            </p>
                            
                            <p>
                                Holy Family Polymers also manages extensive rubber plantation holdings in the Kottayam 
                                district of Kerala, ensuring a consistent supply of high-quality raw material for our 
                                processing units and maintaining a direct link with the local farming community.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default AboutPage;

