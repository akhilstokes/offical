import React, { useEffect, useState } from 'react';
import { useConfirm } from '../../components/common/ConfirmDialog';
import LeaveHistoryModal from '../../components/common/LeaveHistoryModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const AccountantLeave = () => {
  const confirm = useConfirm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ from: '', to: '', type: 'casual', dayType: 'full', reason: '' });
  const todayStr = new Date().toISOString().slice(0,10);
  const [validation, setValidation] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const safeDate = (d) => {
    if (!d) return '-';
    try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString(); } catch { return '-'; }
  };
  const safeText = (v) => {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'object') return v.name || v.email || '-';
    return String(v);
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/leave/my-leaves`, { headers: authHeaders() });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 404) {
          setError('Leave history is not available yet.');
          setList([]);
          return;
        }
        if (res.status === 500) {
          setError('Unable to load leaves right now (server error). Please try again later.');
          setList([]);
          return;
        }
        throw new Error(`Failed to load (${res.status}) ${text.slice(0,80)}`);
      }
      const data = await res.json();
      const list = Array.isArray(data?.leaves) ? data.leaves : (Array.isArray(data) ? data : []);
      setList(list);
    } catch (e) {
      const raw = (e?.message || 'Failed to load leaves').replace(/<[^>]*>/g, '');
      const msg = /\(500\)/.test(raw) ? 'Unable to load leaves right now (server error). Please try again later.' : raw;
      setError(msg);
      setList([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const apply = async (e) => {
    e.preventDefault();
    const ok = await confirm('Apply Leave', 'Submit this leave request?');
    if (!ok) return;
    try {
      // Client-side validation to avoid common 400s
      const { from, to, type, dayType, reason } = form;
      if (!from || !to) { setError('Please select both From and To dates.'); return; }
      const start = new Date(from);
      const end = new Date(to);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) { setValidation(prev=>({ ...prev, from: 'Invalid date', to: 'Invalid date' })); return; }
      const today = new Date(); today.setHours(0,0,0,0);
      if (start < today) { setValidation(prev=>({ ...prev, from: 'Start date cannot be in the past' })); return; }
      if (end < today) { setValidation(prev=>({ ...prev, to: 'End date cannot be in the past' })); return; }
      if (end < start) { setValidation(prev=>({ ...prev, to: 'End date cannot be earlier than start date' })); return; }
      if (dayType === 'half' && start.toDateString() !== end.toDateString()) { setValidation(prev=>({ ...prev, to: 'Half day leave must be a single day' })); return; }

      const payload = { startDate: from, endDate: to, leaveType: type, dayType, reason };
      const res = await fetch(`${API}/api/leave/apply`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 404) { setError('Leave application is not available yet.'); return; }
        if (res.status === 500) { setError('Unable to submit leave right now (server error). Please try again later.'); return; }
        throw new Error(`Apply failed (${res.status}) ${text.slice(0,80)}`);
      }
      setForm({ from: '', to: '', type: 'casual', dayType: 'full', reason: '' });
      await load();
    } catch (e) { setError((e?.message || 'Failed to apply').replace(/<[^>]*>/g, '')); }
  };

  return (
    <div style={{ padding: '40px 60px', minWidth: '1000px' }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px'
      }}>
        <div>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#0f172a' 
          }}>Leave Management</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            Apply for leave and track your requests
          </p>
        </div>
        <button 
          onClick={() => setShowHistoryModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#e2e8f0';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#f8fafc';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          View History
        </button>
      </div>

      {error && (
        <div style={{ 
          color: '#dc2626', 
          backgroundColor: '#fee2e2', 
          padding: '14px 20px', 
          borderRadius: '8px', 
          marginBottom: '30px',
          border: '1px solid #fecaca',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Leave Application Form */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '40px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#0f172a' 
        }}>Apply for Leave</h3>
        
        <form onSubmit={apply} style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr 1fr', 
          gap: '24px'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151' 
            }}>From Date</label>
            <input
              type="date"
              value={form.from}
              min={todayStr}
              onChange={e=>{
                const nextFrom = e.target.value;
                setForm(prev=>{
                  let nextTo = prev.to;
                  if (nextFrom && nextTo && new Date(nextTo) < new Date(nextFrom)) {
                    nextTo = nextFrom;
                  }
                  return { ...prev, from: nextFrom, to: nextTo };
                });
              }}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {validation.from && <div style={{ color:'#dc2626', fontSize:12, marginTop: 6 }}>{validation.from}</div>}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151' 
            }}>To Date</label>
            <input
              type="date"
              value={form.to}
              min={form.from || todayStr}
              onChange={e=>setForm(prev=>({...prev, to:e.target.value}))}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {validation.to && <div style={{ color:'#dc2626', fontSize:12, marginTop: 6 }}>{validation.to}</div>}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151' 
            }}>Leave Type</label>
            <select 
              value={form.type} 
              onChange={e=>setForm(prev=>({...prev, type:e.target.value}))}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
            </select>
            {validation.type && <div style={{ color:'#dc2626', fontSize:12, marginTop: 6 }}>{validation.type}</div>}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151' 
            }}>Day Type</label>
            <select 
              value={form.dayType} 
              onChange={e=>setForm(prev=>({...prev, dayType:e.target.value}))}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="full">Full Day</option>
              <option value="half">Half Day</option>
            </select>
            {validation.dayType && <div style={{ color:'#dc2626', fontSize:12, marginTop: 6 }}>{validation.dayType}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151' 
            }}>Reason</label>
            <input 
              value={form.reason} 
              onChange={e=>setForm(prev=>({...prev, reason:e.target.value}))} 
              required 
              placeholder="Enter reason for leave"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {validation.reason && <div style={{ color:'#dc2626', fontSize:12, marginTop: 6 }}>{validation.reason}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
            <button 
              type="submit"
              style={{
                padding: '12px 32px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 6px rgba(59,130,246,0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Submit Leave Application
            </button>
          </div>
        </form>
      </div>

      {/* Leave Requests Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#0f172a' 
        }}>My Leave Requests</h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <th style={{ 
                padding: '14px 16px', 
                textAlign: 'left', 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#374151', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>From Date</th>
              <th style={{ 
                padding: '14px 16px', 
                textAlign: 'left', 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#374151', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>To Date</th>
              <th style={{ 
                padding: '14px 16px', 
                textAlign: 'left', 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#374151', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Leave Type</th>
              <th style={{ 
                padding: '14px 16px', 
                textAlign: 'left', 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#374151', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Day Type</th>
              <th style={{ 
                padding: '14px 16px', 
                textAlign: 'left', 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#374151', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Status</th>
              <th style={{ 
                padding: '14px 16px', 
                textAlign: 'left', 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#374151', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Applied Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l,idx)=> (
              <tr key={l._id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b' }}>{safeDate(l.startDate)}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b' }}>{safeDate(l.endDate)}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b', textTransform: 'capitalize' }}>{safeText(l.leaveType || l.type)}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b', textTransform: 'capitalize' }}>{safeText(l.dayType || 'full')}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: l.status === 'approved' ? '#d1fae5' : l.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                    color: l.status === 'approved' ? '#065f46' : l.status === 'rejected' ? '#991b1b' : '#92400e',
                    textTransform: 'capitalize'
                  }}>
                    {safeText(l.status)}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {l.appliedAt ? new Date(l.appliedAt).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
            {list.length===0 && !loading && (
              <tr>
                <td colSpan={6} style={{ 
                  textAlign: 'center', 
                  color: '#9ca3af', 
                  padding: '50px 20px',
                  fontSize: '15px'
                }}>
                  No leave requests yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Leave History Modal */}
      <LeaveHistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
      />
    </div>
  );
};

export default AccountantLeave;
