import React, { useEffect, useState } from 'react';
import { getAllProductOrders, assignDeliveryStaff, updateOrderStatus, approveProductOrder, deleteProductOrder } from '../../services/productOrderService';
import { listStaffUsers } from '../../services/staffService';
import './ManagerOrders.css';

const ManagerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [gstInvoices, setGstInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deliveryStaff, setDeliveryStaff] = useState([]);
    const [assigningId, setAssigningId] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'invoices'

    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersData, staffData, invoicesData] = await Promise.all([
                getAllProductOrders(),
                listStaffUsers({ role: 'delivery_staff', status: 'active' }),
                fetchGSTInvoices()
            ]);
            setOrders(ordersData);
            setDeliveryStaff(Array.isArray(staffData?.users) ? staffData.users : []);
            setGstInvoices(invoicesData);
        } catch (err) {
            setError('Failed to load data. Please check your connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGSTInvoices = async () => {
        try {
            const response = await fetch(`${base}/api/gst-invoices`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.invoices || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching GST invoices:', error);
            return [];
        }
    };

    const downloadInvoicePDF = async (invoiceId) => {
        try {
            // Use the download parameter to automatically generate and download PDF
            const printWindow = window.open(`/accountant/bill-generation/print/${invoiceId}?download=true`, '_blank');
            if (printWindow) {
                printWindow.focus();
            }
        } catch (error) {
            console.error('Error downloading invoice PDF:', error);
            alert('Failed to download invoice PDF');
        }
    };

    const sendBillToUser = async (invoiceId) => {
        try {
            const response = await fetch(`${base}/api/gst-invoices/${invoiceId}/send-to-user`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert('Bill sent to user successfully!');
                loadData(); // Refresh data
            } else {
                alert('Failed to send bill to user');
            }
        } catch (error) {
            console.error('Error sending bill to user:', error);
            alert('Failed to send bill to user');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAssign = async (orderId) => {
        if (!selectedStaff) return;
        try {
            await assignDeliveryStaff(orderId, selectedStaff);
            setAssigningId(null);
            setSelectedStaff('');
            loadData();
        } catch (err) {
            alert('Failed to assign staff: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleStatusUpdate = async (orderId, status) => {
        try {
            await updateOrderStatus(orderId, status);
            loadData();
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleApprove = async (orderId) => {
        if (!window.confirm('Approve this bill and send to user?')) return;
        try {
            await approveProductOrder(orderId);
            loadData();
        } catch (err) {
            alert('Failed to approve order: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this wholesale request? This action cannot be undone.')) return;
        try {
            await deleteProductOrder(orderId);
            loadData();
        } catch (err) {
            alert('Failed to delete order: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'REQUESTED': return '#f59e0b';
            case 'BILLED': return '#8b5cf6';
            case 'APPROVED': return '#10b981';
            case 'DELIVERED': return '#14b8a6';
            case 'CANCELLED': return '#ef4444';
            default: return '#64748b';
        }
    };

    const getInvoiceStatusColor = (status) => {
        switch (status) {
            case 'Draft': return '#64748b';
            case 'Generated': return '#f59e0b';
            case 'Sent': return '#3b82f6';
            case 'Paid': return '#10b981';
            case 'Cancelled': return '#ef4444';
            default: return '#64748b';
        }
    };

    if (loading) return <div className="manager-orders-loading"><i className="fas fa-spinner fa-spin"></i> Loading Orders...</div>;

    return (
        <div className="manager-orders-container">
            <div className="manager-orders-header">
                <div>
                    <h2>Product Orders & GST Invoices</h2>
                    <p>Manage wholesale orders and GST invoices with PDF download and history.</p>
                </div>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={loadData}>
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            {error && <div className="error-alert">{error}</div>}

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <i className="fas fa-shopping-cart"></i>
                    Product Orders ({orders.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invoices')}
                >
                    <i className="fas fa-file-invoice-dollar"></i>
                    GST Invoices ({gstInvoices.length})
                </button>
            </div>

            {/* Product Orders Tab */}
            {activeTab === 'orders' && (
                <div className="orders-table-wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order Date</th>
                                <th>Customer</th>
                                <th>Product Details</th>
                                <th>Amount</th>
                                <th>PAN Number</th>
                                <th>Status</th>
                                <th>Delivery Assignment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="no-orders">No product orders found.</td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order._id}>
                                        <td>
                                            <div className="date-cell">
                                                {new Date(order.requestedAt).toLocaleDateString()}
                                                <span>{new Date(order.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="customer-cell">
                                                <strong>{order.customerId?.name || 'Unknown'}</strong>
                                                <span>{order.customerId?.phone || 'No phone'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="product-cell">
                                                <strong>{order.packSizeName}</strong>
                                                <span>Qty: {order.quantity} packs</span>
                                                <div className="address-tooltip" title={order.deliveryAddress}>
                                                    <i className="fas fa-map-marker-alt"></i> View Address
                                                </div>
                                            </div>
                                        </td>
                                        <td><strong className="price-text">₹{order.totalAmount?.toLocaleString() || '0'}</strong></td>
                                        <td>
                                            <div className="pan-cell">
                                                <span className="pan-number" style={{ 
                                                    fontFamily: 'monospace', 
                                                    fontSize: '0.9rem', 
                                                    fontWeight: '600',
                                                    color: '#1e40af',
                                                    background: '#eff6ff',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #dbeafe'
                                                }}>
                                                    {order.panNumber || 'N/A'}
                                                </span>
                                                <small style={{ 
                                                    display: 'block', 
                                                    color: '#64748b', 
                                                    fontSize: '0.75rem', 
                                                    marginTop: '2px' 
                                                }}>
                                                    {order.paymentMethod}
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="status-pill"
                                                style={{ backgroundColor: getStatusColor(order.status) }}
                                            >
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            {order.status === 'APPROVED' ? (
                                                <div className="assigned-staff">
                                                    <i className="fas fa-check-circle"></i> Approved
                                                </div>
                                            ) : order.status === 'BILLED' ? (
                                                <div className="assigned-staff" style={{ color: '#8b5cf6' }}>
                                                    <i className="fas fa-file-invoice"></i> Billed
                                                </div>
                                            ) : (
                                                <div className="assigned-staff" style={{ color: '#f59e0b' }}>
                                                    <i className="fas fa-clock"></i> Waiting
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                {(order.status === 'BILLED' || order.invoiceId) && (
                                                    <button
                                                        className="invoice-btn"
                                                        onClick={() => window.open(`/accountant/invoices/${order.invoiceId?._id || order.invoiceId}`, '_blank')}
                                                        title="View/Edit Bill"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                )}
                                                {order.status === 'BILLED' && (
                                                    <button
                                                        className="delivered-btn"
                                                        onClick={() => handleApprove(order._id)}
                                                        title="Approve & Send to User"
                                                    >
                                                        <i className="fas fa-check-circle"></i>
                                                    </button>
                                                )}
                                                {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={() => handleDelete(order._id)}
                                                        title="Delete Request"
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* GST Invoices Tab */}
            {activeTab === 'invoices' && (
                <div className="orders-table-wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Invoice No.</th>
                                <th>Invoice Date</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Taxable Value</th>
                                <th>Total Tax</th>
                                <th>Grand Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gstInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="no-orders">No GST invoices found.</td>
                                </tr>
                            ) : (
                                gstInvoices.map(invoice => (
                                    <tr key={invoice._id}>
                                        <td>
                                            <div className="invoice-cell">
                                                <strong>{invoice.invoiceNumber}</strong>
                                                <span>Supply: {new Date(invoice.supplyDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                {new Date(invoice.invoiceDate).toLocaleDateString()}
                                                <span>{new Date(invoice.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="customer-cell">
                                                <strong>{invoice.customerName}</strong>
                                                <span>{invoice.customerState}</span>
                                                {invoice.customerGSTIN && <span className="gstin">GSTIN: {invoice.customerGSTIN}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="items-cell">
                                                <strong>{invoice.items?.length || 0} item(s)</strong>
                                                {invoice.items?.[0] && (
                                                    <span>{invoice.items[0].description}</span>
                                                )}
                                                {invoice.items?.length > 1 && (
                                                    <span>+{invoice.items.length - 1} more</span>
                                                )}
                                            </div>
                                        </td>
                                        <td><strong className="price-text">₹{invoice.taxableValue?.toLocaleString() || '0'}</strong></td>
                                        <td><strong className="tax-text">₹{invoice.totalTax?.toLocaleString() || '0'}</strong></td>
                                        <td><strong className="total-text">₹{invoice.grandTotal?.toLocaleString() || '0'}</strong></td>
                                        <td>
                                            <span
                                                className="status-pill"
                                                style={{ backgroundColor: getInvoiceStatusColor(invoice.status) }}
                                            >
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button
                                                    className="pdf-btn"
                                                    onClick={() => downloadInvoicePDF(invoice._id)}
                                                    title="Download PDF"
                                                >
                                                    <i className="fas fa-file-pdf"></i>
                                                </button>
                                                <button
                                                    className="send-btn"
                                                    onClick={() => sendBillToUser(invoice._id)}
                                                    title="Send Bill to User"
                                                >
                                                    <i className="fas fa-paper-plane"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManagerOrders;
