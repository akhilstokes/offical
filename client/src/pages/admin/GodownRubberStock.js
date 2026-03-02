import React, { useEffect, useState } from 'react';
import { getStockLevel } from '../../services/adminService';
import './GodownRubberStock.css';

const GodownRubberStock = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getStockLevel());
    } catch (e) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = (quantity) => {
    if (quantity > 100) return { status: 'high', color: '#10b981', text: 'High Stock' };
    if (quantity > 50) return { status: 'medium', color: '#f59e0b', text: 'Medium Stock' };
    return { status: 'low', color: '#ef4444', text: 'Low Stock' };
  };

  return (
    <div className="godown-stock-container">
      <div className="stock-header">
        <div className="header-content">
          <h1 className="stock-title">Godown Rubber Stock</h1>
          <p className="stock-subtitle">Rubber stock management</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">Loading stock data...</div>
        </div>
      ) : data ? (
        <div className="stock-content">
          <div className="stock-cards">
            <div className="stock-card">
              <div className="card-header">
                <h3>{data.productName}</h3>
                <div className={`stock-badge ${getStockStatus(data.quantityInLiters).status}`}>
                  {getStockStatus(data.quantityInLiters).text}
                </div>
              </div>
              
              <div className="card-body">
                <div className="quantity-display">
                  <div className="quantity-value">
                    {data.quantityInLiters}
                    <span className="quantity-unit">Liters</span>
                  </div>
                  <div className="quantity-bar">
                    <div 
                      className="quantity-fill" 
                      style={{ 
                        width: `${Math.min((data.quantityInLiters / 200) * 100, 100)}%`,
                        backgroundColor: getStockStatus(data.quantityInLiters).color
                      }}
                    ></div>
                  </div>
                </div>

                <div className="stock-details">
                  <div className="detail-item">
                    <span className="detail-label">Last Updated</span>
                    <span className="detail-value">{formatDate(data.lastUpdated)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{formatDate(data.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stock-card">
              <div className="card-header">
                <h3>Stock Information</h3>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Product ID</span>
                  <span className="info-value">{data._id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Version</span>
                  <span className="info-value">v{data.__v}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className={`info-value status-${getStockStatus(data.quantityInLiters).status}`}>
                    {getStockStatus(data.quantityInLiters).text}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <h3>No Stock Data Available</h3>
          <p>No rubber stock information found in the system.</p>
        </div>
      )}
    </div>
  );
};

export default GodownRubberStock;
