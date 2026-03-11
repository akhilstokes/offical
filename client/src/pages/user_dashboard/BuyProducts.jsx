import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createProductOrder } from '../../services/customerService';
import './BuyProducts.css';

const PreviewModal = ({ product, isOpen, onClose }) => {
    if (!isOpen || !product) return null;

    return (
        <div className="preview-modal-overlay" onClick={onClose}>
            <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>

                <div className="modal-layout">
                    <div className="modal-image-col">
                        <div className="product-badge">{product.badge || 'Premium Quality'}</div>
                        <img
                            src={product.image || "/images/product_preview.png"}
                            alt={product.name}
                            className="product-preview-img"
                        />
                    </div>

                    <div className="modal-info-col">
                        <h2 className="modal-product-title">{product.name}</h2>
                        <div className="modal-price-tag" style={{ background: '#fef3c7', color: '#92400e' }}>
                            Wholesale Quote Required
                        </div>

                        <div className="specs-section">
                            <h3>Specifications</h3>
                            <div className="specs-grid">
                                {Object.entries(product.specs).map(([key, value]) => (
                                    <div key={key} className="spec-item">
                                        <span className="spec-label">{key}:</span>
                                        <span className="spec-value">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="features-section">
                            <div className="feature-pill"><i className="fas fa-certificate"></i> ISO Certified</div>
                            <div className="feature-pill"><i className="fas fa-leaf"></i> Eco-Friendly</div>
                            <div className="feature-pill"><i className="fas fa-shield-alt"></i> Quality Tested</div>
                        </div>

                        <button className="modal-confirm-btn" onClick={onClose}>
                            Got it, Thanks!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BuyProducts = () => {
    const [formData, setFormData] = useState({
        productType: 'amber_bands',
        quantity: 1,
        paymentMethod: 'UPI',
        address: '',
        panNumber: ''
    });

    const location = useLocation();

    // Validate number input - only positive numbers allowed
    const validateNumberInput = (value, min = 1) => {
        if (value === '') return '';
        const num = parseInt(value);
        if (isNaN(num) || num < min) return '';
        return value;
    };

    useEffect(() => {
        if (location.state?.selectedProduct) {
            setFormData(prev => ({ ...prev, productType: location.state.selectedProduct }));
            // Optional: scroll to form if needed, but usually the page load is enough
        }
    }, [location.state]);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');
    const [success, setSuccess] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [panValidated, setPanValidated] = useState(false);
    const [panValidating, setPanValidating] = useState(false);

    const products = [
        {
            id: 'amber_bands',
            name: 'Standard Amber Rubber Bands',
            image: '/images/amber_bands.png',
            badge: 'Classic Choice',
            specs: { "Material": "Natural Rubber", "Color": "Amber", "Elasticity": "Excellent", "Grade": "Wholesale" }
        },
        {
            id: 'colored_bands',
            name: 'Colored Rubber Bands',
            image: '/images/colored_bands.png',
            badge: 'Vibrant',
            specs: { "Material": "Natural Rubber", "Color": "Assorted", "Elasticity": "High", "Grade": "Wholesale" }
        },
        {
            id: 'stretch_bands',
            name: 'Stretch Rubber Bands',
            image: '/images/product_preview.png',
            badge: 'Max Flex',
            specs: { "Material": "Low-Stress Latex", "Color": "Clear", "Elasticity": "900%", "Grade": "Wholesale" }
        },
        {
            id: 'latex_free',
            name: 'Latex-Free Rubber Bands',
            image: '/images/product_preview.png',
            badge: 'Medical Grade',
            specs: { "Material": "Synthetic", "Color": "Blue/Green", "Elasticity": "Safe", "Grade": "Wholesale" }
        },
        {
            id: 'industrial_bands',
            name: 'Industrial Rubber Bands',
            image: '/images/industrial_bands.png',
            badge: 'Heavy Duty',
            specs: { "Material": "Reinforced Rubber", "Color": "Black", "Elasticity": "Strong", "Grade": "Wholesale" }
        },
        {
            id: 'silicone_bands',
            name: 'Silicone Rubber Bands',
            image: '/images/silicone_bands.png',
            badge: 'Heat Resistant',
            specs: { "Material": "Silicone", "Color": "Translucent", "Elasticity": "Durable", "Grade": "Wholesale" }
        }
    ];

    // PAN validation function
    const validatePAN = async () => {
        if (!formData.panNumber.trim()) {
            setErr('PAN number is required for tax compliance');
            return;
        }

        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(formData.panNumber.toUpperCase())) {
            setErr('Invalid PAN format. Please enter a valid 10-character PAN (e.g., ABCDE1234F)');
            return;
        }

        setPanValidating(true);
        setErr('');

        try {
            // Simulate PAN validation API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // For demo purposes, accept any valid format PAN
            setPanValidated(true);
            setSuccess('PAN validated successfully! You can now proceed with payment.');
        } catch (error) {
            setErr('PAN validation failed. Please check your PAN number and try again.');
        } finally {
            setPanValidating(false);
        }
    };

    const handlePurchase = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErr('');
        setSuccess('');

        // Input validation
        if (!panValidated) {
            setErr('Please validate your PAN number before proceeding');
            setSubmitting(false);
            return;
        }
        if (!formData.address.trim()) {
            setErr('Delivery address is required');
            setSubmitting(false);
            return;
        }
        if (formData.quantity < 1) {
            setErr('Quantity must be at least 1');
            setSubmitting(false);
            return;
        }

        const selectedProduct = products.find(p => p.id === formData.productType) || products[0];

        try {
            await createProductOrder({
                productType: formData.productType,
                packSizeName: selectedProduct.name,
                quantity: formData.quantity,
                paymentMethod: formData.paymentMethod,
                deliveryAddress: formData.address,
                panNumber: formData.panNumber
                // Note: totalAmount is now calculated by the accountant
            });

            setSuccess('Wholesale request submitted! Our accountant will review and generate your quote shortly.');
            setFormData({
                productType: 'amber_bands',
                quantity: 1,
                paymentMethod: 'UPI',
                address: '',
                panNumber: ''
            });
            setPanValidated(false);
        } catch (error) {
            setErr(error.response?.data?.message || 'Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedProduct = products.find(p => p.id === formData.productType) || products[0];

    const handleSelectProduct = (productId) => {
        setFormData(prev => ({ ...prev, productType: productId }));
        const formElement = document.getElementById('order-form-section');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="user-dashboard buy-products-container">
            <PreviewModal
                product={selectedProduct}
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
            />

            <div className="userdash-header">
                <div className="userdash-title">
                    <h2>Wholesale Product Catalog</h2>
                    <p>Select a product category below to request a wholesale quotation. Our team will provide pricing based on your volume.</p>
                </div>
            </div>

            <div className="product-showcase-grid">
                {products.map(product => (
                    <div
                        key={product.id}
                        className={`product-card-premium ${formData.productType === product.id ? 'selected' : ''}`}
                        onClick={() => handleSelectProduct(product.id)}
                    >
                        <div className="product-card-badge">{product.badge}</div>
                        <div className="product-card-image">
                            <img src={product.image} alt={product.name} />
                            <div className="product-card-overlay">
                                <button
                                    className="view-specs-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData(prev => ({ ...prev, productType: product.id }));
                                        setShowPreview(true);
                                    }}
                                >
                                    <i className="fas fa-microscope"></i> Detailed Specs
                                </button>
                            </div>
                        </div>
                        <div className="product-card-info">
                            <h4>{product.name}</h4>
                            <p className="product-card-price" style={{ fontSize: '0.9rem', color: '#64748b' }}>Quote Required</p>
                            <button className="add-to-cart-btn">
                                {formData.productType === product.id ? 'Selected' : 'Select Category'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div id="order-form-section" className="userdash-content-grid" style={{ marginTop: '50px' }}>
                <div className="userdash-main-col">
                    <div className="dash-card order-checkout-card">
                        <div className="card-header">
                            <h3>
                                <i className="fas fa-file-invoice"></i>
                                Request Wholesale Quote: {selectedProduct.name}
                            </h3>
                        </div>

                        {err && (
                            <div className="alert error">
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{err}</span>
                            </div>
                        )}

                        {success && (
                            <div className="alert success" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-check-circle"></i>
                                    <span>{success}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handlePurchase} className="checkout-form">
                            <div className="form-group">
                                <label>Quantity (Units/KG)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={e => {
                                        const validated = validateNumberInput(e.target.value, 1);
                                        setFormData({ ...formData, quantity: validated === '' ? 1 : parseInt(validated) });
                                    }}
                                    className="modern-input"
                                    placeholder="Enter required quantity"
                                />
                            </div>

                            <div className="form-group">
                                <label>Enter PAN Number (Mandatory for Tax Compliance)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <input
                                        type="text"
                                        value={formData.panNumber}
                                        onChange={e => {
                                            setFormData({ ...formData, panNumber: e.target.value.toUpperCase() });
                                            setPanValidated(false);
                                            setErr('');
                                            setSuccess('');
                                        }}
                                        className="modern-input"
                                        placeholder="ABCDE1234F"
                                        maxLength="10"
                                        style={{ flex: 1 }}
                                        disabled={panValidated}
                                    />
                                    <button
                                        type="button"
                                        onClick={validatePAN}
                                        disabled={panValidating || panValidated || !formData.panNumber.trim()}
                                        className="btn-secondary"
                                        style={{
                                            padding: '10px 16px',
                                            minWidth: '120px',
                                            background: panValidated ? '#10b981' : '#4f46e5',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: panValidated || panValidating ? 'not-allowed' : 'pointer',
                                            opacity: panValidated || panValidating || !formData.panNumber.trim() ? 0.7 : 1
                                        }}
                                    >
                                        {panValidating ? (
                                            <><i className="fas fa-spinner fa-spin"></i> Validating...</>
                                        ) : panValidated ? (
                                            <><i className="fas fa-check"></i> Validated</>
                                        ) : (
                                            <>Validate PAN</>
                                        )}
                                    </button>
                                </div>
                                <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                                    PAN validation is required for tax compliance and GST invoice generation
                                </small>
                            </div>

                            {panValidated && (
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="modern-select"
                                    >
                                        <option value="UPI">UPI Payment</option>
                                        <option value="Card">Credit/Debit Card</option>
                                        <option value="COD">Cash on Delivery</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                    <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                                        Select your preferred payment method for the wholesale order
                                    </small>
                                </div>
                            )}

                            <div className="form-group full-width">
                                <label>Delivery Address</label>
                                <textarea
                                    rows="3"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Enter your full shipping address"
                                    className="modern-textarea"
                                    required
                                ></textarea>
                            </div>

                            <div className="order-summary-box" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                <span className="summary-label">Quotation Status:</span>
                                <span className="summary-value" style={{ color: '#64748b' }}>
                                    {panValidated ? 'Ready for Submission' : 'Pending PAN Validation'}
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !panValidated}
                                className="place-order-btn-large"
                                style={{
                                    background: panValidated ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#94a3b8',
                                    cursor: panValidated ? 'pointer' : 'not-allowed',
                                    opacity: panValidated ? 1 : 0.6
                                }}
                            >
                                {submitting ? (
                                    <><i className="fas fa-circle-notch fa-spin"></i> Submitting...</>
                                ) : !panValidated ? (
                                    <><i className="fas fa-lock"></i> Validate PAN to Continue</>
                                ) : (
                                    <><i className="fas fa-paper-plane"></i> Submit Request for Quotation</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="userdash-side-col">
                    <div className="info-promo-card delivery">
                        <h4><i className="fas fa-truck"></i> Fast Delivery</h4>
                        <p>Most wholesale orders are shipped within 24-48 business hours.</p>
                    </div>

                    <div className="info-promo-card secure">
                        <h4><i className="fas fa-shield-check"></i> 100% Secure</h4>
                        <p>Your transactions are protected with industry-standard encryption.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuyProducts;
