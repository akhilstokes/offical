import React, { useCallback, useEffect, useState } from 'react';
import LeaveHistoryModal from '../../components/common/LeaveHistoryModal';

const LabLeave = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const [form, setForm] = useState({ leaveType: 'casual', dayType: 'full', startDate: '', endDate: '', reason: '' });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${base}/api/leave/my-leaves`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data)
              ? data
              : [];
        setLeaves(list);
      } else {
        setLeaves([]);
      }
    } finally {
      setLoading(false);
    }
  }, [base, token]);

  useEffect(() => { load(); }, [load]);

  const validateDates = () => {
    const errors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!form.startDate) {
      errors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(form.startDate);
      if (startDate < today) errors.startDate = 'Start date cannot be in the past';
      const maxFuture = new Date(); maxFuture.setFullYear(maxFuture.getFullYear() + 2);
      if (startDate > maxFuture) errors.startDate = 'Start date too far in future';
    }

    if (!form.endDate) {
      errors.endDate = 'End date is required';
    } else {
      const endDate = new Date(form.endDate);
      if (endDate < today) errors.endDate = 'End date cannot be in the past';
      const maxFuture = new Date(); maxFuture.setFullYear(maxFuture.getFullYear() + 2);
      if (endDate > maxFuture) errors.endDate = 'End date too far in future';
    }

    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end < start) errors.endDate = 'End date cannot be earlier than start date';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const apply = async (e) => {
    e.preventDefault();
    setError(''); setValidationErrors({});
    if (!validateDates()) return;
    try {
      setSaving(true);
      const res = await fetch(`${base}/api/leave/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ leaveType: 'casual', dayType: 'full', startDate: '', endDate: '', reason: '' });
        await load();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to apply leave');
      }
    } catch (err) {
      setError('Failed to apply leave. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id) => {
    await fetch(`${base}/api/leave/cancel/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await load();
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Lab Leave Management</h2>
        <button
          className="btn btn-outline-primary"
          onClick={() => setShowHistoryModal(true)}
          style={{
            width: 'auto',
            maxWidth: '220px',
            padding: '6px 14px',
            fontSize: '13px',
            whiteSpace: 'nowrap'
          }}
        >
          📋 View Leave History
        </button>
      </div>
      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
      <form onSubmit={apply} style={{ maxWidth: 640, marginTop: 12 }}>
        <div className="form-row" style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Leave Type</label>
            <select className="form-control" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="earned">Earned</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>Day Type</label>
            <select className="form-control" value={form.dayType} onChange={(e) => setForm({ ...form, dayType: e.target.value })}>
              <option value="full">Full Day</option>
              <option value="half">Half Day</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>Start Date *</label>
            <input type="date" className="form-control" value={form.startDate} min={minDate} max={maxDateStr}
              onChange={(e) => {
                const startDate = e.target.value;
                setForm((prev) => {
                  let endDate = prev.endDate;
                  if (endDate && startDate && new Date(endDate) < new Date(startDate)) endDate = startDate;
                  return { ...prev, startDate, endDate };
                });
                if (validationErrors.startDate) setValidationErrors(prev => ({ ...prev, startDate: '' }));
              }}
              style={{ borderColor: validationErrors.startDate ? '#dc3545' : '' }}
            />
            {validationErrors.startDate && <div style={{ color: '#dc3545', fontSize: 12 }}>{validationErrors.startDate}</div>}
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>End Date *</label>
            <input type="date" className="form-control" value={form.endDate} min={form.startDate || minDate} max={maxDateStr}
              onChange={(e) => { setForm((prev) => ({ ...prev, endDate: e.target.value })); if (validationErrors.endDate) setValidationErrors(prev => ({ ...prev, endDate: '' })); }}
              style={{ borderColor: validationErrors.endDate ? '#dc3545' : '' }}
            />
            {validationErrors.endDate && <div style={{ color: '#dc3545', fontSize: 12 }}>{validationErrors.endDate}</div>}
          </div>
        </div>
        <div className="form-group">
          <label>Reason</label>
          <textarea className="form-control" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Apply'}</button>
      </form>

      <div style={{ marginTop: 24 }}>
        <h4>My Leave Requests</h4>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Day Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(leaves) ? leaves : []).map(l => (
                <tr key={l._id}>
                  <td>{l.leaveType}</td>
                  <td>{l.startDate ? new Date(l.startDate).toLocaleDateString() : '-'}</td>
                  <td>{l.endDate ? new Date(l.endDate).toLocaleDateString() : '-'}</td>
                  <td>{l.dayType || 'full'}</td>
                  <td>{l.status}</td>
                  <td>
                    {l.status === 'pending' && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(l._id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
              {Array.isArray(leaves) && leaves.length === 0 && <tr><td colSpan={5}>No leave requests</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Leave History Modal */}
      <LeaveHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
};

export default LabLeave;