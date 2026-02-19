import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './AwardsPage.css';

const AwardsPage = () => {
    const awardImages = [
        { src: '/images/holy1.jpg', title: 'Natural Rubber Export Award 2013' },
        { src: '/images/holy2.jpg', title: 'Natural Rubber Export Award 2014' },
        { src: '/images/holy3.jpg', title: 'Natural Rubber Export Award 2015' }
    ];

    return (
        <div className="awards-page">
            <Navbar />
            
            {/* Hero Banner Section */}
            <section className="awards-banner">
                <div className="banner-image-container">
                    <img 
                        src="/images/holy2.jpg" 
                        alt="Awards Banner" 
                        className="banner-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1600&q=80';
                        }}
                    />
                </div>
            </section>

            {/* Awards Content Section */}
            <section className="awards-content-section">
                <div className="container">
                    <h1 className="awards-title">Awards</h1>
                    
                    <div className="awards-certificates-grid">
                        {awardImages.map((award, index) => (
                            <div key={index} className="certificate-card">
                                <div className="certificate-image-wrapper">
                                    <img 
                                        src={award.src} 
                                        alt={award.title}
                                        className="certificate-image"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/400x500/f0f0f0/999?text=Award+Certificate';
                                        }}
                                    />
                                </div>
                                <div className="certificate-info">
                                    <h3>{award.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default AwardsPage;