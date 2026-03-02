import React, { useEffect, useState } from 'react';
import { getStockSummary, listStockItems, updateStockItem } from '../../services/accountantService';
import './AccountantStockMonitor.css';

export default function AccountantStockMonitor() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const s = await getStockSummary();
      const i = await listStockItems();
      setSummary(s);
      setItems(i);
    } catch {
      setSummary(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="stock-monitor">
      {/* Header */}
      <div className="stock-header">
        <h1 className="stock-title">Stock Monitor</h1>
      </div>

      {loading ? (
        <div className="loading-state">Loading stock data...</div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="summary-cards">
              <div className="stat-card">
                <div className="stat-label">Total Latex Stock</div>
                <div className="stat-value">
                  {summary.latexLiters.toLocaleString()}
                  <span className="stat-unit">Liters</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Rubber Bands Stock</div>
                <div className="stat-value">
                  {summary.rubberBandUnits.toLocaleString()}
                  <span className="stat-unit">Units</span>
                </div>
              </div>
            </div>
          )}

          {/* Stock Items Table */}
          <div className="stock-table-card">
            <div className="table-header">
              <h2 className="table-title">Stock Items</h2>
            </div>

            <div className="table-wrap">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>ITEM</th>
                    <th>QUANTITY</th>
                    <th>LAST UPDATED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it._id}>
                      <td><strong>{it.productName}</strong></td>
                      <td>
                        {editRow?._id === it._id ? (
                          <input 
                            type="number" 
                            step="any" 
                            min={0}
                            value={editRow.quantityInLiters}
                            onChange={(e) => setEditRow(r => ({ ...r, quantityInLiters: e.target.value }))}
                            className="qty-input"
                            placeholder="Enter quantity"
                          />
                        ) : (
                          <span>{it.quantityInLiters.toLocaleString()}</span>
                        )}
                      </td>
                      <td>{it.lastUpdated ? new Date(it.lastUpdated).toLocaleString() : '-'}</td>
                      <td>
                        {editRow?._id === it._id ? (
                          <div className="btn-group">
                            <button 
                              className="btn btn-primary" 
                              disabled={savingId === it._id}
                              onClick={async () => {
                                try {
                                  setSavingId(it._id);
                                  setError('');
                                  setMessage('');
                                  const qty = Number(editRow.quantityInLiters);
                                  if (!(qty >= 0)) {
                                    setError('Enter a non-negative number');
                                    return;
                                  }
                                  await updateStockItem(it._id, { quantityInLiters: qty });
                                  setMessage('Stock updated successfully');
                                  setEditRow(null);
                                  await load();
                                } catch (e) {
                                  setError(e?.message || 'Update failed');
                                } finally {
                                  setSavingId(null);
                                }
                              }}
                            >
                              {savingId === it._id ? 'Saving...' : 'Save'}
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => setEditRow(null)} 
                              disabled={savingId === it._id}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-primary" 
                            onClick={() => setEditRow({ _id: it._id, quantityInLiters: it.quantityInLiters })}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="actions-bar">
              <button className="btn btn-secondary" onClick={load}>
                🔄 Refresh
              </button>
            </div>

            {/* Messages */}
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        </>
      )}
    </div>
  );
}
