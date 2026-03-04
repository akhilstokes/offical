// client/src/pages/UserLiveRate.jsx
import React, { useEffect, useState } from 'react';
import { getPublishedLatest } from '../services/rateService';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './UserLiveRate.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function UserLiveRate() {
  const { token } = useAuth();
  const category = 'LATEX60';
  const [rate, setRate] = useState(null);
  const [history, setHistory] = useState([]);
  const [drc, setDrc] = useState(''); // optional DRC for calculator handoff
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const normalize = (rec) => {
    if (!rec) return { official: null, company: null, date: null };
    const official = Number(rec.inr ?? rec.marketRate ?? rec.rate ?? rec.official);
    const company = Number(rec.company ?? rec.companyRate ?? rec.usd ?? rec.buyRate);
    const date = rec.effectiveDate ?? rec.createdAt ?? rec.date ?? null;
    return { official: isNaN(official) ? null : official, company: isNaN(company) ? null : company, date };
  };


  // Calculate effective rate based on DRC
  const calculateEffectiveRate = () => {
    if (!rate || !drc) return null;
    const { company } = normalize(rate);
    if (!company) return null;
    const drcVal = parseFloat(drc);
    if (isNaN(drcVal) || drcVal <= 0) return null;

    // Formula: Company Rate * (DRC / 100)
    // Company Rate is per Quintal (100kg)
    const perQuintal = company * (drcVal / 100);
    const perKg = perQuintal / 100;

    return { perQuintal, perKg };
  };

  const effective = calculateEffectiveRate();



  const reloadLatest = () => {
    setLoadingLatest(true);
    getPublishedLatest('latex60')
      .then((data) => setRate(data))
      .catch((error) => {
        console.error('Error loading latest rate:', error);
        setRate(null);
      })
      .finally(() => setLoadingLatest(false));
  };

  const reloadHistory = () => {
    if (!token) return;
    setLoadingHistory(true);
    axios.get(`${API}/api/rates/public-history?limit=30`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(({ data }) => {
        // Deduplicate by date - keep only one rate per day (the latest one)
        const ratesArray = Array.isArray(data) ? data : [];
        const uniqueByDate = {};
        
        ratesArray.forEach(rate => {
          const dateKey = new Date(rate.effectiveDate || rate.createdAt).toDateString();
          if (!uniqueByDate[dateKey]) {
            uniqueByDate[dateKey] = rate;
          }
        });
        
        setHistory(Object.values(uniqueByDate).slice(0, 10));
      })
      .catch((error) => {
        console.error('Error loading history:', error);
        setHistory([]);
      })
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    if (!token) {
      // Clear data if not authenticated
      setRate(null);
      setHistory([]);
      return;
    }
    
    reloadLatest();
    reloadHistory();
    // Auto-refresh every 60s
    const id = setInterval(() => {
      reloadLatest();
      reloadHistory();
    }, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="user-dashboard">
      <div className="userdash-header">
        <div className="userdash-title">
          <h2>Market Live Rates</h2>
          <p>Stay updated with the latest market trends and company buying rates.</p>
        </div>
        <div className="userdash-header-actions">
          {rate && (
            <div className="last-updated-badge">
              <i className="fas fa-clock"></i>
              <span>Updated: {rate.effectiveDate ? new Date(rate.effectiveDate).toLocaleString('en-IN') : '—'}</span>
            </div>
          )}
          <button type="button" className="btn-secondary" onClick={reloadLatest} disabled={loadingLatest}>
            <i className={`fas fa-sync-alt ${loadingLatest ? 'fa-spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="userdash-stats-row">
        <div className="userdash-stat-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper wallet">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="userdash-stat-info">
              <span className="userdash-stat-label">Market Official Rate</span>
              <h3 className="userdash-stat-value">₹ {normalize(rate).official ?? '--'}</h3>
            </div>
          </div>
          <div className="userdash-stat-link">
            <span>Per 100KG (Quintal)</span>
          </div>
        </div>

        <div className="userdash-stat-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper rate">
              <i className="fas fa-building"></i>
            </div>
            <div className="userdash-stat-info">
              <span className="userdash-stat-label">Company Buying Rate</span>
              <h3 className="userdash-stat-value">₹ {normalize(rate).company ?? '--'}</h3>
            </div>
          </div>
          <div className="userdash-stat-link">
            <span>Our Current Purchase Rate</span>
          </div>
        </div>

        <div className="userdash-stat-card calculator-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper alert">
              <i className="fas fa-calculator"></i>
            </div>
            <div className="userdash-stat-info" style={{ flex: 1 }}>
              <span className="userdash-stat-label">Price Calculator</span>
              <div style={{ marginTop: '8px' }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={drc}
                  onChange={(e) => setDrc(e.target.value)}
                  placeholder="Enter DRC %"
                  className="calculator-input"
                />
              </div>
            </div>
          </div>
          <div className="userdash-stat-link">
            <span>{effective ? `₹ ${effective.perKg.toFixed(2)} / KG` : 'Enter DRC for KG Rate'}</span>
          </div>
        </div>
      </div>

      {effective && (
        <div className="effective-price-banner">
          <div className="banner-content">
            <i className="fas fa-info-circle"></i>
            <span>Estimated Price for <strong>{drc}% DRC</strong>:</span>
            <span className="price-tag">₹ {effective.perKg.toFixed(2)} per KG</span>
            <span className="price-tag quintal">₹ {effective.perQuintal.toFixed(0)} per Quintal</span>
          </div>
        </div>
      )}

      <div className="userdash-section-label" style={{ marginTop: '32px' }}>
        <h3>Recent Rate History</h3>
        <div className="section-divider"></div>
      </div>

      {loadingHistory ? (
        <div className="no-data"><i className="fas fa-spinner fa-spin"></i> Loading History...</div>
      ) : history && history.length > 0 ? (
        <div className="userdash-stats-row" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {history.map((row) => {
            const n = normalize(row);
            return (
              <div key={row._id} className="userdash-stat-card" style={{ minHeight: '120px' }}>
                <div className="userdash-stat-content">
                  <div className="userdash-stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <i className="fas fa-calendar-day"></i>
                  </div>
                  <div className="userdash-stat-info">
                    <span className="userdash-stat-label" style={{ fontSize: '12px' }}>
                      {new Date(n.date || row.effectiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <h3 className="userdash-stat-value" style={{ fontSize: '22px' }}>₹ {n.company ?? '-'}</h3>
                  </div>
                </div>
                <div className="userdash-stat-link">
                  <span style={{ fontSize: '11px' }}>Company Rate</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-data">No rate history available.</div>
      )}
    </div>
  );
}