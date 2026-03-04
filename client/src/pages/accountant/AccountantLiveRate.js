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
  const [showHistory, setShowHistory] = useState(false);
  const [rateHistory, setRateHistory] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchCurrentRate();
    fetchSubmittedRates();
    fetchRateHistory();
  }, []);

  const fetchCurrentRate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rates/latex/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Full API Response:', JSON.stringify(response.data, null, 2));
      
      // Handle current rate (admin's latest published rate)
      if (response.data.admin) {
        setCurrentRate(response.data.admin);
        console.log('Set current admin rate:', response.data.admin);
      }
      
      // Extract Rubber Board Latex 60% rate - ONLY Kottayam market (INR)
      let rubberRate = null;
      
      // Path 1: response.data.market.markets.Kottayam (preferred)
      if (response.data.market && response.data.market.markets && response.data.market.markets.Kottayam) {
        rubberRate = response.data.market.markets.Kottayam;
        console.log('✓ Found Kottayam rate from markets object:', rubberRate);
      }
      
      // Path 2: response.data.market.numeric[1] (second element is INR rate)
      // Array format: [percentage, INR, USD] = [60, 13260, 145.65]
      else if (response.data.market && Array.isArray(response.data.market.numeric) && response.data.market.numeric.length >= 2) {
        const inrRate = response.data.market.numeric[1]; // Second element is INR
        if (inrRate > 1000) { // Validate it's a reasonable INR rate
          rubberRate = inrRate;
          console.log('✓ Found INR rate from numeric array[1]:', rubberRate);
        }
      }
      
      // Path 3: Direct rubberBoardRate field
      else if (response.data.rubberBoardRate && response.data.rubberBoardRate > 1000) {
        rubberRate = response.data.rubberBoardRate;
        console.log('✓ Found rate from direct field:', rubberRate);
      }
      
      console.log('Final extracted Rubber Board Rate:', rubberRate);
      
      // Extract the date from Rubber Board response
      let rateDate = null;
      if (response.data.market && response.data.market.asOnDate) {
        rateDate = response.data.market.asOnDate;
        console.log('Rubber Board Rate Date:', rateDate);
      }
      
      if (rubberRate && typeof rubberRate === 'number' && rubberRate > 0) {
        setRubberBoardRate(rubberRate);
        setRubberBoardDate(rateDate);
        // Auto-fill market rate from Rubber Board
        setRateForm(prev => ({
          ...prev,
          marketRate: rubberRate.toString()
        }));
        console.log('✓ Successfully set Rubber Board rate:', rubberRate, 'Date:', rateDate);
      } else {
        console.warn('⚠ Could not extract valid Rubber Board rate from response');
        console.warn('Response structure:', {
          hasMarket: !!response.data.market,
          hasMarkets: !!(response.data.market && response.data.market.markets),
          hasNumeric: !!(response.data.market && response.data.market.numeric),
          marketKeys: response.data.market ? Object.keys(response.data.market) : []
        });
      }
    } catch (err) {
      console.error('Error fetching current rate:', err);
      console.error('Error details:', err.response?.data || err.message);
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
      const todayRate = Array.isArray(rates) ? rates.find(rate => {
        const rateDate = new Date(rate.createdAt);
        rateDate.setHours(0, 0, 0, 0);
        return rateDate.getTime() === today.getTime();
      }) : null;

      // Only block if today's submission is NOT draft (i.e., it's pending, approved, or published)
      if (todayRate && todayRate.status !== 'draft') {
        setSubmittedToday(true);
        setTodaySubmission(todayRate);
      } else {
        setSubmittedToday(false);
        setTodaySubmission(null);
      }
    } catch (err) {
      console.error('Error fetching submitted rates:', err);
      // Silent fail - just show empty list
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
      setError('Please enter a valid Market Rate');
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
    
    if (!validateForm()) {
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check if already submitted today (but allow draft status to be resubmitted)
    if (submittedToday && todaySubmission && todaySubmission.status !== 'draft') {
      setError('You have already submitted a rate today. Only one submission per day is allowed.');
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
          notes: rateForm.notes,
          status: 'pending'
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Rate submitted successfully! Waiting for admin approval.');
        setSubmittedToday(true);
        setTodaySubmission(response.data.data);
        setRateForm({
          marketRate: rubberBoardRate ? rubberBoardRate.toString() : '',
          companyRate: '',
          effectiveDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchSubmittedRates();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Error submitting rate:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit rate';
      setError(errorMsg);
      
      // If error says already submitted today, update state
      if (errorMsg.includes('already submitted')) {
        setSubmittedToday(true);
        if (err.response?.data?.existingSubmission) {
          setTodaySubmission(err.response.data.existingSubmission);
        }
      }
      
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
      {/* Header - Consistent with web design model */}
      <div className="page-header">
        <div className="header-actions-left">
          <h1 className="page-title">Live Rate Management</h1>
        </div>
        <div className="header-actions-right">
          <p className="page-subtitle">Submit daily latex rates for admin approval</p>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Current Active Rate + Rubber Board Rate */}
      <div className="current-rate-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="card-title">Current Rates - Latex 60%</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchCurrentRate}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '14px' }}
            >
              🔄 Refresh Rates
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '14px' }}
            >
              📊 View History
            </button>
          </div>
        </div>
        <div className="rate-display">
          {rubberBoardRate ? (
            <div className="rate-item rubber-board-highlight">
              <span className="rate-label">Rubber Board Rate (Live)</span>
              <span className="rate-value">{formatCurrency(rubberBoardRate)}/100KG</span>
              <small className="rate-source">📍 Kottayam Market</small>
              {rubberBoardDate && (
                <small className="rate-date">📅 Published on: {rubberBoardDate}</small>
              )}
            </div>
          ) : (
            <div className="rate-item" style={{ backgroundColor: '#fef3c7', borderColor: '#fbbf24' }}>
              <span className="rate-label">Rubber Board Rate</span>
              <span className="rate-value" style={{ fontSize: '14px', color: '#92400e' }}>
                ⚠️ Unable to fetch live rate
              </span>
              <small className="rate-source">Click "Refresh Rates" to try again</small>
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

      {/* Submit New Rate Form */}
      <div className="rate-form-card">
        <h2 className="card-title">Submit New Rate</h2>
        
        {submittedToday && todaySubmission && todaySubmission.status !== 'draft' && (
          <div style={{
            padding: 16,
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: 8,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <strong style={{ color: '#92400e', fontSize: 16 }}>
                Already Submitted Today
              </strong>
            </div>
            <p style={{ color: '#78350f', marginBottom: 8, fontSize: 14 }}>
              You have already submitted a rate today. Only one submission per day is allowed.
            </p>
            <div style={{ fontSize: 13, color: '#78350f' }}>
              <div>Market Rate: ₹{todaySubmission.marketRate?.toLocaleString()}/100KG</div>
              <div>Company Rate: ₹{todaySubmission.companyRate?.toLocaleString()}/100KG</div>
              <div>Status: <strong>{todaySubmission.status || 'Pending'}</strong></div>
              <div>Submitted: {new Date(todaySubmission.submittedAt || todaySubmission.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmitRate} className="rate-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Market Rate (₹/100KG) - Auto from Rubber Board
              </label>
              <input
                type="number"
                name="marketRate"
                value={rateForm.marketRate}
                placeholder="Loading from Rubber Board..."
                step="0.01"
                className="form-input"
                readOnly
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <small className="form-hint" style={{ color: '#10b981', fontWeight: 500 }}>
                ✓ Automatically fetched from Rubber Board (Kottayam Market)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                Company Rate (₹/100KG) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="companyRate"
                value={rateForm.companyRate}
                onChange={handleInputChange}
                placeholder="Enter company rate"
                step="0.01"
                className="form-input"
                required
                autoFocus
              />
              <small className="form-hint">Enter the rate your company will offer to customers</small>
            </div>

            <div className="form-group">
              <label className="form-label">
                Effective Date <span className="required">*</span>
              </label>
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
                placeholder="Add any notes..."
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !rateForm.marketRate || (submittedToday && todaySubmission?.status !== 'draft')}
            >
              {submitting ? 'Submitting...' : (submittedToday && todaySubmission?.status !== 'draft') ? '✓ Already Submitted Today' : !rateForm.marketRate ? 'Loading Rate...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Rates History */}
      <div className="submitted-rates-card">
        <h2 className="card-title">Submitted Rates</h2>
        
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : submittedRates.length === 0 ? (
          <div className="empty-state">
            <p>No submitted rates yet</p>
          </div>
        ) : (
          <div className="rates-table-container">
            <table className="rates-table">
              <thead>
                <tr>
                  <th>Date Submitted</th>
                  <th>Effective Date</th>
                  <th>Market Rate</th>
                  <th>Company Rate</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {submittedRates.map((rate) => (
                  <tr key={rate._id}>
                    <td>{new Date(rate.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(rate.effectiveDate).toLocaleDateString()}</td>
                    <td>{formatCurrency(rate.marketRate)}</td>
                    <td>{formatCurrency(rate.companyRate)}</td>
                    <td>{getStatusBadge(rate.status)}</td>
                    <td className="notes-cell">{rate.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: '90%',
            width: '1000px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                📊 Rate History - Latex 60%
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                ✕ Close
              </button>
            </div>

            {rateHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
                <div style={{ fontSize: 16 }}>No rate history available</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Market Rate</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Company Rate</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Source</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateHistory.map((rate, index) => (
                      <tr key={rate._id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: 12 }}>
                          {new Date(rate.effectiveDate || rate.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 500 }}>
                          {formatCurrency(rate.marketRate)}
                        </td>
                        <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 500 }}>
                          {formatCurrency(rate.companyRate)}
                        </td>
                        <td style={{ padding: 12 }}>
                          {getStatusBadge(rate.status)}
                        </td>
                        <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>
                          {rate.source || 'manual'}
                        </td>
                        <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>
                          {rate.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantLiveRate;
