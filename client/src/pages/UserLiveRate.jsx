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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loadingHist, setLoadingHist] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

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

  useEffect(() => {
    if (!token) return; // Don't load data if not authenticated
    
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

  const reloadHistory = () => {
    if (!token) return;
    setLoadingHist(true);
    
    // Use the existing /api/rates/history-range endpoint
    const params = { product: 'latex60', limit: 50 };
    if (from) params.startDate = from;
    if (to) params.endDate = to;
    
    axios.get(`${API}/api/rates/history-range`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(({ data }) => setHistory(Array.isArray(data) ? data : data?.rates || data?.rows || []))
      .catch((error) => {
        console.error('Error loading history:', error);
        setHistory([]);
      })
      .finally(() => setLoadingHist(false));
  };

  const saveBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = async (e) => {
    e.preventDefault();
    try {
      // Generate CSV from current history data
      const csvContent = generateCsv(history);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      saveBlob(blob, `latex60-rate-history.csv`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleExportPdf = async (e) => {
    e.preventDefault();
    try {
      // Use browser print for PDF export
      window.print();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const generateCsv = (data) => {
    const headers = ['Date', 'Category', 'Market Rate', 'Company Rate'];
    const rows = data.map(row => {
      const n = normalize(row);
      return [
        new Date(n.date || row.effectiveDate).toLocaleDateString('en-IN'),
        'LATEX 60',
        n.official ?? '-',
        n.company ?? '-'
      ];
    });
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

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
          <button type="button" className="btn-secondary" onClick={() => { reloadLatest(); reloadHistory(); }} disabled={loadingLatest || loadingHist}>
            <i className={`fas fa-sync-alt ${loadingLatest || loadingHist ? 'fa-spin' : ''}`}></i>
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

      <div className="userdash-section-label">
        <h3>Rate History</h3>
        <div className="section-divider"></div>
      </div>

      <div className="dash-card history-card" style={{ padding: '24px' }}>
        <div className="history-filters">
          <div className="date-inputs">
            <label>
              From
              <input type="date" value={from} max={todayStr} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={to} min={from} max={todayStr} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          <div className="filter-actions">
            <button type="button" className="btn" onClick={reloadHistory} disabled={loadingHist}>
              <i className="fas fa-filter"></i> Filter
            </button>
            <button type="button" className="btn-secondary" onClick={handleExportCsv}>
              <i className="fas fa-file-csv"></i> CSV
            </button>
            <button type="button" className="btn-secondary" onClick={handleExportPdf}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
          </div>
        </div>

        {loadingHist ? (
          <div className="no-data"><i className="fas fa-spinner fa-spin"></i> Loading History...</div>
        ) : history && history.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Market Rate</th>
                  <th>Company Rate</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => {
                  const n = normalize(row);
                  return (
                    <tr key={row._id}>
                      <td style={{ fontWeight: '600', color: '#64748b' }}>
                        {new Date(n.date || row.effectiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td><span className="badge status-in-progress">LATEX 60</span></td>
                      <td style={{ fontWeight: '700' }}>₹ {n.official ?? '-'}</td>
                      <td style={{ fontWeight: '800', color: '#10b981' }}>₹ {n.company ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">No rate history found for the selected range.</div>
        )}
      </div>
    </div>
  );
}