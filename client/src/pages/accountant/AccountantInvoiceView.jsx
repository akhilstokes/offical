import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiPrinter, FiFileText, FiCheckCircle } from 'react-icons/fi';
import './AccountantInvoiceView.css';

const AccountantInvoiceView = () => {
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
                    setError(result.message || 'Invoice not found');
                }
            } catch (err) {
                console.error('Error fetching invoice:', err);
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
            <span>Rendering Document Ledger...</span>
        </div>
    );

    if (error) return (
        <div className="invoice-view-error">
            <FiFileText size={48} />
            <h2>Document Retrieval Failed</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/accountant/orders')}>Return to Ledger</button>
        </div>
    );

    if (!invoice) return null;

    // Compute subtotal & tax from stored fields, with fallback for older invoices
    // that were saved before subtotal/taxAmount fields existed.
    const computedSubtotal = invoice.subtotal != null
        ? invoice.subtotal
        : Math.round((invoice.totalAmount || 0) / 1.12);
    const computedTax = invoice.taxAmount != null
        ? invoice.taxAmount
        : (invoice.totalAmount || 0) - computedSubtotal;
    const cgst = computedTax / 2;
    const sgst = computedTax / 2;

    return (
        <div className="invoice-view-wrapper">
            <div className="view-controls no-print">
                <button className="ctrl-btn back" onClick={() => navigate('/accountant/orders')}>
                    <FiArrowLeft />
                    <span>Back</span>
                </button>
                <div className="ctrl-group">
                    <button className="ctrl-btn print" onClick={handlePrint}>
                        <FiPrinter />
                        <span>Print Invoice</span>
                    </button>
                    <button className="ctrl-btn download" onClick={handlePrint}>
                        <FiDownload />
                        <span>Save PDF</span>
                    </button>
                </div>
            </div>

            <div className="invoice-paper" ref={printRef}>
                {/* Visual Header */}
                <div className="paper-header">
                    <div className="company-info">
                        <h1>HOLY FAMILY POLYMERS</h1>
                        <div className="badge-official">OFFICIAL INVOICE</div>
                        <p className="address">Kooroppada P.O, Kottayam, Kerala - 686502</p>
                        <p className="contact">GSTIN: 32AAIHF1838M1ZX | Phone: +91 94474 15332</p>
                    </div>
                    <div className="invoice-qr">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=Invoice:${invoice.invoiceNumber}|Vendor:${invoice.vendor}|Amount:${invoice.totalAmount}`}
                            alt="Invoice QR"
                        />
                        <p>Scan to Verify</p>
                    </div>
                </div>

                <div className="invoice-meta-grid">
                    <div className="meta-box">
                        <label>INVOICE NUMBER</label>
                        <div className="value">#{invoice.invoiceNumber}</div>
                    </div>
                    <div className="meta-box">
                        <label>DATE OF ISSUE</label>
                        <div className="value">{new Date(invoice.invoiceDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                    </div>
                    <div className="meta-box">
                        <label>STATUS</label>
                        <div className={`value status ${invoice.status}`}>{invoice.status.toUpperCase()}</div>
                    </div>
                </div>

                <div className="party-grid">
                    <div className="party-box">
                        <label>BILL TO</label>
                        <h3>{invoice.vendor}</h3>
                        <p>{invoice.placeOfSupply}</p>
                        {invoice.customerPAN && (
                            <div style={{
                                marginTop: '8px',
                                padding: '6px 10px',
                                background: '#eff6ff',
                                border: '1px solid #dbeafe',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: '#1e40af'
                            }}>
                                PAN: {invoice.customerPAN}
                            </div>
                        )}
                    </div>
                    <div className="party-box">
                        <label>PAYMENT TERMS</label>
                        <h3>Settlement Account</h3>
                        <p>{invoice.paymentMethod === 'UPI' ? 'Personal Account' : 'Business Account'}</p>
                    </div>
                    <div className="party-box">
                        <label>DELIVERY DETAILS</label>
                        <h3>{invoice.vehicleNumber || 'N/A'}</h3>
                        <p>{invoice.vehicleType || 'Company'} Vehicle | {invoice.distance || 0} KM</p>
                    </div>
                </div>

                <div className="items-table-wrapper">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>DESCRIPTION</th>
                                <th>HSN/SAC</th>
                                <th className="text-right">QTY</th>
                                <th className="text-right">RATE</th>
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
                                    <td>{item.hsn}</td>
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
                        <label>NOTES & TERMS</label>
                        <p>1. Goods once sold will not be taken back.</p>
                        <p>2. Payment should be made within 7 days.</p>
                        <p>3. Subject to Kottayam Jurisdiction.</p>
                    </div>
                    <div className="summary-calculations">
                        <div className="calc-row">
                            <span>Subtotal</span>
                            <span>₹{computedSubtotal.toLocaleString()}</span>
                        </div>
                        <div className="calc-row">
                            <span>CGST (6%)</span>
                            <span>₹{cgst.toLocaleString()}</span>
                        </div>
                        <div className="calc-row">
                            <span>SGST (6%)</span>
                            <span>₹{sgst.toLocaleString()}</span>
                        </div>
                        <div className="calc-row total">
                            <span>Final Valuation</span>
                            <span>₹{(invoice.totalAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="invoice-footer">
                    <div className="footer-sign">
                        <div className="sign-line"></div>
                        <p>Authorized Signatory</p>
                        <p className="company-name">HOLY FAMILY POLYMERS</p>
                    </div>
                    <div className="footer-legal">
                        <p>Computer-generated invoice. No physical signature required.</p>
                        <p>Verified Secure Document: {invoice._id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountantInvoiceView;
