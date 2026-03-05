import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PurchaseBillView.css';

const PurchaseBillView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef();

    useEffect(() => {
        fetchBillData();
    }, [id]);

    const fetchBillData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/purchase-bills/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                setBill(data.data);
            } else {
                alert('Bill not found');
                navigate('/accountant/purchase-bills');
            }
        } catch (error) {
            console.error('Error fetching bill:', error);
            alert('Error loading bill');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="purchase-bill-view-container">
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading bill...</p>
                </div>
            </div>
        );
    }

    if (!bill) {
        return null;
    }

    const isIntraState = bill.supplier.state && bill.placeOfSupply && 
                        bill.supplier.state.toLowerCase() === bill.placeOfSupply.toLowerCase();

    return (
        <div className="purchase-bill-view-container">
            <div className="pbv-header no-print">
                <div className="pbv-title-section">
                    <h1><i className="fas fa-file-invoice"></i> Purchase Bill</h1>
                    <p>View and download purchase bill</p>
                </div>
                <div className="pbv-actions">
                    <button className="btn-back" onClick={() => navigate('/accountant/purchase-bills')}>
                        <i className="fas fa-arrow-left"></i> Back to List
                    </button>
                    <button className="btn-edit" onClick={() => navigate(`/accountant/purchase-bills/edit/${id}`)}>
                        <i className="fas fa-edit"></i> Edit
                    </button>
                    <button className="btn-download" onClick={handleDownloadPDF}>
                        <i className="fas fa-download"></i> Download PDF
                    </button>
                </div>
            </div>

            <div className="bill-document" ref={printRef}>
                {/* Bill Header */}
                <div className="bill-header">
                    <div className="company-logo-section">
                        <div className="logo-placeholder">
                            <i className="fas fa-industry"></i>
                        </div>
                    </div>
                    <div className="company-details">
                        <h1>HOLY FAMILY POLYMERS</h1>
                        <p>Kooroppada, P.O. - 686 502</p>
                        <p>GST No: 32AAIHF1838M1ZX</p>
                        <p>Phone: +91 9876543210</p>
                        <p>Email: info@holyfamilypolymers.com</p>
                    </div>
                </div>

                <div className="bill-divider"></div>

                {/* Bill Title and Number */}
                <div className="bill-title-section">
                    <h2>PURCHASE BILL</h2>
                    <div className="bill-meta">
                        <div className="meta-item">
                            <span className="meta-label">Bill No:</span>
                            <span className="meta-value">{bill.billNumber}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Date:</span>
                            <span className="meta-value">{new Date(bill.billDate).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Due Date:</span>
                            <span className="meta-value">{new Date(bill.dueDate).toLocaleDateString('en-GB')}</span>
                        </div>
                    </div>
                </div>

                {/* Supplier Information */}
                <div className="party-info-section">
                    <div className="party-box">
                        <h3>Supplier Details:</h3>
                        <table className="party-table">
                            <tbody>
                                <tr>
                                    <td className="label">Name:</td>
                                    <td className="value">{bill.supplier.name}</td>
                                </tr>
                                {bill.supplier.mobile && (
                                    <tr>
                                        <td className="label">Phone:</td>
                                        <td className="value">{bill.supplier.mobile}</td>
                                    </tr>
                                )}
                                {bill.supplier.gstin && (
                                    <tr>
                                        <td className="label">GSTIN:</td>
                                        <td className="value">{bill.supplier.gstin}</td>
                                    </tr>
                                )}
                                {bill.supplier.billingAddress && (
                                    <tr>
                                        <td className="label">Address:</td>
                                        <td className="value">{bill.supplier.billingAddress}</td>
                                    </tr>
                                )}
                                {bill.supplier.state && (
                                    <tr>
                                        <td className="label">State:</td>
                                        <td className="value">{bill.supplier.state}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="party-box">
                        <h3>Bill Details:</h3>
                        <table className="party-table">
                            <tbody>
                                {bill.purchaseOrderNumber && (
                                    <tr>
                                        <td className="label">PO Number:</td>
                                        <td className="value">{bill.purchaseOrderNumber}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="label">Place of Supply:</td>
                                    <td className="value">{bill.placeOfSupply}</td>
                                </tr>
                                <tr>
                                    <td className="label">Payment Terms:</td>
                                    <td className="value">{bill.paymentTerms.replace('_', ' ').toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td className="label">Total Items:</td>
                                    <td className="value">{bill.items.length}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Items Table */}
                <div className="items-section">
                    <table className="items-table-modern">
                        <thead>
                            <tr>
                                <th>SI NO.</th>
                                <th>ITEM NAME</th>
                                <th>HSN CODE</th>
                                <th>QTY</th>
                                <th>UNIT</th>
                                <th>RATE (₹)</th>
                                <th>GST %</th>
                                <th className="text-right">AMOUNT (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td><strong>{item.itemName}</strong></td>
                                    <td>{item.hsnCode || '-'}</td>
                                    <td className="text-right">{item.quantity.toFixed(2)}</td>
                                    <td>{item.unit}</td>
                                    <td className="text-right">{item.rate.toFixed(2)}</td>
                                    <td className="text-center">{item.gstRate}%</td>
                                    <td className="text-right"><strong>₹{item.amount.toFixed(2)}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bill Summary */}
                <div className="bill-summary-modern">
                    <div className="summary-box">
                        <table className="summary-table-modern">
                            <tbody>
                                <tr>
                                    <td>Subtotal:</td>
                                    <td className="text-right">₹{bill.subtotal.toFixed(2)}</td>
                                </tr>
                                {isIntraState ? (
                                    <>
                                        <tr>
                                            <td>CGST:</td>
                                            <td className="text-right">₹{bill.cgst.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td>SGST:</td>
                                            <td className="text-right">₹{bill.sgst.toFixed(2)}</td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td>IGST:</td>
                                        <td className="text-right">₹{bill.igst.toFixed(2)}</td>
                                    </tr>
                                )}
                                {bill.transportationCharges > 0 && (
                                    <tr>
                                        <td>Transportation:</td>
                                        <td className="text-right">₹{bill.transportationCharges.toFixed(2)}</td>
                                    </tr>
                                )}
                                {bill.otherCharges > 0 && (
                                    <tr>
                                        <td>Other Charges:</td>
                                        <td className="text-right">₹{bill.otherCharges.toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td>Round Off:</td>
                                    <td className="text-right">₹{bill.roundOff.toFixed(2)}</td>
                                </tr>
                                <tr className="total-row-modern">
                                    <td><strong>Total Payment Amount:</strong></td>
                                    <td className="text-right"><strong>₹{bill.totalAmount.toLocaleString()}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Status */}
                <div className="payment-status-section">
                    <div className="payment-box">
                        <div className="payment-row">
                            <span>Payment Status:</span>
                            <span className={`status-badge-modern status-${bill.paymentStatus}`}>
                                {bill.paymentStatus.toUpperCase()}
                            </span>
                        </div>
                        <div className="payment-row">
                            <span>Payment Method:</span>
                            <span>{bill.paymentMethod.toUpperCase()}</span>
                        </div>
                        <div className="payment-row">
                            <span>Amount Paid:</span>
                            <span>₹{bill.amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="payment-row balance">
                            <span><strong>Balance:</strong></span>
                            <span><strong>₹{bill.balanceAmount.toLocaleString()}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="signature-section-modern">
                    <div className="signature-box-modern">
                        <p>Verified By:</p>
                        <div className="signature-line-modern"></div>
                        <p className="signature-name">{bill.createdBy?.name || 'Accountant'}</p>
                        <p className="signature-role">Accountant Signature</p>
                    </div>
                    <div className="signature-box-modern">
                        <p>Approved By:</p>
                        <div className="signature-line-modern"></div>
                        <p className="signature-role">Manager Signature</p>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="footer-note-modern">
                    <p>This is a computer-generated document.</p>
                </div>
            </div>
        </div>
    );
};

export default PurchaseBillView;
