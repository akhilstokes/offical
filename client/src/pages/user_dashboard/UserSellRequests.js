import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const UserSellRequests = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({ totalVolumeKg: '', notes: '' });
  const [geo, setGeo] = useState({ lat: null, lng: null, accuracy: null });
  const [geoStatus, setGeoStatus] = useState('');

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  const safeDate = (d) => {
    if (!d) return '-';
    try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleString(); } catch { return '-'; }
  };

  const load = async () => {
    setLoading(true); setError(''); setInfo('');
    try {
      const res = await fetch(`${API}/api/sell-requests/my`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e?.message || 'Failed to load').replace(/<[^>]*>/g, ''));
      setList([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getLocation = () => {
    if (!(navigator && 'geolocation' in navigator)) {
      setGeoStatus('Geolocation not supported by this browser.');
      return;
    }
    setGeoStatus('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGeo({ lat: latitude, lng: longitude, accuracy });
        setGeoStatus(`Location captured (±${Math.round(accuracy)}m)`);
      },
      (err) => {
        setGeoStatus(err?.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const submit = async (e) => {
    e.preventDefault(); setError(''); setInfo('');
    const vol = Number(form.totalVolumeKg);
    if (!vol || vol <= 0) { setError('Please enter a valid volume in Kg.'); return; }
    try {
      const payload = {
        totalVolumeKg: vol,
        notes: form.notes || undefined,
        ...(geo.lat && geo.lng ? {
          location: { type: 'Point', coordinates: [geo.lng, geo.lat] },
          locationAccuracy: geo.accuracy,
        } : {})
      };
      const res = await fetch(`${API}/api/sell-requests`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 400) { setError(text.replace(/<[^>]*>/g, '') || 'Bad request'); return; }
        if (res.status === 401) { setError('You are not authenticated. Please login again.'); return; }
        throw new Error(`Submit failed (${res.status})`);
      }
      setForm({ totalVolumeKg: '', notes: '' });
      setInfo('Request submitted successfully.');
      await load();
    } catch (e) { setError((e?.message || 'Failed to submit').replace(/<[^>]*>/g, '')); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Sell Latex</h2>
      {error && <div style={{ color:'tomato', marginBottom:8 }}>{error}</div>}
      {info && <div style={{ color:'#0a7' }}>{info}</div>}

      <form onSubmit={submit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:720 }}>
        <div>
          <label>Volume (Kg)</label>
          <input type="number" min="1" step="0.01" value={form.totalVolumeKg} onChange={e => {
            const validated = validateNumberInput(e.target.value, 0);
            setForm(s => ({ ...s, totalVolumeKg: validated }));
          }} required />
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <label>Notes</label>
          <textarea rows={3} value={form.notes} onChange={e=>setForm(s=>({ ...s, notes:e.target.value }))} placeholder="Optional"></textarea>
        </div>
        <div style={{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:12 }}>
          <button type="button" onClick={getLocation}>Use my location</button>
          <span style={{ color:'#555' }}>{geoStatus}</span>
          {geo.lat && geo.lng && (
            <span style={{ fontSize:12, color:'#2563eb' }}>Lat: {geo.lat.toFixed(5)}, Lng: {geo.lng.toFixed(5)}</span>
          )}
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <button className="btn" type="submit">Submit Request</button>
        </div>
      </form>

      <div style={{ marginTop:16, overflowX:'auto' }}>
        <h3>My Requests</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="dashboard-table" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Volume (Kg)</th>
                <th>DRC%</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Requested</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id}>
                  <td>{r.status}</td>
                  <td>{r.totalVolumeKg ?? '-'}</td>
                  <td>{r.drcPct ?? '-'}</td>
                  <td>{r.marketRate ?? '-'}</td>
                  <td>{r.amount ?? '-'}</td>
                  <td>{safeDate(r.requestedAt || r.createdAt)}</td>
                  <td>
                    {r.invoicePdfUrl && r.status === 'VERIFIED' ? (
                      <a href={r.invoicePdfUrl} target="_blank" rel="noreferrer">Download</a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && !loading && (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#6b7280' }}>No requests yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserSellRequests;
