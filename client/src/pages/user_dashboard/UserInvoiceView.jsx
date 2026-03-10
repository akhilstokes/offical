import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiPrinter, FiFileText } from 'react-icons/fi';
import './UserInvoiceView.css';

const UserInvoiceView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const printRef = useRef();

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/invoices/${id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const result = await response.json();
                if (response.ok) {
                    setInvoice(result.data);
                } else {
                    setError(result.message || 'Bill not found');
                }
            } catch (err) {
                console.error('Error fetching bill:', err);
                setError('Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="invoice-view-loading">
            <div className="loader-orbit"></div>
            <span>Generating your bill...</span>
        </div>
    );

    if (error) return (
        <div className="invoice-view-error">
            <FiFileText size={48} />
            <h2>Bill Retrieval Failed</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/user/buy-products')}>Return to Shop</button>
        </div>
    );

    if (!invoice) return null;

    return (
        <div className="invoice-view-wrapper user-view">
            <div className="view-controls no-print">
                <button className="ctrl-btn back" onClick={() => navigate('/user/buy-products')}>
                    <FiArrowLeft />
                    <span>Back to Shop</span>
                </button>
                <div className="ctrl-group">
                    <button className="ctrl-btn print" onClick={handlePrint}>
                        <FiPrinter />
                        <span>Print Bill</span>
                    </button>
                    <button className="ctrl-btn download" onClick={handlePrint}>
                        <FiDownload />
                        <span>Save as PDF</span>
                    </button>
                </div>
            </div>

            <div className="invoice-paper" ref={printRef}>
                {/* Visual Header */}
                <div className="paper-header">
                    <div className="company-info">
                        <h1>HOLY FAMILY POLYMERS</h1>
                        <div className="badge-official">OFFICIAL BILL</div>
                        <p className="address">Kooroppada P.O, Kottayam, Kerala - 686502</p>
                        <p className="contact">GSTIN: 32AAIHF1838M1ZX | Phone: +91 94474 15332</p>
                    </div>
                    <div className="invoice-qr">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=Invoice:${invoice.invoiceNumber}|Vendor:${invoice.vendor}|Amount:${invoice.totalAmount}`}
                            alt="Invoice QR"
                        />
                        <p>Verify Authenticity</p>
                    </div>
                </div>

                <div className="invoice-meta-grid">
                    <div className="meta-box">
                        <label>BILL NUMBER</label>
                        <div className="value">#{invoice.invoiceNumber}</div>
                    </div>
                    <div className="meta-box">
                        <label>DATE OF PURCHASE</label>
                        <div className="value">{new Date(invoice.invoiceDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                    </div>
                    <div className="meta-box">
                        <label>STATUS</label>
                        <div className={`value status ${invoice.status}`}>{invoice.status.toUpperCase()}</div>
                    </div>
                </div>

                <div className="party-grid">
                    <div className="party-box">
                        <label>CUSTOMER DETAILS</label>
                        <h3>{invoice.vendor}</h3>
                        <p><strong>Shipping to:</strong> {invoice.placeOfSupply}</p>
                    </div>
                    <div className="party-box">
                        <label>PAYMENT INFO</label>
                        <h3>Settled Online</h3>
                        <p>Transacted via secure portal</p>
                    </div>
                </div>

                <div className="items-table-wrapper">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>PRODUCT DESCRIPTION</th>
                                <th className="text-right">QTY</th>
                                <th className="text-right">UNIT PRICE</th>
                                <th className="text-right">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <div className="item-desc">{item.description}</div>
                                    </td>
                                    <td className="text-right">{item.quantity}</td>
                                    <td className="text-right">₹{(item.rate || item.unitPrice || 0).toLocaleString()}</td>
                                    <td className="text-right">₹{(item.amount || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="invoice-summary">
                    <div className="summary-notes">
                        <label>TERMS & CONDITIONS</label>
                        <p>1. This is a computer-generated confirmation of your wholesale order.</p>
                        <p>2. Shipping and delivery will be handled as per standard protocol.</p>
                        <p>3. Please keep this digital copy for your records.</p>
                    </div>
                    <div className="summary-calculations">
                        <div className="calc-row">
                            <span>Subtotal</span>
                            <span>₹{(invoice.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div className="calc-row">
                            <span>GST (18%)</span>
                            <span>₹{(invoice.taxAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="calc-row total">
                            <span>Grand Total</span>
                            <span>₹{(invoice.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="invoice-footer">
                    <div className="footer-sign">
                        <p className="company-name">HOLY FAMILY POLYMERS</p>
                        <p>Authorized Digital Document</p>
                    </div>
                    <div className="footer-legal">
                        <p>Thank you for choosing Holy Family Polymers for your wholesale needs.</p>
                        <p>Order ID: {invoice._id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInvoiceView;
