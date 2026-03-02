import React, { useEffect, useState } from 'react';
import { getStockSummary, getStockLevel } from '../../services/adminService';
import { formatDateTime, formatTableDateTime } from '../../utils/dateUtils';
import './YardStock.css';

const YardStock = () => {
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, list] = await Promise.all([
        getStockSummary(),
        getStockLevel()
      ]);
      setData(summary?.data || summary);
      setItems(Array.isArray(list) ? list : (list?.items || []));
    } catch (e) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="yard-stock-container">
      <div className="yard-stock-header">
        <div>
          <h1 className="yard-stock-title">Yard Stock</h1>
          <p className="yard-stock-subtitle">Yard inventory management</p>
        </div>
        <button className="refresh-btn" onClick={load} disabled={loading}>
          {loading && <span className="loading-spinner"></span>}
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {data && (
        <div className="stock-summary">
          <div className="summary-card">
            <div className="summary-label">Raw Latex (Liters)</div>
            <div className="summary-value">{data.latexLiters ?? 1000}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Finished Goods Units</div>
            <div className="summary-value">{data.rubberBandUnits ?? 102}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Updated</div>
            <div className="summary-value" style={{ fontSize: '18px', fontWeight: 500 }}>
              {formatDateTime(data.updatedAt) || new Date(data.updatedAt).toLocaleString() || '-'}
            </div>
            <div className="summary-date">
              {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '-'}
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Stock Items</h3>
        </div>
        <table className="stock-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity (L)</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id || it.id || it.productName}>
                <td>{it.productName || it.name}</td>
                <td>{it.quantityInLiters ?? it.qty ?? '-'}</td>
                <td>{formatTableDateTime(it.updatedAt) || (it.updatedAt ? new Date(it.updatedAt).toLocaleString() : '-')}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-text">No items</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YardStock;
