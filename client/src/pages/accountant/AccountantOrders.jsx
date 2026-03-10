import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProductOrders } from '../../services/productOrderService';
import { FiRefreshCw, FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiCreditCard, FiArrowRight, FiFileText, FiDownload, FiAlertCircle } from 'react-icons/fi';
import './AccountantOrders.css';

const AccountantOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const ordersData = await getAllProductOrders();
            setOrders(ordersData);
        } catch (err) {
            setError('Failed to load orders.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleBilling = (order) => {
        navigate('/accountant/gst-invoice-generation', {
            state: { wholesaleOrder: order }
        });
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'REQUESTED':
                return { label: 'Quote Requested', color: '#f59e0b', icon: <FiClock /> };
            case 'BILLED':
                return { label: 'Billed (Pending Approval)', color: '#8b5cf6', icon: <FiFileText /> };
            case 'APPROVED':
                return { label: 'Approved', color: '#10b981', icon: <FiCheckCircle /> };
            case 'DELIVERED':
                return { label: 'Delivered', color: '#0d9488', icon: <FiTruck /> };
            case 'CANCELLED':
                return { label: 'Cancelled', color: '#ef4444', icon: <FiAlertCircle /> };
            default:
                return { label: status, color: '#64748b', icon: <FiPackage /> };
        }
    };

    if (loading) return (
        <div className="accountant-orders-loading">
            <div className="loader-orbit">
                <div className="orbit-spinner"></div>
            </div>
            <span>Synchronizing Secure Ledger...</span>
        </div>
    );

    return (
        <div className="accountant-orders-view">
            <div className="view-header">
                <div className="header-main">
                    <div className="header-icon">
                        <FiPackage />
                    </div>
                    <div className="header-text">
                        <h1>Wholesale Order Ledger</h1>
                        <p>Real-time oversight of bulk product requests and billing status.</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="premium-refresh-btn" onClick={loadData}>
                        <FiRefreshCw />
                        <span>Refresh Data</span>
                    </button>
                </div>
            </div>

            {error && <div className="error-glass-alert">{error}</div>}

            <div className="orders-ledger">
                {orders.length === 0 ? (
                    <div className="empty-ledger">
                        <FiPackage size={48} />
                        <h3>No Active Requests</h3>
                        <p>Verified wholesale orders will appear here for processing.</p>
                    </div>
                ) : (
                    <div className="ledger-grid">
                        {orders.map(order => {
                            const status = getStatusConfig(order.status);
                            return (
                                <div key={order._id} className={`ledger-card ${order.status.toLowerCase()}`}>
                                    <div className="card-top">
                                        <div className="order-id">
                                            <span className="id-label">ORD</span>
                                            <span className="id-value">#{order._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <div className="status-indicator" style={{ '--status-color': status.color }}>
                                            {status.icon}
                                            <span>{status.label}</span>
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        <div className="customer-blob">
                                            <div className="avatar">
                                                {order.customerId?.name ? order.customerId.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="details">
                                                <h4>{order.customerId?.name || 'Unregistered Entity'}</h4>
                                                <p>{new Date(order.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>

                                        <div className="product-summary">
                                            <div className="summary-item">
                                                <label>Wholesale SKU</label>
                                                <span>{order.packSizeName}</span>
                                            </div>
                                            <div className="summary-item">
                                                <label>Unit/Vol</label>
                                                <span>{order.quantity} Packages</span>
                                            </div>
                                            <div className="summary-item total">
                                                <label>Valuation</label>
                                                <span>{order.totalAmount != null ? `₹${order.totalAmount.toLocaleString()}` : 'Pending Quote'}</span>
                                            </div>
                                        </div>

                                        <div className="location-info">
                                            <FiMapPin className="icon" />
                                            <span>{order.deliveryAddress}</span>
                                        </div>

                                        <div className="payment-stack">
                                            <div className="pan-info">
                                                <div className="pan-label">PAN Number</div>
                                                <div className="pan-value" style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.95rem',
                                                    fontWeight: '600',
                                                    color: '#1e40af',
                                                    background: '#eff6ff',
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #dbeafe',
                                                    marginTop: '4px'
                                                }}>
                                                    {order.panNumber || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="payment-badge">
                                                <FiCreditCard />
                                                <span>{order.paymentMethod}</span>
                                            </div>
                                            {order.assignedDeliveryStaffId && (
                                                <div className="staff-badge">
                                                    <FiTruck />
                                                    <span>{order.assignedDeliveryStaffId.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="card-footer">
                                        {/* Show Download if invoice exists, otherwise show Generate (fallback) */}
                                        {order.invoiceId ? (
                                            <div className="billed-actions">
                                                <div className="completion-tag" style={{ border: '1px solid #e0e7ff' }}>
                                                    <FiFileText />
                                                    <span>{order.status === 'BILLED' ? 'Pending Approval' : 'Bill Approved'}</span>
                                                </div>
                                                <button
                                                    className="action-btn-secondary"
                                                    onClick={() => navigate(`/accountant/invoices/${order.invoiceId?._id || order.invoiceId}`)}
                                                >
                                                    <FiDownload />
                                                    <span>Invoice View</span>
                                                </button>
                                            </div>
                                        ) : null}
                                        {order.status === 'REQUESTED' && !order.invoiceId && (
                                            <button
                                                className="action-btn-primary"
                                                onClick={() => handleBilling(order)}
                                            >
                                                <FiFileText />
                                                <span>Calculate & Bill</span>
                                                <FiArrowRight className="arrow" />
                                            </button>
                                        )}
                                        {order.status === 'ACCOUNT_BILLED' && !order.invoiceId && (
                                            <div className="completion-tag">
                                                <FiCheckCircle />
                                                <span>Ledger Finalized</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountantOrders;
