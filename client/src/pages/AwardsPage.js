import React, { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './AwardsPage.css';

const AwardsPage = () => {
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

    const awards = [
        {
            src: '/images/holy1.jpg',
            title: 'Natural Rubber Export Award',
            year: '2013',
            org: 'Rubber Board of India'
        },
        {
            src: '/images/holy2.jpg',
            title: 'Natural Rubber Export Award',
            year: '2014',
            org: 'Rubber Board of India'
        },
        {
            src: '/images/holy3.jpg',
            title: 'Natural Rubber Export Award',
            year: '2015',
            org: 'Rubber Board of India'
        }
    ];

    return (
        <div className="awards-redesign-root">
            <Navbar />

            {/* Premium Hero Section */}
            <section className="awards-hero-modern">
                <div className="container">
                    <div className="awards-hero-content" data-reveal id="awards-hero">
                        <span className="prestige-tag">Recognition of Excellence</span>
                        <h1>The <span className="text-gold">Hall of Fame</span></h1>
                        <p>Celebrating decades of leadership in the global natural rubber industry through consistency and quality.</p>
                    </div>
                </div>
            </section>

            {/* Museum-Style Grid */}
            <section className="awards-gallery-section">
                <div className="container">
                    <div className="awards-museum-grid">
                        {awards.map((award, index) => (
                            <div key={index} className="award-museum-card" data-reveal id={`award-${index}`}>
                                <div className="card-frame">
                                    <div className="frame-border">
                                        <div className="frame-inner">
                                            <img
                                                src={award.src}
                                                alt={award.title}
                                                className="diploma-image"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://images.unsplash.com/photo-1579546671170-4341975071eb?w=600&q=80';
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="award-seal">
                                        <i className="fas fa-certificate"></i>
                                    </div>
                                </div>
                                <div className="award-caption">
                                    <div className="award-year-tag">{award.year}</div>
                                    <h3>{award.title}</h3>
                                    <p className="award-org">{award.org}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Prestige Stats Strip */}
            <section className="prestige-stats">
                <div className="container">
                    <div className="stats-row">
                        <div className="stat-unit" data-reveal id="stat-1">
                            <span className="stat-val">25+</span>
                            <span className="stat-label">Years of Mastery</span>
                        </div>
                        <div className="stat-unit" data-reveal id="stat-2">
                            <span className="stat-val">3x</span>
                            <span className="stat-label">Consecutive Export Awards</span>
                        </div>
                        <div className="stat-unit" data-reveal id="stat-3">
                            <span className="stat-val">100%</span>
                            <span className="stat-label">Quality Assurance</span>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AwardsPage;