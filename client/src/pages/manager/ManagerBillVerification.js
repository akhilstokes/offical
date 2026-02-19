import React, { useState, useEffect } from 'react';
import { FiFileText, FiCheck, FiX, FiEye, FiRefreshCw } from 'react-icons/fi';
import './ManagerBillVerification.css';

const ManagerBillVerification = () => {
    const [loading, setLoading] = useState(false);
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [managerNotes, setManagerNotes] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'history'
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (viewMode === 'pending') {
            fetchPendingBills();
        } else {
            fetchAllBills();
        }
    }, [viewMode]);

    const fetchPendingBills = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills/manager/pending`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch bills');
            }

            const data = await response.json();
            setBills(data.bills || []);
        } catch (err) {
            console.error('Error fetching bills:', err);
            setError('Failed to load bills');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllBills = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills/manager/all-bills?page=1&limit=100${statusParam}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch bills');
            }

            const data = await response.json();
            setBills(data.bills || []);
        } catch (err) {
            console.error('Error fetching bills:', err);
            setError('Failed to load bills');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveAndPayBill = async (billId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills/${billId}/approve-pay`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        managerNotes,
                        paymentMethod: 'Bank Transfer'
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to approve and pay bill');
            }

            setSuccess('Bill approved and marked as paid successfully!');
            setTimeout(() => setSuccess(''), 3000);
            setShowBillModal(false);
            setManagerNotes('');
            if (viewMode === 'pending') {
                fetchPendingBills();
            } else {
                fetchAllBills();
            }
        } catch (err) {
            console.error('Error approving bill:', err);
            setError('Failed to approve and pay bill');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleRejectBill = async () => {
        if (!rejectionReason.trim()) {
            setError('Please provide a rejection reason');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills/${selectedBill._id}/reject`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rejectionReason })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to reject bill');
            }

            setSuccess('Bill rejected');
            setTimeout(() => setSuccess(''), 3000);
            setShowRejectModal(false);
            setShowBillModal(false);
            setRejectionReason('');
            if (viewMode === 'pending') {
                fetchPendingBills();
            } else {
                fetchAllBills();
            }
        } catch (err) {
            console.error('Error rejecting bill:', err);
            setError('Failed to reject bill');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handlePrintBill = () => {
        window.print();
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending': { bg: '#fef3c7', color: '#92400e', text: 'Pending' },
            'manager_verified': { bg: '#dcfce7', color: '#166534', text: 'Verified' },
            'approved': { bg: '#dbeafe', color: '#1e40af', text: 'Approved' },
            'paid': { bg: '#d1fae5', color: '#065f46', text: 'Paid' },
            'rejected': { bg: '#fee2e2', color: '#991b1b', text: 'Rejected' }
        };

        const config = statusConfig[status] || statusConfig['pending'];
        
        return (
            <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                background: config.bg,
                color: config.color,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
            }}>
                {config.text}
            </span>
        );
    };

    return (
        <div className="manager-bill-verification">
            {/* Header */}
            <div className="bill-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <FiFileText /> Bill Verification
                    </h1>
                    <p className="page-description">
                        {viewMode === 'pending' 
                            ? 'Review and verify bills generated by accountant before sending to customers'
                            : 'View all bills history with status filters'
                        }
                    </p>
                </div>
                <div className="header-right">
                    {/* View Mode Toggle */}
                    <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
                        <button 
                            className={viewMode === 'pending' ? 'mode-btn active' : 'mode-btn'}
                            onClick={() => setViewMode('pending')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: viewMode === 'pending' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                background: viewMode === 'pending' ? '#eef2ff' : 'white',
                                color: viewMode === 'pending' ? '#4f46e5' : '#64748b',
                                fontWeight: viewMode === 'pending' ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Pending Bills
                        </button>
                        <button 
                            className={viewMode === 'history' ? 'mode-btn active' : 'mode-btn'}
                            onClick={() => setViewMode('history')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: viewMode === 'history' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                background: viewMode === 'history' ? '#eef2ff' : 'white',
                                color: viewMode === 'history' ? '#4f46e5' : '#64748b',
                                fontWeight: viewMode === 'history' ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            History
                        </button>
                    </div>
                    <button 
                        className="refresh-btn"
                        onClick={viewMode === 'pending' ? fetchPendingBills : fetchAllBills}
                        disabled={loading}
                    >
                        <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Status Filter (only in history mode) */}
            {viewMode === 'history' && (
                <div style={{ 
                    background: 'white', 
                    padding: '1rem 1.5rem', 
                    borderRadius: '8px', 
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>Filter by Status:</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['all', 'pending', 'manager_verified', 'approved', 'paid', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => {
                                    setStatusFilter(status);
                                    setTimeout(() => fetchAllBills(), 100);
                                }}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: statusFilter === status ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                    background: statusFilter === status ? '#eef2ff' : 'white',
                                    color: statusFilter === status ? '#4f46e5' : '#64748b',
                                    fontWeight: statusFilter === status ? '600' : '500',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                    <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '14px' }}>
                        {bills.length} bill{bills.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Success/Error Messages */}
            {success && <div className="alert-success">{success}</div>}
            {error && <div className="alert-error">{error}</div>}

            {/* Bills Table */}
            <div className="bills-table-container">
                {loading ? (
                    <div className="bills-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading bills...</p>
                    </div>
                ) : bills.length > 0 ? (
                    <table className="bills-table">
                        <thead>
                            <tr>
                                <th>BILL NO.</th>
                                <th>DATE</th>
                                <th>CUSTOMER</th>
                                <th>PHONE</th>
                                <th>BARRELS</th>
                                <th>DRC%</th>
                                <th>AMOUNT</th>
                                {viewMode === 'history' && <th>STATUS</th>}
                                <th>ACCOUNTANT</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill._id}>
                                    <td>
                                        <span className="bill-number">{bill.billNumber}</span>
                                    </td>
                                    <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                                    <td><strong>{bill.customerName}</strong></td>
                                    <td>{bill.customerPhone}</td>
                                    <td>
                                        <span className="barrel-badge">{bill.barrelCount}</span>
                                    </td>
                                    <td>
                                        <span className="drc-badge">{bill.drcPercent}%</span>
                                    </td>
                                    <td>
                                        <span className="amount-value">
                                            ₹{bill.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    {viewMode === 'history' && <td>{getStatusBadge(bill.status)}</td>}
                                    <td>{bill.createdBy?.name || 'N/A'}</td>
                                    <td>
                                        {viewMode === 'pending' ? (
                                            <button
                                                className="view-btn"
                                                onClick={() => {
                                                    setSelectedBill(bill);
                                                    setShowBillModal(true);
                                                }}
                                            >
                                                <FiEye /> Review
                                            </button>
                                        ) : (
                                            <button
                                                className="view-btn"
                                                onClick={() => {
                                                    setSelectedBill(bill);
                                                    setShowBillModal(true);
                                                }}
                                            >
                                                <FiEye /> View
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <FiFileText className="empty-icon" />
                        <p>No pending bills for verification</p>
                    </div>
                )}
            </div>

            {/* Bill Review Modal */}
            {showBillModal && selectedBill && (
                <div className="modal-overlay">
                    <div className="bill-modal">
                        <div className="bill-content" id="printable-bill">
                            {/* Company Header */}
                            <div className="bill-header-print">
                                <h1 className="company-name">HOLY FAMILY POLYMERS</h1>
                                <p className="company-location">Koorppada, Kottayam</p>
                                <div className="bill-divider"></div>
                            </div>

                            {/* Bill Info */}
                            <div className="bill-info-section">
                                <div className="bill-info-row">
                                    <div className="bill-info-item">
                                        <span className="bill-label">Bill No:</span>
                                        <span className="bill-value">{selectedBill.billNumber}</span>
                                    </div>
                                    <div className="bill-info-item">
                                        <span className="bill-label">Date:</span>
                                        <span className="bill-value">
                                            {new Date(selectedBill.createdAt).toLocaleDateString('en-IN', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <div className="bill-info-row">
                                    <div className="bill-info-item">
                                        <span className="bill-label">Customer:</span>
                                        <span className="bill-value">{selectedBill.customerName}</span>
                                    </div>
                                    <div className="bill-info-item">
                                        <span className="bill-label">Phone:</span>
                                        <span className="bill-value">{selectedBill.customerPhone}</span>
                                    </div>
                                </div>
                                <div className="bill-info-row">
                                    <div className="bill-info-item">
                                        <span className="bill-label">Total Barrels:</span>
                                        <span className="bill-value">{selectedBill.barrelCount}</span>
                                    </div>
                                    {selectedBill.sampleId && (
                                        <div className="bill-info-item">
                                            <span className="bill-label">Sample ID:</span>
                                            <span className="bill-value">{selectedBill.sampleId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bill Table */}
                            <table className="bill-table">
                                <thead>
                                    <tr>
                                        <th>SI No.</th>
                                        <th>Qty (Liters)</th>
                                        <th>DRC %</th>
                                        <th>Company Rate (₹/100KG)</th>
                                        <th>Total (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: selectedBill.barrelCount }, (_, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{(selectedBill.latexVolume / selectedBill.barrelCount).toFixed(2)}</td>
                                            <td>{selectedBill.drcPercent}%</td>
                                            <td>₹{selectedBill.marketRate}</td>
                                            <td>₹{selectedBill.perBarrelAmount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bill-total-row">
                                        <td colSpan="4" className="bill-total-label">Total Payment Amount:</td>
                                        <td className="bill-total-amount">
                                            ₹{selectedBill.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Verification Section */}
                            <div className="bill-verification">
                                <div className="verification-box">
                                    <p className="verification-label">Verified By:</p>
                                    <div className="signature-line"></div>
                                    <p className="verification-sublabel">Accountant Signature</p>
                                </div>
                                <div className="verification-box">
                                    <p className="verification-label">Approved By:</p>
                                    <div className="signature-line"></div>
                                    <p className="verification-sublabel">Manager Signature</p>
                                </div>
                            </div>

                            {/* Bill Footer */}
                            <div className="bill-footer">
                                {selectedBill.labStaff && (
                                    <p>Lab Staff: {selectedBill.labStaff}</p>
                                )}
                                <p>Accountant: {selectedBill.createdBy?.name || 'N/A'}</p>
                                <p className="bill-note">This is a computer-generated bill</p>
                            </div>
                        </div>

                        {/* Manager Notes */}
                        {viewMode === 'pending' && (
                            <div className="manager-notes-section no-print">
                                <label>Manager Notes (Optional):</label>
                                <textarea
                                    value={managerNotes}
                                    onChange={(e) => setManagerNotes(e.target.value)}
                                    placeholder="Add any notes or comments..."
                                    rows="3"
                                />
                            </div>
                        )}

                        {/* Modal Actions */}
                        <div className="bill-modal-actions no-print">
                            {viewMode === 'pending' ? (
                                <>
                                    <button 
                                        className="reject-btn"
                                        onClick={() => setShowRejectModal(true)}
                                    >
                                        <FiX /> Reject
                                    </button>
                                    <button 
                                        className="print-btn"
                                        onClick={handlePrintBill}
                                    >
                                        Print
                                    </button>
                                    <button 
                                        className="verify-btn"
                                        onClick={() => handleApproveAndPayBill(selectedBill._id)}
                                    >
                                        <FiCheck /> Approve & Mark Paid
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        className="bill-close-btn"
                                        onClick={() => setShowBillModal(false)}
                                    >
                                        Close
                                    </button>
                                    <button 
                                        className="print-btn"
                                        onClick={handlePrintBill}
                                    >
                                        Print
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="reject-modal">
                        <h2>Reject Bill</h2>
                        <p>Please provide a reason for rejecting this bill:</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            rows="4"
                            autoFocus
                        />
                        <div className="reject-modal-actions">
                            <button 
                                className="cancel-btn"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="confirm-reject-btn"
                                onClick={handleRejectBill}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerBillVerification;
