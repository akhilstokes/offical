import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountantLiveRate.css';

const AccountantLiveRate = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state - only latex60
  const [rateForm, setRateForm] = useState({
    marketRate: '',
    companyRate: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Submitted rates
  const [submittedRates, setSubmittedRates] = useState([]);
  const [submittedToday, setSubmittedToday] = useState(false);
  const [todaySubmission, setTodaySubmission] = useState(null);
  
  // Current active rate with Rubber Board data
  const [currentRate, setCurrentRate] = useState(null);
  const [rubberBoardRate, setRubberBoardRate] = useState(null);
  const [rubberBoardDate, setRubberBoardDate] = useState(null);
  const [rubberBoardSource, setRubberBoardSource] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [rateHistory, setRateHistory] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchSubmittedRates();
    fetchRateHistory();
  }, []);

  const fetchCurrentRate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rates/latex/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Handle current rate (admin's latest published rate)
      if (response.data.admin) {
        setCurrentRate(response.data.admin);
      }

      // Extract live market rate
      let rubberRate = null;
      let rateDate = null;

      if (response.data.market) {
        rubberRate = response.data.market.rate || (response.data.market.markets && response.data.market.markets.Kottayam);
        rateDate = response.data.market.asOnDate || response.data.market.date;
      }

      if (rubberRate && typeof rubberRate === 'number' && rubberRate > 0) {
        setRubberBoardRate(rubberRate);
        setRubberBoardDate(rateDate);
        setRubberBoardSource(response.data.market?.source || null);
        setRateForm(prev => ({
          ...prev,
          marketRate: rubberRate.toString()
        }));
        return rubberRate;
      } else {
        setRubberBoardRate(null);
        setRubberBoardSource(null);
        return null;
      }
    } catch (err) {
      console.error('Error fetching current rate:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchRateHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rates/history?product=latex60&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setRateHistory(response.data.data);
      } else if (Array.isArray(response.data)) {
        setRateHistory(response.data);
      }
    } catch (err) {
      console.error('Error fetching rate history:', err);
      setRateHistory([]);
    }
  };

  const fetchSubmittedRates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rates/pending?product=latex60`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSubmittedRates(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setSubmittedRates(response.data);
      }

      // Check if there's a submission today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const rates = response.data.success ? response.data.data : response.data;
      if (Array.isArray(rates)) {
        const todayRateData = rates.find(rate => {
          const rDate = new Date(rate.createdAt);
          rDate.setHours(0, 0, 0, 0);
          return rDate.getTime() === today.getTime();
        });

        if (todayRateData && todayRateData.status !== 'draft') {
          setSubmittedToday(true);
          setTodaySubmission(todayRateData);
        } else {
          setSubmittedToday(false);
          setTodaySubmission(null);
        }
      }
    } catch (err) {
      console.error('Error fetching submitted rates:', err);
      setSubmittedRates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!rateForm.marketRate || parseFloat(rateForm.marketRate) <= 0) {
      setError('Please enter or fetch a valid Market Rate');
      return false;
    }
    
    if (!rateForm.companyRate || parseFloat(rateForm.companyRate) <= 0) {
      setError('Please enter a valid Company Rate');
      return false;
    }
    
    if (!rateForm.effectiveDate) {
      setError('Please select an effective date');
      return false;
    }
    
    return true;
  };

  const handleSubmitRate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Ensure rate is fetched when user submits
    const latestRate = await fetchCurrentRate();
    if (latestRate) {
      setRateForm(prev => ({
        ...prev,
        marketRate: latestRate.toString()
      }));
    }

    if (!validateForm()) {
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (submittedToday && todaySubmission && todaySubmission.status !== 'draft') {
      setError('You have already submitted a rate today.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/rates/submit`,
        {
          marketRate: parseFloat(rateForm.marketRate),
          companyRate: parseFloat(rateForm.companyRate),
          product: 'latex60',
          effectiveDate: rateForm.effectiveDate,
          notes: rateForm.notes
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Rate submitted successfully!');
        setSubmittedToday(true);
        setTodaySubmission(response.data.data);
        setRateForm(prev => ({
          ...prev,
          companyRate: '',
          notes: ''
        }));
        fetchSubmittedRates();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Error submitting rate:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit rate';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
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
      pending: { class: 'status-pending', text: 'Pending Approval' },
      approved: { class: 'status-approved', text: 'Approved' },
      rejected: { class: 'status-rejected', text: 'Rejected' },
      published: { class: 'status-approved', text: 'Published' }
    };
    
    const statusInfo = statusMap[status] || statusMap.pending;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  return (
    <div className="accountant-live-rate">
      <div className="page-header">
        <div className="header-actions-left">
          <h1 className="page-title">Live Rate Management</h1>
        </div>
        <div className="header-actions-right">
          <p className="page-subtitle">Submit daily latex rates for admin approval</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="current-rate-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="card-title">Current Rates - Latex 60%</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchCurrentRate}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? '⏳ Updating...' : '🔄 Refresh Prices'}
            </button>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setShowHistory(true)}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              📊 View History
            </button>
          </div>
        </div>
        
        <div className="rate-info-container">
          {rubberBoardRate ? (
            <div className="rate-item" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981' }}>
              <span className="rate-label">Live Market Rate</span>
              <span className="rate-value">{formatCurrency(rubberBoardRate)}/100KG</span>
              {rubberBoardDate && (
                <small className="rate-date">📅 Published: {rubberBoardDate}</small>
              )}
              {rubberBoardSource && (
                <small className="rate-source">Source: {rubberBoardSource}</small>
              )}
            </div>
          ) : loading ? (
            <div className="rate-item loading">
              <span className="rate-label">Live Market Rate</span>
              <span className="rate-value">Fetching...</span>
            </div>
          ) : (
            <div className="rate-item error" style={{ backgroundColor: '#fff7ed', borderColor: '#fb923c' }}>
              <span className="rate-label">Live Market Rate</span>
              <span className="rate-value" style={{ fontSize: '14px', color: '#c2410c' }}>
                ⚠️ Not Available
              </span>
              <small className="rate-source">Enter manually below</small>
            </div>
          )}

          {currentRate && (
            <>
              <div className="rate-item">
                <span className="rate-label">Active Market Rate</span>
                <span className="rate-value">{formatCurrency(currentRate.marketRate)}/100KG</span>
                {currentRate.effectiveDate && (
                  <small className="rate-date">
                    {new Date(currentRate.effectiveDate).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </small>
                )}
              </div>
              <div className="rate-item">
                <span className="rate-label">Active Company Rate</span>
                <span className="rate-value">{formatCurrency(currentRate.companyRate)}/100KG</span>
                {currentRate.effectiveDate && (
                  <small className="rate-date">
                    {new Date(currentRate.effectiveDate).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </small>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rate-form-card">
        <h2 className="card-title">Submit New Rate</h2>
        
        {submittedToday && todaySubmission && (
          <div style={{
            padding: 16,
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: 8,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <strong style={{ color: '#92400e', fontSize: 16 }}>Already Submitted Today</strong>
            </div>
            <div style={{ fontSize: 13, color: '#78350f' }}>
              <div>Market Rate: ₹{todaySubmission.marketRate?.toLocaleString()}/100KG</div>
              <div>Company Rate: ₹{todaySubmission.companyRate?.toLocaleString()}/100KG</div>
              <div>Status: <strong>{todaySubmission.status}</strong></div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmitRate} className="rate-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Market Rate (₹/100KG) {rubberBoardRate ? '- Auto' : '- Manual'}
              </label>
              <input
                type="number"
                name="marketRate"
                value={rateForm.marketRate}
                onChange={handleInputChange}
                placeholder="Market rate"
                step="0.01"
                className="form-input"
                readOnly={!!rubberBoardRate && !loading}
                style={rubberBoardRate ? { backgroundColor: '#f8fafc' } : { borderColor: '#fb923c' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Rate (₹/100KG) *</label>
              <input
                type="number"
                name="companyRate"
                value={rateForm.companyRate}
                onChange={handleInputChange}
                placeholder="Enter rate"
                step="0.01"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Effective Date *</label>
              <input
                type="date"
                name="effectiveDate"
                value={rateForm.effectiveDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input
                type="text"
                name="notes"
                value={rateForm.notes}
                onChange={handleInputChange}
                placeholder="Add notes..."
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || (submittedToday && todaySubmission?.status !== 'draft')}
            >
              {submitting ? 'Submitting...' : submittedToday ? '✓ Submitted Today' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>

      <div className="submitted-rates-card">
        <h2 className="card-title">Submitted Rates</h2>
        {submittedRates.length === 0 ? (
          <div className="empty-state">No submitted rates yet</div>
        ) : (
          <div className="rates-table-container">
            <table className="rates-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Market Rate</th>
                  <th>Company Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {submittedRates.map((rate) => (
                  <tr key={rate._id}>
                    <td>{new Date(rate.effectiveDate).toLocaleDateString()}</td>
                    <td>{formatCurrency(rate.marketRate)}</td>
                    <td>{formatCurrency(rate.companyRate)}</td>
                    <td>{getStatusBadge(rate.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>📊 Rate History</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Market</th>
                    <th>Company</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rateHistory.map((rate, i) => (
                    <tr key={rate._id || i}>
                      <td>{new Date(rate.effectiveDate || rate.createdAt).toLocaleDateString()}</td>
                      <td>{formatCurrency(rate.marketRate)}</td>
                      <td>{formatCurrency(rate.companyRate)}</td>
                      <td>{getStatusBadge(rate.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setShowHistory(false)} className="btn btn-secondary">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantLiveRate;
