import React, { useEffect, useMemo, useState } from 'react';
import { listChemicals, chemicalAlerts } from '../../services/adminService';
import './AdminChemicalRequests.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

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
      </style>
    </head>
    <body>
      <h1>Chemical Stock History</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Unit</th><th>On Hand</th><th>Lots</th></tr>
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
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

const AdminChemicalRequests = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'stock'
  
  // Requests state
  const [verified, setVerified] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  // Stock state
  const [stockList, setStockList] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [alerts, setAlerts] = useState({ low: [], expiring: [] });

  const filteredStock = useMemo(() => 
    stockList.filter(c => !stockFilter || c.name.toLowerCase().includes(stockFilter.toLowerCase())), 
    [stockList, stockFilter]
  );

  const loadVerified = async () => {
    try {
      const res = await fetch(`${API}/api/chem-requests/admin/verified`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load verified (${res.status})`);
      const data = await res.json();
      setVerified(Array.isArray(data?.records) ? data.records : []);
    } catch (e) { setError(e?.message || 'Failed to load verified'); setVerified([]); }
  };

  const loadHistory = async () => {
    setLoading(true); setError('');
    try {
      const qs = filter ? `?status=${encodeURIComponent(filter)}` : '';
      const res = await fetch(`${API}/api/chem-requests/admin/history${qs}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load history (${res.status})`);
      const data = await res.json();
      setHistory(Array.isArray(data?.records) ? data.records : []);
    } catch (e) { setError(e?.message || 'Failed to load history'); setHistory([]); }
    finally { setLoading(false); }
  };

  const loadStock = async () => {
    setStockLoading(true);
    setStockError('');
    try {
      const data = await listChemicals();
      setStockList(Array.isArray(data) ? data : []);
      const alertData = await chemicalAlerts();
      setAlerts(alertData || { low: [], expiring: [] });
    } catch (e) {
      console.error('Error loading chemicals:', e);
      setStockError(e?.response?.data?.message || e?.message || 'Failed to load chemicals');
      setStockList([]);
      setAlerts({ low: [], expiring: [] });
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => { 
    if (activeTab === 'requests') {
      loadVerified(); 
      loadHistory();
    } else {
      loadStock();
    }
  }, [activeTab]);

  const sendForPurchase = async (id) => {
    try {
      const note = window.prompt('Admin note (optional)') || '';
      const res = await fetch(`${API}/api/chem-requests/${id}/send-for-purchase`, { method:'PUT', headers: authHeaders(), body: JSON.stringify({ note }) });
      if (!res.ok) throw new Error(`Send for purchase failed (${res.status})`);
      await loadVerified();
      await loadHistory();
    } catch (e) { setError(e?.message || 'Failed to send for purchase'); }
  };

  const complete = async (id) => {
    try {
      const note = window.prompt('Completion note (optional)') || '';
      const res = await fetch(`${API}/api/chem-requests/${id}/complete`, { method:'PUT', headers: authHeaders(), body: JSON.stringify({ note }) });
      if (!res.ok) throw new Error(`Complete failed (${res.status})`);
      await loadHistory();
    } catch (e) { setError(e?.message || 'Failed to complete'); }
  };

  return (
    <div className="chemical-container">
      <div className="chemical-header">
        <h2>Chemical Management</h2>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Chemical Requests
        </button>
        <button 
          className={`tab ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          Stock History
        </button>
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="tab-content">
          {error && <div className="error-message">{error}</div>}

          <section style={{ marginTop: 12 }}>
            <h3>Verified (Awaiting Purchase Instruction)</h3>
            <div style={{ overflowX:'auto' }}>
              <table className="dashboard-table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>Chemical</th>
                    <th>Qty</th>
                    <th>Priority</th>
                    <th>Requested By</th>
                    <th>Purpose</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {verified.map(r => (
                    <tr key={r._id}>
                      <td>{r.chemicalName}</td>
                      <td>{r.quantity}</td>
                      <td style={{ textTransform:'capitalize' }}>{r.priority}</td>
                      <td>{r.requestedBy?.name || r.requestedBy?.email || '-'}</td>
                      <td title={r.purpose}>{r.purpose || '-'}</td>
                      <td>{new Date(r.updatedAt).toLocaleString()}</td>
                      <td><button onClick={()=>sendForPurchase(r._id)}>Send for Purchase</button></td>
                    </tr>
                  ))}
                  {verified.length===0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', color:'#6b7280' }}>No verified items.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h3>History</h3>
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
              <label>Filter</label>
              <select value={filter} onChange={e=>setFilter(e.target.value)}>
                <option value="">All</option>
                <option value="PENDING">PENDING</option>
                <option value="MANAGER_VERIFIED">MANAGER_VERIFIED</option>
                <option value="SENT_FOR_PURCHASE">SENT_FOR_PURCHASE</option>
                <option value="PURCHASE_IN_PROGRESS">PURCHASE_IN_PROGRESS</option>
                <option value="PURCHASED">PURCHASED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REJECTED_BY_MANAGER">REJECTED_BY_MANAGER</option>
              </select>
              <button onClick={loadHistory} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="dashboard-table" style={{ minWidth: 1100 }}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Chemical</th>
                    <th>Qty</th>
                    <th>Priority</th>
                    <th>Requested By</th>
                    <th>Purpose</th>
                    <th>Purchase</th>
                    <th>Updated</th>
                    <th>Complete</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r._id}>
                      <td>{r.status}</td>
                      <td>{r.chemicalName}</td>
                      <td>{r.quantity}</td>
                      <td style={{ textTransform:'capitalize' }}>{r.priority}</td>
                      <td>{r.requestedBy?.name || r.requestedBy?.email || '-'}</td>
                      <td title={r.purpose}>{r.purpose || '-'}</td>
                      <td>{r.purchaseInfo ? `${r.purchaseInfo.invoiceNo || ''} / ${r.purchaseInfo.supplier || ''} / ${r.purchaseInfo.quantity || ''}` : '-'}</td>
                      <td>{new Date(r.updatedAt).toLocaleString()}</td>
                      <td>{r.status !== 'COMPLETED' ? <button onClick={()=>complete(r._id)}>Complete</button> : '-'}</td>
                    </tr>
                  ))}
                  {history.length===0 && !loading && (
                    <tr><td colSpan={9} style={{ textAlign:'center', color:'#6b7280' }}>No records.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Stock History Tab */}
      {activeTab === 'stock' && (
        <div className="tab-content">
          <div className="stock-controls">
            <input 
              className="filter-input"
              placeholder="Filter by name" 
              value={stockFilter} 
              onChange={(e) => setStockFilter(e.target.value)} 
            />
            <button className="btn-secondary" onClick={() => downloadPDF(filteredStock)}>
              Export PDF
            </button>
            <button className="btn-secondary" onClick={() => downloadCSV(filteredStock)}>
              Export CSV
            </button>
            <button className="btn-primary" onClick={loadStock} disabled={stockLoading}>
              {stockLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {stockError && <div className="error-message">{stockError}</div>}

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

          {stockLoading ? (
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
                  {filteredStock.map((c) => (
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
                  {!filteredStock.length && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state">No chemicals</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminChemicalRequests;
