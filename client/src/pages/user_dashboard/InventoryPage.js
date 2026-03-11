import React, { useEffect, useMemo, useState } from 'react';
import { listBarrels, createBarrelRequest, reportIssue } from '../../services/storeService';

const InventoryPage = () => {
  const [barrels, setBarrels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reqQty, setReqQty] = useState('');
  const [issue, setIssue] = useState({ category: 'barrel', title: '', description: '' });
  const [message, setMessage] = useState('');

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 1) => {
    if (value === '') return '';
    const num = parseInt(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  const counts = useMemo(() => {
    const total = barrels.length;
    const inUse = barrels.filter(b => b.status === 'in-use').length;
    const inStorage = barrels.filter(b => b.status === 'in-storage').length;
    return { total, inUse, inStorage };
  }, [barrels]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await listBarrels();
        setBarrels(list);
      } catch (e) {
        setMessage('Failed to load barrels');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submitRequest = async () => {
    setMessage('');
    const q = Number(reqQty);
    if (Number.isNaN(q) || q < 1) { setMessage('Enter a valid quantity'); return; }
    try {
      await createBarrelRequest(q);
      setReqQty('');
      setMessage('Barrel request submitted');
    } catch (e) {
      setMessage(e?.message || 'Failed to submit request');
    }
  };

  const submitIssue = async () => {
    setMessage('');
    const title = (issue.title || '').trim();
    const description = (issue.description || '').trim();
    if (!title) { setMessage('Enter a title'); return; }
    try {
      await reportIssue({ ...issue, title, description });
      setIssue({ category: 'barrel', title: '', description: '' });
      setMessage('Issue reported');
    } catch (e) {
      setMessage(e?.message || 'Failed to report issue');
    }
  };

  return (
    <div>
      <h3>Barrel Inventory</h3>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body">Total: <strong>{counts.total}</strong> | In Use: <strong>{counts.inUse}</strong> | In Storage: <strong>{counts.inStorage}</strong></div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">Request Barrels</div>
        <div className="card-body" style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            value={reqQty}
            onChange={(e) => {
              const validated = validateNumberInput(e.target.value, 1);
              setReqQty(validated === '' ? '' : parseInt(validated));
            }}
            className="form-control"
            placeholder="Quantity"
            style={{ width: 160 }}
            step="1"
            min="1"
            inputMode="numeric"
            onKeyDown={(evt)=>['e','E','+','-','.'].includes(evt.key) && evt.preventDefault()}
            onWheel={(e)=>e.currentTarget.blur()}
          />
          <button className="btn btn-primary" onClick={submitRequest}>Submit</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">Report Issue</div>
        <div className="card-body">
          <div className="form-group"><label>Category</label>
            <select className="form-control" value={issue.category} onChange={(e) => setIssue({ ...issue, category: e.target.value })}>
              <option value="scraping">Scraping</option>
              <option value="inventory">Inventory</option>
              <option value="barrel">Barrel</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group"><label>Title</label><input className="form-control" value={issue.title} onChange={(e) => setIssue({ ...issue, title: e.target.value })} /></div>
          <div className="form-group"><label>Description</label><textarea className="form-control" rows={3} value={issue.description} onChange={(e) => setIssue({ ...issue, description: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={submitIssue} disabled={!issue.title.trim()}>Submit Issue</button>
        </div>
      </div>
      <div className="card">
        <div className="card-header">Barrels</div>
        <div className="card-body">
          {loading ? 'Loading...' : (
            <table className="table">
              <thead>
                <tr><th>Serial</th><th>Status</th><th>Location</th><th>Capacity</th><th>Current</th></tr>
              </thead>
              <tbody>
                {barrels.map(b => (
                  <tr key={b._id}><td>{b.barrelId}</td><td>{b.status}</td><td>{b.lastKnownLocation || '-'}</td><td>{b.capacity} {b.unit}</td><td>{b.currentVolume} {b.unit}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {message && <div>{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;


