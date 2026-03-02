import React, { useEffect, useMemo, useState } from 'react';
import { listChemicals, chemicalAlerts } from '../../services/adminService';
import './ChemicalStockHistory.css';

const downloadCSV = (rows, filename = 'chemicals.csv') => {
  const headers = ['name','unit','onHand','lotNo','quantity','unitCost','receivedAt','expiresAt'];
  const csv = [headers.join(',')].concat(
    rows.flatMap(r => (r.lots?.length ? r.lots : [{ lotNo: '', quantity: '', unitCost: '', receivedAt: '', expiresAt: '' }]).map(l =>
      [r.name, r.unit || '', r.onHand ?? '', l.lotNo || '', l.quantity ?? '', l.unitCost ?? '', l.receivedAt || '', l.expiresAt || ''].join(',')
    ))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
};

const ChemicalStockHistory = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [alerts, setAlerts] = useState({ low: [], expiring: [] });

  const filtered = useMemo(() => list.filter(c => !filter || c.name.toLowerCase().includes(filter.toLowerCase())), [list, filter]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      setList(await listChemicals());
      setAlerts(await chemicalAlerts());
    } catch (e) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="chemical-stock-container">
      <div className="chemical-header">
        <div>
          <h1 className="chemical-title">Chemical Stock History</h1>
          <p className="chemical-subtitle">Chemical inventory history</p>
        </div>
      </div>

      <div className="chemical-controls">
        <input 
          className="filter-input"
          placeholder="Filter by name" 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
        />
        <button className="btn btn-secondary" onClick={() => downloadCSV(filtered)}>
          Export CSV
        </button>
        <button className="btn" onClick={loadAll} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {(alerts?.low?.length > 0 || alerts?.expiring?.length > 0) && (
        <div className="alerts-container">
          {alerts?.low?.length > 0 && (
            <div className="alert alert-warning">
              <strong>Low stock:</strong> {alerts.low.map(l => `${l.name} (${l.onHand})`).join(', ')}
            </div>
          )}
          {alerts?.expiring?.length > 0 && (
            <div className="alert alert-danger">
              <strong>Expiring soon:</strong> {alerts.expiring.map(l => `${l.name} lot ${l.lotNo}`).join(', ')}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : (
        <div className="table-container">
          <table className="chemical-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit</th>
                <th>On Hand</th>
                <th>Lots</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.unit}</td>
                  <td>{c.onHand}</td>
                  <td>
                    {c.lots?.length ? (
                      <div className="lot-details">
                        {c.lots.map(l => (
                          <div key={l.lotNo} className="lot-item">
                            <span>#{l.lotNo}</span>
                            <span>Qty: {l.quantity}</span>
                            <span>Unit Cost: {l.unitCost}</span>
                            <span>Recv: {l.receivedAt ? new Date(l.receivedAt).toLocaleDateString() : '-'}</span>
                            <span>Exp: {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '-'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <div className="empty-state-text">No chemicals</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChemicalStockHistory;
