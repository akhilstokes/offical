import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './GalleryPage.css';

const GalleryPage = () => {
    const [filter, setFilter] = useState('all');
    const [selectedImage, setSelectedImage] = useState(null);
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

    const galleryItems = [
        { id: 1, title: 'Main Plant', category: 'facility', image: '/images/holy1.jpg', desc: 'Central processing hub with high-capacity centrifugal units.' },
        { id: 2, title: 'Quality Assurance', category: 'facility', image: '/images/holy2.jpg', desc: 'Rigorous testing protocols for dry rubber content.' },
        { id: 3, title: 'Latex Extraction', category: 'facility', image: '/images/holy3.jpg', desc: 'Sustainably sourced raw materials from local estates.' },
        { id: 4, title: 'Smart Logistics', category: 'logistics', image: '/images/holy1.jpg', desc: 'Real-time tracking for nationwide distribution.' },
        { id: 5, title: 'Digital Ecosystem', category: 'technology', image: '/images/holy2.jpg', desc: 'Advanced ERP bridging manufacturing and management.' },
        { id: 6, title: 'Our Heritage', category: 'heritage', image: '/images/holy3.jpg', desc: 'A legacy of 25 years in the heart of Kerala.' }
    ];

    const filteredItems = filter === 'all'
        ? galleryItems
        : galleryItems.filter(item => item.category === filter);

    const categories = [
        { id: 'all', label: 'All Media' },
        { id: 'facility', label: 'Facilities' },
        { id: 'technology', label: 'Technologies' },
        { id: 'heritage', label: 'Heritage' }
    ];

    return (
        <div className="gallery-redesign-root">
            <Navbar />

            {/* Premium Hero Section */}
            <section className="gallery-hero-modern">
                <div className="container">
                    <div className="hero-content-center" data-reveal id="gallery-hero">
                        <span className="prestige-tag">Visual Showcase</span>
                        <h1>Lenses of <span className="text-highlight">Excellence</span></h1>
                        <p>A window into our state-of-the-art facilities, innovative technologies, and timeless industrial heritage.</p>
                    </div>
                </div>
            </section>

            {/* Premium Filter Controls */}
            <section className="filter-section-premium">
                <div className="container">
                    <div className="filter-tabs-glass" data-reveal id="gallery-filters">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`filter-tab ${filter === cat.id ? 'active' : ''}`}
                                onClick={() => setFilter(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dynamic Media Grid */}
            <section className="media-grid-section">
                <div className="container">
                    <div className="gallery-masonry-grid">
                        {filteredItems.map((item, idx) => (
                            <div
                                key={item.id}
                                className="gallery-card-modern"
                                data-reveal
                                id={`item-${item.id}`}
                                onClick={() => setSelectedImage(item)}
                            >
                                <div className="card-media-wrap">
                                    <img src={item.image} alt={item.title} />
                                    <div className="card-overlay-premium">
                                        <div className="overlay-meta">
                                            <span className="cat-tag">{item.category}</span>
                                            <h3>{item.title}</h3>
                                        </div>
                                        <div className="view-icon"><i className="fas fa-expand"></i></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="lightbox-overlay-modern" onClick={() => setSelectedImage(null)}>
                    <div className="lightbox-content-premium" onClick={e => e.stopPropagation()}>
                        <button className="close-lightbox" onClick={() => setSelectedImage(null)}>
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="lightbox-image-wrap">
                            <img src={selectedImage.image} alt={selectedImage.title} />
                        </div>
                        <div className="lightbox-details">
                            <span className="cat-tag">{selectedImage.category}</span>
                            <h2>{selectedImage.title}</h2>
                            <p>{selectedImage.desc}</p>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default GalleryPage;
