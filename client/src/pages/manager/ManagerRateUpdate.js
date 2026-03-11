import React, { useEffect, useState } from 'react';
import { proposeRate, listPendingRates } from '../../services/rateService';

const ManagerRateUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    effectiveDate: '',
    companyRate: '',
    marketRate: '',
    notes: ''
  });
  const [submittedRates, setSubmittedRates] = useState([]);
  const [officialRate, setOfficialRate] = useState(null);
  const [fetchingOfficial, setFetchingOfficial] = useState(false);
  const todayISO = new Date().toISOString().split('T')[0];

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setForm(prev => ({ ...prev, effectiveDate: today }));
    loadSubmittedRates();
    fetchOfficialRate(); // Auto-fetch on load
  }, []);

  const fetchOfficialRate = async (forceRefresh = false) => {
    setFetchingOfficial(true);
    console.log('🔍 Fetching official rate from Rubber Board...');
    try {
      const token = localStorage.getItem('token');
      const url = forceRefresh 
        ? 'http://localhost:5000/api/rubber-rate/latex?refresh=true'
        : 'http://localhost:5000/api/rubber-rate/latex';
      
      console.log('📡 API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (data.success) {
        setOfficialRate(data.data);
        // Auto-fill market rate field
        setForm(prev => ({ ...prev, marketRate: data.data.rate.toString() }));
        console.log('✅ Official rate set:', data.data.rate);
        if (forceRefresh) {
          setSuccess(`Official rate refreshed: ₹${data.data.rate}/100kg`);
        }
      } else {
        console.error('❌ Failed to fetch official rate:', data.error);
        setError('Could not fetch official rate from Rubber Board. You can still manually enter rates.');
      }
    } catch (error) {
      console.error('❌ Error fetching official rate:', error);
      setError('Error connecting to rate service. You can still manually enter rates.');
    } finally {
      setFetchingOfficial(false);
    }
  };

  const loadSubmittedRates = async () => {
    try {
      const list = await listPendingRates('latex60');
      setSubmittedRates(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load submitted rates:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.effectiveDate || !form.companyRate || !form.marketRate) {
      setError('Please fill in all required fields');
      return;
    }
    // Prevent past effective dates
    if (form.effectiveDate < todayISO) {
      setError('Effective Date cannot be in the past');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await proposeRate({
        effectiveDate: form.effectiveDate,
        companyRate: parseFloat(form.companyRate),
        marketRate: parseFloat(form.marketRate),
        product: 'latex60',
        notes: form.notes
      });

      setSuccess('Rate proposed for admin verification');
      setForm({
        effectiveDate: new Date().toISOString().split('T')[0],
        companyRate: '',
        marketRate: '',
        notes: ''
      });
      await loadSubmittedRates();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to submit rate update');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate numeric fields
    if (name === 'companyRate' || name === 'marketRate') {
      const validated = validateNumberInput(value, 0);
      setForm(prev => ({ ...prev, [name]: validated }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Propose Company & Market Rate</h2>
        <button onClick={loadSubmittedRates} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'tomato', marginBottom: 16, padding: 12, background: '#fee', borderRadius: 4 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'green', marginBottom: 16, padding: 12, background: '#efe', borderRadius: 4 }}>
          {success}
        </div>
      )}

      {/* Official Rubber Board Rate Display */}
      {fetchingOfficial && !officialRate && (
        <div className="dash-card" style={{ marginBottom: 24, background: '#f0f9ff', border: '2px solid #0ea5e9', textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 18, color: '#0369a1' }}>
            🔄 Fetching official rate from Rubber Board...
          </div>
        </div>
      )}
      
      {officialRate && (
        <div className="dash-card" style={{ marginBottom: 24, background: '#f0f9ff', border: '2px solid #0ea5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, marginBottom: 8, color: '#0369a1' }}>
                📊 Official Rubber Board Rate (Reference)
              </h4>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 4 }}>
                ₹{officialRate.rate.toLocaleString('en-IN')} / 100 KG
              </div>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                Date: {officialRate.date || 'N/A'} | Source: {officialRate.source}
              </div>
              {officialRate.cached && (
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Cached ({Math.floor(officialRate.cacheAge / 60)} min ago)
                </div>
              )}
            </div>
            <button 
              onClick={() => fetchOfficialRate(true)} 
              disabled={fetchingOfficial}
              style={{ 
                padding: '8px 16px', 
                background: '#0ea5e9', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                cursor: fetchingOfficial ? 'not-allowed' : 'pointer',
                opacity: fetchingOfficial ? 0.6 : 1
              }}
            >
              {fetchingOfficial ? '🔄 Refreshing...' : '🔄 Refresh from Rubber Board'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Submit New Rate Proposal */}
        <div className="dash-card">
          <h4 style={{ marginTop: 0, marginBottom: 16 }}>💼 Set Company Rate</h4>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Today Rate *
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={form.effectiveDate}
                onChange={handleInputChange}
                min={todayISO}
                required
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Company Rate (per 100 Kg) *
              </label>
              <input
                type="number"
                name="companyRate"
                value={form.companyRate}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                placeholder="Enter Company rate (₹)"
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Official Market Rate (per 100 Kg) *
              </label>
              <input
                type="number"
                name="marketRate"
                value={form.marketRate}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                placeholder="Auto-filled from Rubber Board"
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, background: '#f9fafb' }}
                readOnly
              />
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                ℹ️ Auto-filled from Rubber Board. Click refresh above to update.
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                placeholder="Add notes for admin review..."
                rows={3}
                style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: 12 }}
            >
              {loading ? 'Submitting...' : 'Submit for Admin Verification'}
            </button>
          </form>
        </div>

        {/* Submitted Rates */}
        <div className="dash-card">
          <h4 style={{ marginTop: 0, marginBottom: 16 }}>Pending Proposals</h4>
          
          {submittedRates.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>
              No submitted rates pending approval
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {submittedRates.map((rate, idx) => (
                <div key={idx} style={{ 
                  padding: 12, 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 4, 
                  marginBottom: 8,
                  background: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 16 }}>Latex 60%</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Effective: {formatDate(rate.effectiveDate)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>{formatCurrency(rate.companyRate)}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Market: {formatCurrency(rate.marketRate)}</div>
                    </div>
                  </div>
                  
                  {rate.notes && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      <strong>Notes:</strong> {rate.notes}
                    </div>
                  )}
                  
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Submitted: {formatDate(rate.createdAt)}
                  </div>
                  
                  <div style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    background: '#fef3c7', 
                    color: '#92400e',
                    fontSize: 12,
                    marginTop: 4
                  }}>
                    Pending Admin Verification
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="dash-card" style={{ marginTop: 24 }}>
        <h4 style={{ marginTop: 0 }}>Instructions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div>
            <h5>Rate Update Process:</h5>
            <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
              <li>Fill in the rate details for the effective date</li>
              <li>Submit the rate update for admin approval</li>
              <li>Admin will review and approve/reject the update</li>
              <li>Approved rates will be visible to customers</li>
            </ol>
          </div>
          
          <div>
            <h5>Important Notes:</h5>
            <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
              <li>Official rate is auto-fetched from Rubber Board daily</li>
              <li>Set your company rate (can be same, higher, or lower)</li>
              <li>Rates are per 100 Kg of product</li>
              <li>Effective date cannot be in the past</li>
              <li>Admin has final approval authority</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerRateUpdate;
