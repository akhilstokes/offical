import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const ManagerBarrelRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [requestedIds, setRequestedIds] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('barrelRequestsToAdmin');
    return saved ? JSON.parse(saved) : [];
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/requests/barrels/manager/all`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load requests (${res.status})`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load barrel requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    try {
      const res = await fetch(`${API}/api/requests/barrels/${id}/approve`, {
        method: 'PUT',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error(`Failed to approve (${res.status})`);
      setSuccess(`Request approved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to approve request');
    }
  };

  const reject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):');
    try {
      const res = await fetch(`${API}/api/requests/barrels/${id}/reject`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ reason: reason || 'Rejected by manager' })
      });
      if (!res.ok) throw new Error(`Failed to reject (${res.status})`);
      setSuccess(`Request rejected.`);
      setTimeout(() => setSuccess(''), 3000);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to reject request');
    }
  };

  const requestBarrelsFromAdmin = async (barrelRequestId, quantity, userName, userEmail) => {
    try {
      const res = await fetch(`${API}/api/barrel-creation-requests`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          userBarrelRequestId: barrelRequestId,
          quantity,
          notes: `Request to create ${quantity} barrel(s) for ${userName || userEmail || 'user'}`
        })
      });
      if (!res.ok) throw new Error(`Failed to request barrels (${res.status})`);
      setSuccess(`Barrel creation request sent to Admin! (${quantity} barrels)`);
      setTimeout(() => setSuccess(''), 4000);
      // Mark this request as sent to admin and save to localStorage
      setRequestedIds(prev => {
        const updated = [...prev, barrelRequestId];
        localStorage.setItem('barrelRequestsToAdmin', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      setError(e?.message || 'Failed to send request to admin');
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status?.toLowerCase() === filter;
  });

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
          Barrel Requests
        </h2>
        <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
          View and manage barrel requests from users
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #fecaca',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          background: '#d1fae5',
          color: '#065f46',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #a7f3d0',
          fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      {/* Filter Buttons */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className={filter === 'pending' ? 'btn' : 'btn-secondary'}
          onClick={() => setFilter('pending')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: filter === 'pending' ? '#f59e0b' : '#f3f4f6',
            color: filter === 'pending' ? 'white' : '#6b7280'
          }}
        >
          Pending ({requests.filter(r => r.status?.toLowerCase() === 'pending').length})
        </button>
        <button
          className={filter === 'approved' ? 'btn' : 'btn-secondary'}
          onClick={() => setFilter('approved')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: filter === 'approved' ? '#10b981' : '#f3f4f6',
            color: filter === 'approved' ? 'white' : '#6b7280'
          }}
        >
          Approved ({requests.filter(r => r.status?.toLowerCase() === 'approved').length})
        </button>
        <button
          className={filter === 'rejected' ? 'btn' : 'btn-secondary'}
          onClick={() => setFilter('rejected')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: filter === 'rejected' ? '#ef4444' : '#f3f4f6',
            color: filter === 'rejected' ? 'white' : '#6b7280'
          }}
        >
          Rejected ({requests.filter(r => r.status?.toLowerCase() === 'rejected').length})
        </button>
        <button
          className={filter === 'all' ? 'btn' : 'btn-secondary'}
          onClick={() => setFilter('all')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: filter === 'all' ? '#3b82f6' : '#f3f4f6',
            color: filter === 'all' ? 'white' : '#6b7280'
          }}
        >
          All ({requests.length})
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#64748b',
          fontSize: '16px'
        }}>
          Loading barrel requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#94a3b8',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No {filter !== 'all' ? filter : ''} barrel requests found
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            {filter === 'pending' ? 'All requests have been processed' : 'Check back later for new requests'}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Requested On</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '20px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                      {r.user?.name || r.user?.email || 'Unknown User'}
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span style={{
                        fontWeight: '700',
                        fontSize: '20px',
                        color: '#3b82f6',
                        background: '#eff6ff',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        display: 'inline-block'
                      }}>
                        {r.quantity || 1}
                      </span>
                    </td>
                    <td style={{ padding: '20px', fontSize: '14px', color: '#64748b', maxWidth: '250px' }}>
                      {r.notes || '-'}
                    </td>
                    <td style={{ padding: '20px', fontSize: '14px', color: '#64748b' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}<br />
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : ''}
                      </span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span
                        className={`badge status-${r.status?.toLowerCase() || 'pending'}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'inline-block',
                          backgroundColor:
                            r.status?.toLowerCase() === 'approved' ? '#d1fae5' :
                              r.status?.toLowerCase() === 'rejected' ? '#fee2e2' :
                                '#fef3c7',
                          color:
                            r.status?.toLowerCase() === 'approved' ? '#065f46' :
                              r.status?.toLowerCase() === 'rejected' ? '#991b1b' :
                                '#92400e'
                        }}
                      >
                        {r.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      {r.status?.toLowerCase() === 'pending' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            className="btn"
                            style={{
                              background: '#10b981',
                              color: 'white',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => approve(r._id)}
                            onMouseOver={(e) => e.target.style.background = '#059669'}
                            onMouseOut={(e) => e.target.style.background = '#10b981'}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn-secondary"
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => reject(r._id)}
                            onMouseOver={(e) => e.target.style.background = '#dc2626'}
                            onMouseOut={(e) => e.target.style.background = '#ef4444'}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                      {r.status?.toLowerCase() === 'approved' && (
                        requestedIds.includes(r._id) ? (
                          <button
                            className="btn"
                            style={{
                              background: '#d1fae5',
                              color: '#065f46',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: '1px solid #a7f3d0',
                              borderRadius: '6px',
                              cursor: 'not-allowed'
                            }}
                            disabled
                            title="Already requested from Admin"
                          >
                            ✓ Requested from Admin
                          </button>
                        ) : (
                          <button
                            className="btn"
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => requestBarrelsFromAdmin(r._id, r.quantity, r.user?.name, r.user?.email)}
                            title="Request Admin to create barrels"
                            onMouseOver={(e) => e.target.style.background = '#2563eb'}
                            onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                          >
                            📦 Request Barrels from Admin
                          </button>
                        )
                      )}
                      {r.status?.toLowerCase() === 'rejected' && (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBarrelRequests;

