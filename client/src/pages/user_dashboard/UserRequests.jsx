import React, { useEffect, useState } from 'react';
import { createRequest, getRequests } from '../../services/customerService';

const initialBarrel = { type: 'BARREL', quantity: 1, notes: '' };
const initialComplaint = { type: 'COMPLAINT', subject: '', category: 'other', description: '' };

const UserRequests = () => {
  const [tab, setTab] = useState('BARREL');
  const [barrel, setBarrel] = useState(initialBarrel);
  const [complaint, setComplaint] = useState(initialComplaint);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [showAddressWarning, setShowAddressWarning] = useState(false);

  const checkUserAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/users/profile`, { headers });
      if (res.ok) {
        const data = await res.json();
        const address = data.address || '';
        setUserAddress(address);
        if (!address || address.trim() === '') {
          setShowAddressWarning(true);
        }
      }
    } catch (e) {
      console.error('Error checking user address:', e);
    }
  };

  const load = async () => {
    setLoading(true);
    try { setItems(await getRequests()); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    load(); 
    checkUserAddress();
  }, []);

  const submitBarrel = async () => {
    // Check if user has address before allowing request
    if (!userAddress || userAddress.trim() === '') {
      setErr('Please complete your address in your profile before requesting barrels. Delivery staff need your address for barrel delivery.');
      setShowAddressWarning(true);
      return;
    }

    setSubmitting(true); setErr('');
    try {
      const qty = Number(barrel.quantity) || 1;
      if (qty < 1 || qty > 50) {
        setErr('Quantity must be between 1 and 50 barrels');
        setSubmitting(false);
        return;
      }
      await createRequest({ type: 'BARREL', quantity: qty, notes: barrel.notes, address: userAddress });
      setBarrel(initialBarrel);
      await load();
    } catch (e) { setErr('Failed to submit request'); }
    finally { setSubmitting(false); }
  };

  const submitComplaint = async () => {
    setSubmitting(true); setErr('');
    try {
      await createRequest({ type: 'COMPLAINT', subject: complaint.subject, category: complaint.category, description: complaint.description });
      setComplaint(initialComplaint);
      await load();
    } catch (e) { setErr('Failed to submit complaint'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="user-dashboard">
      <div className="userdash-header">
        <div className="userdash-title">
          <h2>Requests & Complaints</h2>
          <p>Submit barrel requests or log complaints about our service.</p>
        </div>
      </div>

      <div className="userdash-content-grid">
        {/* Left Column: Form */}
        <div className="userdash-main-col">
          <div className="tabs">
            <button className={tab === 'BARREL' ? 'active' : ''} onClick={() => setTab('BARREL')}>Request Barrels</button>
            <button className={tab === 'COMPLAINT' ? 'active' : ''} onClick={() => setTab('COMPLAINT')}>Complaint</button>
          </div>

          <div className="dash-card" style={{ padding: '32px' }}>
            <div className="card-header">
              <h3>
                <i className={tab === 'BARREL' ? 'fas fa-drum' : 'fas fa-exclamation-circle'}></i>
                {tab === 'BARREL' ? 'Barrel Request Form' : 'Complaint Form'}
              </h3>
            </div>

            {err && (
              <div className="alert error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{err}</span>
              </div>
            )}

            {showAddressWarning && (!userAddress || userAddress.trim() === '') && (
              <div className="alert" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', marginBottom: '20px' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.2rem' }}></i>
                <div>
                  <strong>Address Required</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                    Delivery staff need your address for barrel delivery. 
                    <a href="/user/profile" style={{ color: '#92400e', textDecoration: 'underline', marginLeft: '8px', fontWeight: '700' }}>
                      Profile →
                    </a>
                  </p>
                </div>
              </div>
            )}

            {tab === 'BARREL' ? (
              <>
                <label>
                  Quantity (Max: 50 barrels)
                  <input type="number" min={1} max={50} step={1} value={barrel.quantity} onChange={e => setBarrel({ ...barrel, quantity: e.target.value })} placeholder="Enter quantity" />
                </label>
                <label>
                  Notes (optional)
                  <textarea value={barrel.notes} onChange={e => setBarrel({ ...barrel, notes: e.target.value })} placeholder="Any specific instructions for delivery?" style={{ minHeight: '100px' }} />
                </label>
                <button className="btn" onClick={submitBarrel} disabled={submitting} style={{ width: '100%', marginTop: '8px' }}>
                  {submitting ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Request</>}
                </button>
              </>
            ) : (
              <>
                <label>
                  Subject
                  <input type="text" value={complaint.subject} onChange={e => setComplaint({ ...complaint, subject: e.target.value })} placeholder="Brief summary" />
                </label>
                <label>
                  Category
                  <select value={complaint.category} onChange={e => setComplaint({ ...complaint, category: e.target.value })}>
                    <option value="pickup">Pickup Delay</option>
                    <option value="billing">Billing Discrepancy</option>
                    <option value="barrel">Barrel Damage</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  Description
                  <textarea rows={4} value={complaint.description} onChange={e => setComplaint({ ...complaint, description: e.target.value })} placeholder="Tell us more about the issue..." />
                </label>
                <button className="btn" onClick={submitComplaint} disabled={submitting} style={{ width: '100%', marginTop: '8px' }}>
                  {submitting ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit Complaint</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Activity History */}
        <div className="userdash-side-col">
          <div className="dash-card">
            <div className="card-header">
              <h3><i className="fas fa-history"></i> My Recent Activity</h3>
            </div>
            
            {loading ? (
              <div className="no-data"><i className="fas fa-spinner fa-spin"></i> Loading...</div>
            ) : items.length === 0 ? (
              <div className="no-data" style={{ padding: '60px 20px' }}>
                <i className="fas fa-inbox" style={{ fontSize: '2.5rem', color: '#e2e8f0', marginBottom: '16px', display: 'block' }}></i>
                <span>No requests or complaints found</span>
              </div>
            ) : (
              <div className="table-wrap" style={{ borderRadius: '0' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => {
                      const statusClass = (r.status || 'pending').toLowerCase().replace(/\s+/g, '-');
                      return (
                        <tr key={r.id || r._id}>
                          <td style={{ fontWeight: '600', color: '#64748b', fontSize: '0.8rem' }}>
                            {new Date(r.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td>
                            <span style={{ fontWeight: '700', fontSize: '0.8rem', color: r.type === 'BARREL' ? '#7c3aed' : '#ec4899' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                            {r.type === 'BARREL' ? (r.notes || `${r.quantity} Barrels`) : (r.subject || r.notes || '-')}
                          </td>
                          <td><span className={`badge status-${statusClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{r.status || 'pending'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {items.length > 0 && (
              <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Showing last {items.length} records</span>
              </div>
            )}
          </div>

          <div className="dash-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: 'none' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7c3aed', fontWeight: '800' }}>Need Help?</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6d28d9', lineHeight: '1.5', fontWeight: '500' }}>
              If you have urgent requirements or issues, you can also contact our support staff directly through the profile section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRequests;
