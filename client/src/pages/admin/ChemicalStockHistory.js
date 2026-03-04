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

const downloadPDF = (rows) => {
  // Simple PDF generation using window.print
  const printWindow = window.open('', '_blank');
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chemical Stock History</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .lot-item { margin: 5px 0; padding: 5px; background: #f9f9f9; border-left: 3px solid #4CAF50; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Chemical Stock History</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Unit</th>
            <th>On Hand</th>
            <th>Lots</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(c => `
            <tr>
              <td>${c.name}</td>
              <td>${c.unit || '-'}</td>
              <td>${c.onHand ?? 0}</td>
              <td>
                ${c.lots?.length ? c.lots.map(l => `
                  <div class="lot-item">
                    <strong>#${l.lotNo}</strong><br/>
                    Qty: ${l.quantity}, Cost: ${l.unitCost}<br/>
                    Received: ${l.receivedAt ? new Date(l.receivedAt).toLocaleDateString() : '-'}<br/>
                    Expires: ${l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '-'}
                  </div>
                `).join('') : '—'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
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
      const data = await listChemicals();
      setList(Array.isArray(data) ? data : []);
      const alertData = await chemicalAlerts();
      setAlerts(alertData || { low: [], expiring: [] });
    } catch (e) {
      console.error('Error loading chemicals:', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to load chemicals');
      // Set empty data on error
      setList([]);
      setAlerts({ low: [], expiring: [] });
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
        <button className="btn btn-secondary" onClick={() => downloadPDF(filtered)}>
          Export PDF
        </button>
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
