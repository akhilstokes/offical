import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminRateVerification.css';

const AdminRateVerification = () => {
  const [currentRate, setCurrentRate] = useState(null);
  const [pendingProposals, setPendingProposals] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApprovalSection, setShowApprovalSection] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchCurrentRate();
    fetchPendingRates();
  }, []);

  const fetchCurrentRate = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/user-dashboard/rates/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setCurrentRate(response.data);
      }
    } catch (err) {
      console.error('Error fetching current rate:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPendingRates = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rates/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPendingProposals(response.data.data || []);
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
        // Remove the approved rate from pending list and refresh current rate
        setPendingProposals(prev => prev.filter(r => r._id !== rateId));
        setSuccess('Rate approved and published successfully!');
        fetchCurrentRate();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error approving rate:', err);
      setError(err.response?.data?.message || 'Failed to approve rate');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRejectClick = async (rate) => {
    const confirmed = window.confirm('Are you sure you want to reject this rate?');
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/api/rates/reject/${rate._id}`,
        { reason: 'Rejected by admin' },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Remove the rejected rate from the pending list immediately
        setPendingProposals(prev => prev.filter(r => r._id !== rate._id));
        setSuccess('Rate rejected successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error rejecting rate:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to reject rate';
      setError(errorMsg);
      
      // If rate is not pending anymore, refresh the list
      if (errorMsg.includes('pending') || errorMsg.includes('not found')) {
        fetchPendingRates();
      }
      
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

  const handleRefreshPending = () => {
    fetchPendingRates();
  };

  return (
    <div className="admin-rate-verification">
      <div className="page-header">
        <h1>Rate Management</h1>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Current Rate Display */}
      <div className="rate-section">
        <div className="section-header">
          <h2>Current Active Rate</h2>
          <div className="action-buttons">
            <button 
              className="btn-refresh-live"
              onClick={fetchCurrentRate}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Rate'}
            </button>
            <button 
              className="btn-refresh-pending"
              onClick={handleRefreshPending}
            >
              Refresh Pending
            </button>
            <button 
              className="btn-approve-rates"
              onClick={() => setShowApprovalSection(!showApprovalSection)}
            >
              {showApprovalSection ? 'Hide' : 'Show'} Rate Approvals ({pendingProposals.length})
            </button>
          </div>
        </div>

        {currentRate ? (
          <div className="rate-content">
            <div className="rate-info">
              <div className="rate-title">
                <strong>Active Company Rate - {currentRate.product || 'Latex 60%'}</strong>
              </div>
              <div className="rate-details">
                <div className="rate-item">
                  <span className="label">Company Rate:</span>
                  <span className="value">{formatCurrency(currentRate.companyRate)}/100KG</span>
                </div>
                <div className="rate-item">
                  <span className="label">Market Rate:</span>
                  <span className="value">{formatCurrency(currentRate.marketRate)}/100KG</span>
                </div>
                <div className="rate-item">
                  <span className="label">Effective Date:</span>
                  <span className="value">
                    {new Date(currentRate.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="rate-item">
                  <span className="label">Status:</span>
                  <span className="value status">Active</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-proposals">
            <em>No active rate found</em>
          </div>
        )}
      </div>

      {/* Rate Approval Section */}
      {showApprovalSection && (
        <div className="approval-section">
          <h3>Pending Rate Approvals</h3>
          
          {loading ? (
            <div className="loading-state">Loading rates...</div>
          ) : pendingProposals.length === 0 ? (
            <div className="no-proposals">
              <em>No pending rate approvals</em>
            </div>
          ) : (
            <div className="rates-grid">
              {pendingProposals.map((rate) => (
                <div key={rate._id} className="rate-card pending-card">
                  <div className="rate-card-header">
                    <div className="rate-product">{rate.product}</div>
                    {getStatusBadge(rate.status)}
                  </div>
                  
                  <div className="rate-details-grid">
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
      )}
    </div>
  );
};

export default AdminRateVerification;