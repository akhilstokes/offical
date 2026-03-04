import React, { useEffect, useState } from 'react';
import { useConfirm } from '../../components/common/ConfirmDialog';
import LeaveHistoryModal from '../../components/common/LeaveHistoryModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const DeliveryLeave = () => {
  const confirm = useConfirm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ from: '', to: '', type: 'casual', dayType: 'full', reason: '' });
  const [validation, setValidation] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Min/Max date boundaries (UI constraint)
  const todayStr = new Date().toISOString().split('T')[0];
  const max = new Date();
  max.setFullYear(max.getFullYear() + 2);
  const maxDateStr = max.toISOString().split('T')[0];

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
        throw new Error(`Failed to load (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data?.leaves) ? data.leaves : (Array.isArray(data) ? data : []);
      setList(list);
    } catch (e) { setError((e?.message || 'Failed to load leaves').replace(/<[^>]*>/g, '')); setList([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const apply = async (e) => {
    e.preventDefault();
    const ok = await confirm('Apply Leave', 'Submit this leave request?');
    if (!ok) return;
    try {
      // Validate form before submit
      setValidation({});
      const { from, to, type, dayType, reason } = form;
      const v = {};
      if (!from) v.from = 'From date is required';
      if (!to) v.to = 'To date is required';
      if (!reason || !reason.trim()) v.reason = 'Reason is required';
      if (!type) v.type = 'Type is required';
      if (!dayType || !['full','half'].includes(dayType)) v.dayType = 'Select Full day or Half day';
      if (Object.keys(v).length) { setValidation(v); return; }

      const start = new Date(from);
      const end = new Date(to);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) { setValidation(prev=>({ ...prev, from: 'Invalid date', to: 'Invalid date' })); return; }
      const today = new Date(); today.setHours(0,0,0,0);
      if (start < today) { setValidation(prev=>({ ...prev, from: 'Start date cannot be in the past' })); return; }
      if (end < today) { setValidation(prev=>({ ...prev, to: 'End date cannot be in the past' })); return; }
      if (end < start) { setValidation(prev=>({ ...prev, to: 'End date cannot be earlier than start date' })); return; }
      if (dayType === 'half' && start.toDateString() !== end.toDateString()) {
        setValidation(prev=>({ ...prev, to: 'Half day leave must be a single day' }));
        return;
      }

      const payload = {
        startDate: from,
        endDate: to,
        leaveType: type,
        reason,
        dayType
      };
      const res = await fetch(`${API}/api/leave/apply`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) {

        const text = await res.text();
        if (res.status === 404) { setError('Leave application is not available yet.'); return; }
        if (res.status === 500) { setError('Unable to submit leave right now (server error). Please try again later.'); return; }
        throw new Error(`Apply failed (${res.status}) ${text.slice(0,80)}`);

        if (res.status === 404) { setError('Leave application is not available yet.'); return; }
        if (res.status === 500) { setError('Unable to submit leave right now (server error). Please try again later.'); return; }
        throw new Error(`Apply failed (${res.status})`);

      }
      setForm({ from: '', to: '', type: 'casual', dayType: 'full', reason: '' });
      await load();
    } catch (e) { setError((e?.message || 'Failed to apply').replace(/<[^>]*>/g, '')); }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Leave</h2>
        <button 
          className="btn btn-outline-primary"
          onClick={() => setShowHistoryModal(true)}
          style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap', minWidth: 'auto' }}
        >
          📋 History
        </button>
      </div>
      {error && <div style={{ color:'tomato', marginBottom:8 }}>{error}</div>}
      <form onSubmit={apply} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, maxWidth:720 }}>
        <div>
          <label>From</label>
          <input
            type="date"
            value={form.from}
            min={todayStr}
            max={maxDateStr}
            onChange={e=>{
              const from = e.target.value;
              setForm(prev=>{
                let next = { ...prev, from };
                // If existing 'to' became invalid, align it to from
                if (next.to && new Date(next.to) < new Date(from)) {
                  next.to = from;
                }
                // If half day, force same day
                if (next.dayType === 'half' && from) {
                  next.to = from;
                }
                return next;
              });
              if (validation.from) setValidation(prev=>({ ...prev, from: '' }));
              if (validation.to) setValidation(prev=>({ ...prev, to: '' }));
            }}
            required
          />
          {validation.from && <div style={{ color:'tomato', fontSize:12 }}>{validation.from}</div>}
        </div>
        <div>
          <label>To</label>
          <input
            type="date"
            value={form.to}
            min={form.from || todayStr}
            max={maxDateStr}
            onChange={e=>{
              const to = e.target.value;
              setForm(prev=>({ ...prev, to }));
              if (validation.to) setValidation(prev=>({ ...prev, to: '' }));
            }}
            required
          />
          {validation.to && <div style={{ color:'tomato', fontSize:12 }}>{validation.to}</div>}
        </div>
        <div>
          <label>Type</label>
          <select value={form.type} onChange={e=>setForm(prev=>({...prev, type:e.target.value}))}>
            <option value="casual">Casual</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
          </select>
          {validation.type && <div style={{ color:'tomato', fontSize:12 }}>{validation.type}</div>}
        </div>
        <div>
          <label>Day Type</label>
          <select value={form.dayType} onChange={e=>setForm(prev=>({...prev, dayType:e.target.value}))}>
            <option value="full">Full Day</option>
            <option value="half">Half Day</option>
          </select>
          {validation.dayType && <div style={{ color:'tomato', fontSize:12 }}>{validation.dayType}</div>}
        </div>
        <div>
          <label>Reason</label>
          <input value={form.reason} onChange={e=>setForm(prev=>({...prev, reason:e.target.value}))} required />
          {validation.reason && <div style={{ color:'tomato', fontSize:12 }}>{validation.reason}</div>}
        </div>
        <div style={{ gridColumn:'1 / -1' }}>
          <button className="btn" type="submit">Apply</button>
        </div>
      </form>

      <div style={{ marginTop:16, overflowX:'auto' }}>
        <table className="dashboard-table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Type</th>
              <th>Day</th>
              <th>Status</th>
              <th>Applied</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l,idx)=> (
              <tr key={l._id || idx}>
                <td>{safeDate(l.startDate)}</td>
                <td>{safeDate(l.endDate)}</td>
                <td>{safeText(l.leaveType || l.type)}</td>
                <td style={{ textTransform:'capitalize' }}>{safeText(l.dayType || 'full')}</td>
                <td>{safeText(l.status)}</td>
                <td>{l?.appliedAt ? new Date(l.appliedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
            {list.length===0 && !loading && (
              <tr><td colSpan={6} style={{ textAlign:'center', color:'#6b7280' }}>No leave requests.</td></tr>
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

export default DeliveryLeave;
