import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProductsPage.css';

const ProductsPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const products = [
        {
            id: 'amber_bands',
            name: 'Standard Amber Rubber Bands',
            image: '/images/amber_bands.png',
            description: 'Premium quality natural rubber bands with excellent elasticity and durability.',
            badge: 'Bestseller'
        },
        {
            id: 'colored_bands',
            name: 'Colored Rubber Bands',
            image: '/images/colored_bands.png',
            description: 'Vibrant assorted colors, perfect for office and general organizational use.',
            badge: 'Popular'
        },
        {
            id: 'industrial_bands',
            name: 'Industrial Rubber Bands',
            image: '/images/industrial_bands.png',
            description: 'Heavy-duty reinforced rubber bands designed for industrial packaging.',
            badge: 'Heavy Duty'
        },
        {
            id: 'silicone_bands',
            name: 'Silicone Rubber Bands',
            image: '/images/silicone_bands.png',
            description: 'High-performance silicone bands with superior heat resistance.',
            badge: 'Heat Resistant'
        },
        {
            id: 'latex_free',
            name: 'Medical Grade Bands',
            image: '/images/product_preview.png',
            description: 'Safe for medical environments, 100% latex-free synthetic material.',
            badge: 'Specialized'
        },
        {
            id: 'stretch_bands',
            name: 'Max Flex Stretch Bands',
            image: '/images/product_preview.png',
            description: 'Ultra-stretchable bands with up to 900% elongation capacity.',
            badge: 'Flexible'
        }
    ];

    const handleBuyNow = (productId) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/user/buy-products', productId } });
        } else {
            navigate('/user/buy-products', { state: { selectedProduct: productId } });
        }
    };

    return (
        <div className="products-page-root">
            <header className="products-hero">
                <div className="container">
                    <h1>Our Premium Products</h1>
                    <p>Discover our range of high-quality rubber products manufactured with precision and care since 1999.</p>
                </div>
            </header>

            <section className="products-grid-section">
                <div className="container">
                    <div className="products-grid">
                        {products.map(product => (
                            <div key={product.id} className="product-card-public">
                                <div className="product-image-container">
                                    <img src={product.image} alt={product.name} />
                                    {product.badge && <span className="product-badge-tag">{product.badge}</span>}
                                </div>
                                <div className="product-content">
                                    <h3>{product.name}</h3>
                                    <p>{product.description}</p>
                                    <button
                                        className="buy-now-btn-public"
                                        onClick={() => handleBuyNow(product.id)}
                                    >
                                        Buy Now <i className="fas fa-shopping-cart"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="wholesale-cta">
                <div className="container">
                    <div className="cta-box">
                        <h2>Looking for Bulk Wholesale?</h2>
                        <p>We provide competitive pricing for large volume orders. Contact our sales team for a custom quote.</p>
                        <button className="cta-contact-btn" onClick={() => navigate('/contact')}>
                            Contact Sales
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProductsPage;
