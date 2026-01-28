import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminRateApproval.css';

const AdminRateApproval = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rates/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRates(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError('Failed to load submitted rates');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (rateId) => {
    const confirmed = window.confirm('Are you sure you want to approve this rate? It will become the active rate.');
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/api/rates/approve/${rateId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Rate approved and published successfully!');
        fetchRates();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Error approving rate:', err);
      setError(err.response?.data?.message || 'Failed to approve rate');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRejectClick = (rate) => {
    setSelectedRate(rate);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedRate) return;

    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/api/rates/reject/${selectedRate._id}`,
        { reason: rejectReason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Rate rejected successfully');
        setShowRejectModal(false);
        setSelectedRate(null);
        setRejectReason('');
        fetchRates();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Error rejecting rate:', err);
      setError(err.response?.data?.message || 'Failed to reject rate');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', text: 'Pending' },
      approved: { class: 'status-approved', text: 'Approved' },
      rejected: { class: 'status-rejected', text: 'Rejected' },
      published: { class: 'status-published', text: 'Published' }
    };
    
    const statusInfo = statusMap[status] || statusMap.pending;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const pendingRates = rates.filter(r => r.status === 'pending');
  const processedRates = rates.filter(r => r.status !== 'pending');

  return (
    <div className="admin-rate-approval">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Rate Approval Management</h1>
        <p className="page-subtitle">Review and approve rates submitted by accountants</p>
        <button onClick={fetchRates} className="btn-refresh" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Pending Rates Section */}
      <div className="rates-section">
        <h2 className="section-title">
          Pending Approval ({pendingRates.length})
        </h2>
        
        {loading ? (
          <div className="loading-state">Loading rates...</div>
        ) : pendingRates.length === 0 ? (
          <div className="empty-state">
            <p>No pending rates to review</p>
          </div>
        ) : (
          <div className="rates-grid">
            {pendingRates.map((rate) => (
              <div key={rate._id} className="rate-card pending-card">
                <div className="rate-card-header">
                  <div className="rate-product">{rate.product}</div>
                  {getStatusBadge(rate.status)}
                </div>
                
                <div className="rate-details">
                  <div className="rate-detail-item">
                    <span className="detail-label">Market Rate</span>
                    <span className="detail-value">{formatCurrency(rate.marketRate)}/100KG</span>
                  </div>
                  <div className="rate-detail-item">
                    <span className="detail-label">Company Rate</span>
                    <span className="detail-value">{formatCurrency(rate.companyRate)}/100KG</span>
                  </div>
                  <div className="rate-detail-item">
                    <span className="detail-label">Effective Date</span>
                    <span className="detail-value">
                      {new Date(rate.effectiveDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="rate-detail-item">
                    <span className="detail-label">Submitted</span>
                    <span className="detail-value">
                      {new Date(rate.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {rate.notes && (
                  <div className="rate-notes">
                    <strong>Notes:</strong> {rate.notes}
                  </div>
                )}

                <div className="rate-actions">
                  <button
                    className="btn btn-approve"
                    onClick={() => handleApprove(rate._id)}
                  >
                    Approve & Publish
                  </button>
                  <button
                    className="btn btn-reject"
                    onClick={() => handleRejectClick(rate)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Rates Section */}
      {processedRates.length > 0 && (
        <div className="rates-section">
          <h2 className="section-title">
            Recently Processed ({processedRates.length})
          </h2>
          
          <div className="rates-table-container">
            <table className="rates-table">
              <thead>
                <tr>
                  <th>Date Submitted</th>
                  <th>Effective Date</th>
                  <th>Market Rate</th>
                  <th>Company Rate</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Processed</th>
                </tr>
              </thead>
              <tbody>
                {processedRates.map((rate) => (
                  <tr key={rate._id}>
                    <td>{new Date(rate.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(rate.effectiveDate).toLocaleDateString()}</td>
                    <td>{formatCurrency(rate.marketRate)}</td>
                    <td>{formatCurrency(rate.companyRate)}</td>
                    <td className="product-cell">{rate.product}</td>
                    <td>{getStatusBadge(rate.status)}</td>
                    <td>
                      {rate.verifiedAt 
                        ? new Date(rate.verifiedAt).toLocaleDateString()
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Rate Submission</h2>
              <button
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Please provide a reason for rejecting this rate submission:
              </p>
              
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows="4"
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-reject"
                onClick={handleRejectSubmit}
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

export default AdminRateApproval;
