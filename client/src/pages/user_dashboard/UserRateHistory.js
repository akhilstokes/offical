import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './UserRateHistory.css';

const UserRateHistory = () => {
  const [rates, setRates] = useState([]);
  const [rubberBoardRates, setRubberBoardRates] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ratesRes, rubberBoardRes] = await Promise.all([
        axios.get('/api/rates/public-history?limit=30', config),
        axios.get('/api/rates/live/latex', config).catch(() => ({ data: [] }))
      ]);
      
      setRates(ratesRes.data || []);
      setRubberBoardRates(Array.isArray(rubberBoardRes.data) ? rubberBoardRes.data : [rubberBoardRes.data].filter(Boolean));
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');
  const formatPrice = (price) => `₹${price?.toLocaleString('en-IN') || 'N/A'}`;

  return (
    <div className="user-rate-history">
      <div className="header">
        <h1>📊 Rate History</h1>
        <p>View official rubber board rates and company rates</p>
      </div>

      {/* Official Rubber Board Rates */}
      {rubberBoardRates.length > 0 && (
        <div className="rubber-board-section">
          <h3>🏛️ Official Rubber Board Rates</h3>
          <div className="rate-cards">
            {rubberBoardRates.map((rate, index) => (
              <div key={index} className="rate-card official">
                <div className="rate-header">
                  <span className="rate-type">{rate.product || 'Latex (60%)'}</span>
                  <span className="rate-source">Official</span>
                </div>
                <div className="rate-value">{formatPrice(rate.rate)}</div>
                <div className="rate-date">{formatDate(rate.effectiveDate || rate.date)}</div>
                <div className="rate-note">Source: Rubber Board of India</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Rates */}
      <div className="company-rates-section">
        <h3>🏢 Company Rate History</h3>
        {loading ? (
          <div className="loading">Loading rates...</div>
        ) : rates.length === 0 ? (
          <div className="no-data">No company rates available</div>
        ) : (
          <div className="rates-table-container">
            <table className="rates-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Company Rate</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate._id}>
                    <td>{formatDate(rate.effectiveDate)}</td>
                    <td className="rate-value">{formatPrice(rate.companyRate || rate.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rate Comparison */}
      <div className="comparison-section">
        <h3>📈 Rate Comparison</h3>
        <div className="comparison-grid">
          <div className="comparison-card">
            <h4>Latest Official Rate</h4>
            <div className="comparison-value">
              {rubberBoardRates[0] ? formatPrice(rubberBoardRates[0].rate) : 'N/A'}
            </div>
            <div className="comparison-date">
              {rubberBoardRates[0] ? formatDate(rubberBoardRates[0].effectiveDate || rubberBoardRates[0].date) : 'N/A'}
            </div>
          </div>
          <div className="comparison-card">
            <h4>Latest Company Rate</h4>
            <div className="comparison-value">
              {rates[0] ? formatPrice(rates[0].rate) : 'N/A'}
            </div>
            <div className="comparison-date">
              {rates[0] ? formatDate(rates[0].effectiveDate) : 'N/A'}
            </div>
          </div>
          <div className="comparison-card">
            <h4>Difference</h4>
            <div className="comparison-value">
              {rubberBoardRates[0] && rates[0] 
                ? formatPrice(Math.abs(rates[0].rate - rubberBoardRates[0].rate))
                : 'N/A'
              }
            </div>
            <div className="comparison-date">
              {rubberBoardRates[0] && rates[0] 
                ? (rates[0].rate > rubberBoardRates[0].rate ? 'Company Higher' : 'Official Higher')
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="info-section">
        <h3>ℹ️ Information</h3>
        <div className="info-cards">
          <div className="info-card">
            <h4>Official Rates</h4>
            <p>These rates are fetched directly from the Rubber Board of India website and represent the official market rates.</p>
          </div>
          <div className="info-card">
            <h4>Company Rates</h4>
            <p>These are the rates set by Holy Family Polymers based on market conditions and business requirements.</p>
          </div>
          <div className="info-card">
            <h4>Rate Updates</h4>
            <p>Official rates are updated daily from the Rubber Board. Company rates are updated by administrators as needed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRateHistory;