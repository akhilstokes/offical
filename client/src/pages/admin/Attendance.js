import React, { useEffect, useMemo, useState } from 'react';
import { adminMarkAttendance, listAttendance } from '../../services/adminService';

const iso = (d) => new Date(d).toISOString().slice(0, 10);

const Attendance = () => {
  const today = useMemo(() => iso(new Date()), []);
  const weekAgo = useMemo(() => iso(new Date(Date.now() - 6 * 24 * 3600 * 1000)), []);

  const [filters, setFilters] = useState({ from: weekAgo, to: today, staffId: '' });
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  // Admin mark modal state
  const [showMark, setShowMark] = useState(false);
  const [markForm, setMarkForm] = useState({ staffId: '', date: today, checkInAt: '', checkOutAt: '', isLate: false });

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const data = await listAttendance(filters);
      setRows(Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []));
    } catch (e) { setError(e?.response?.data?.message || e?.message || 'Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSearch = (e) => { e.preventDefault(); fetchData(); };

  const openMark = (staffId = '') => {
    setMarkForm({ staffId, date: today, checkInAt: '09:00', checkOutAt: '17:00', isLate: false });
    setShowMark(true);
  };

  const submitMark = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (!markForm.staffId || !markForm.date) throw new Error('staffId and date required');
      // Convert HH:mm to ISO datetime on that date
      const toISO = (hhmm) => hhmm ? new Date(`${markForm.date}T${hhmm}:00`).toISOString() : undefined;
      await adminMarkAttendance({
        staffId: markForm.staffId,
        date: markForm.date,
        checkInAt: toISO(markForm.checkInAt),
        checkOutAt: toISO(markForm.checkOutAt),
        isLate: !!markForm.isLate,
      });
      setShowMark(false);
      fetchData();
    } catch (e2) { setError(e2?.response?.data?.message || e2?.message || 'Failed to mark'); }
  };

  return (
    <div>
      <h2>Attendance</h2>

      <form onSubmit={onSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '14px', fontWeight: '500', color: '#374151' }}>From</label>
          <input 
            type="date" 
            name="from" 
            value={filters.from} 
            onChange={onChange} 
            required 
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '14px', fontWeight: '500', color: '#374151' }}>To</label>
          <input 
            type="date" 
            name="to" 
            value={filters.to} 
            onChange={onChange} 
            required 
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '14px', fontWeight: '500', color: '#374151' }}>Staff ID</label>
          <input 
            type="text" 
            name="staffId" 
            value={filters.staffId} 
            onChange={onChange} 
            placeholder="Optional" 
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '8px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#3b82f6')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            Search
          </button>
          <button 
            type="button" 
            onClick={() => openMark('')} 
            title="Admin mark override"
            style={{
              padding: '8px 24px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#7c3aed'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#8b5cf6'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Admin Mark
          </button>
        </div>
      </form>

      {error && <div style={{ color: 'tomato' }}>{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Staff</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Late</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.staffId || r.staff?._id || r.staff}-${r.date}`}>
                  <td>{r.staffName || r.staff?.name || r.staff?.email || String(r.staff || '-')}</td>
                  <td>{iso(r.date)}</td>
                  <td>{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : '-'}</td>
                  <td>{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : '-'}</td>
                  <td>{r.isLate ? 'Yes' : 'No'}</td>
                  <td>
                    <button type="button" onClick={() => openMark(r.staffId || r.staff?._id || '')}>Override</button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 12 }}>No records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showMark && (
        <div style={{ 
          marginTop: 16, 
          border: '1px solid #e5e7eb', 
          padding: 20, 
          borderRadius: 8,
          backgroundColor: '#f9fafb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#111827', fontSize: '18px', fontWeight: '600' }}>Admin Mark Attendance</h3>
          <form onSubmit={submitMark} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '14px', fontWeight: '500', color: '#374151' }}>Staff ID</label>
              <input 
                value={markForm.staffId} 
                onChange={(e) => setMarkForm(s => ({ ...s, staffId: e.target.value }))} 
                required 
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '14px', fontWeight: '500', color: '#374151' }}>Date</label>
              <input 
                type="date" 
                value={markForm.date} 
                onChange={(e) => setMarkForm(s => ({ ...s, date: e.target.value }))} 
                required 
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '14px', fontWeight: '500', color: '#374151' }}>Check-in</label>
              <input 
                type="time" 
                value={markForm.checkInAt} 
                onChange={(e) => setMarkForm(s => ({ ...s, checkInAt: e.target.value }))} 
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '14px', fontWeight: '500', color: '#374151' }}>Check-out</label>
              <input 
                type="time" 
                value={markForm.checkOutAt} 
                onChange={(e) => setMarkForm(s => ({ ...s, checkOutAt: e.target.value }))} 
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
              <input 
                type="checkbox" 
                id="isLate"
                checked={!!markForm.isLate} 
                onChange={(e) => setMarkForm(s => ({ ...s, isLate: e.target.checked }))} 
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="isLate" style={{ fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>Late?</label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button 
                type="submit"
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                Save
              </button>
              <button 
                type="button" 
                onClick={() => setShowMark(false)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Attendance;
