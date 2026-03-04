import React, { useEffect, useState } from 'react';
import { inviteStaff, listStaff, resendInvite, setStaffActive, approveStaff, listStaffUsers, deleteStaffUser } from '../../services/staffService';
import jsPDF from 'jspdf';

const AdminStaff = () => {
  const [form, setForm] = useState({ email: '', phone: '', name: '', address: '', staffId: '', role: 'field', experience: '' });
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [staffUsers, setStaffUsers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [emailTaken, setEmailTaken] = useState(false);
  
  // Enhanced filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStaffIdOnly, setShowStaffIdOnly] = useState(false);
  const [viewMode, setViewMode] = useState('invites'); // 'invites' or 'records'

  // Helpers
  const noSpaces = (v) => String(v || '').replace(/\s+/g, '');
  const sanitizePhone = (v) => {
    const s = String(v || '').replace(/\s+/g, '');
    if (s.startsWith('+')) return '+' + s.slice(1).replace(/\D+/g, '');
    return s.replace(/\D+/g, '');
  };

  const load = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = await listStaff({ limit: 200 });
      const list = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : (Array.isArray(data?.records) ? data.records : []));
      setRows(list);
      const su = await listStaffUsers({ limit: 200 });
      const users = su?.users || su?.records || su?.data || [];
      setStaffUsers(users);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load staff');
    } finally { setLoading(false); }
  };

  const onApprove = async (id) => {
    setError(''); setSuccess('');
    try {
      await approveStaff(id);
      setSuccess('Staff approved.');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to approve');
    }
  };

  const toggleActive = async (id, current) => {
    setError(''); setSuccess('');
    try {
      await setStaffActive(id, !current);
      setSuccess(!current ? 'Staff activated' : 'Staff deactivated');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update status');
    }
  };

  const downloadPdf = (row) => {
    const doc = new jsPDF();
    let y = 20;
    
    doc.setFontSize(18);
    doc.setTextColor(11, 110, 79);
    doc.text('Holy Family Polymers', 20, y);
    y += 10;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Staff Registration Details', 20, y);
    y += 15;
    
    doc.setFontSize(14);
    doc.setTextColor(11, 110, 79);
    doc.text('Personal Information', 20, y);
    y += 8;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const personalInfo = [
      `Full Name: ${row.name || 'Not provided'}`,
      `Email Address: ${row.email || 'Not provided'}`,
      `Phone Number: ${row.phone || 'Not provided'}`,
      `Address: ${row.address || 'Not provided'}`,
      `Staff ID: ${row.staffId || 'Not assigned'}`,
      
      `Role: ${(row.role || 'field_staff').replace('_', ' ').toUpperCase()}`,
    ];
    
    personalInfo.forEach(line => {
      doc.text(line, 25, y);
      y += 6;
    });
    
    y += 5;
    
    doc.setFontSize(14);
    doc.setTextColor(11, 110, 79);
    doc.text('Registration Status', 20, y);
    y += 8;
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const statusInfo = [
      `Current Status: ${row.status || 'Unknown'}`,
      `Invitation Sent: ${row.createdAt ? new Date(row.createdAt).toLocaleString() : 'Not available'}`,
      `Registration Completed: ${row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : 'Not completed'}`,
      `Approved: ${row.approvedAt ? new Date(row.approvedAt).toLocaleString() : 'Not approved'}`,
    ];
    
    statusInfo.forEach(line => {
      doc.text(line, 25, y);
      y += 6;
    });
    
    y += 10;
    
    if (row.documents && row.documents.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(11, 110, 79);
      doc.text('Uploaded Documents', 20, y);
      y += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      row.documents.forEach((doc, index) => {
        doc.text(`${index + 1}. ${doc.type || 'Document'}: ${doc.filename || 'Unknown'}`, 25, y);
        y += 6;
      });
      y += 5;
    }
    
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, y);
    doc.text('Holy Family Polymers - Staff Management System', 20, y + 5);
    
    doc.save(`staff-${row.staffId || row.name || 'details'}.pdf`);
  };

  useEffect(() => { load(); }, []);

  const getFilteredStaff = () => {
    let filtered = [...rows];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(staff => 
        (staff.name || '').toLowerCase().includes(term) ||
        (staff.email || '').toLowerCase().includes(term) ||
        (staff.staffId || '').toLowerCase().includes(term) ||
        (staff.phone || '').includes(term)
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(staff => {
        const role = (staff.role || 'field_staff').toLowerCase();
        return role.includes(roleFilter);
      });
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(staff => {
        const status = staff.status || 'sent';
        return status === statusFilter;
      });
    }
    
    return filtered;
  };

  const getStaffStats = () => {
    const stats = {
      total: rows.length,
      field: rows.filter(r => (r.role || '').includes('field')).length,
      lab: rows.filter(r => (r.role || '').includes('lab')).length,
      delivery: rows.filter(r => (r.role || '').includes('delivery')).length,
      accountant: rows.filter(r => (r.role || '').includes('accountant')).length,
      manager: rows.filter(r => (r.role || '').includes('manager')).length,
      active: rows.filter(r => (r.status || '') === 'active').length,
      pending: rows.filter(r => (r.status || '') === 'verified').length,
      approved: rows.filter(r => (r.status || '') === 'approved').length
    };
    return stats;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const raw = String(phone || '').trim();
    const normalized = raw.replace(/[\s\-()]/g, '');
    const digits = normalized.startsWith('+') ? normalized.slice(1) : normalized;
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 10 || digits.length > 15) return false;
    if (digits[0] === '0') return false;
    return true;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(form.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (emailTaken) {
      errors.email = 'Email already used';
    }
    
    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(form.phone)) {
      errors.phone = 'Please enter a valid phone number (e.g., +1234567890 or 1234567890)';
    }
    
    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    
    if (!form.address.trim()) {
      errors.address = 'Address is required';
    } else if (form.address.trim().length < 10) {
      errors.address = 'Address must be at least 10 characters long';
    }
    
    const id = noSpaces((form.staffId || '').toUpperCase().trim());
    const isField = form.role === 'field';
    const isLab = form.role === 'lab';
    const isDelivery = form.role === 'delivery';
    const isAccountant = form.role === 'accountant';
    const isManager = form.role === 'manager';
    const patternField = /^HFP\d{2}$/;
    const patternAccountant = /^ACC\d{2}$/;
    const patternManager = /^MGR\d{2}$/;
    const patternDelivery = /^[A-Z]{3}-\d{4}-\d{3}$/;
    
    if (!id) {
      errors.staffId = 'Staff ID is required';
    } else if ((isField || isLab) && !patternField.test(id)) {
      errors.staffId = 'For Field/Lab Staff, use format HFP01 (5 characters)';
    } else if (isAccountant && !patternAccountant.test(id)) {
      errors.staffId = 'For Accountant, use format ACC01 (5 characters)';
    } else if (isManager && !patternManager.test(id)) {
      errors.staffId = 'For Manager, use format MGR01 (5 characters)';
    } else if (isDelivery && !patternDelivery.test(id)) {
      errors.staffId = 'For Delivery Staff, use format STF-2025-005';
    }
    
    if ((form.staffId || '').match(/\s/)) {
      errors.staffId = 'Staff ID must not contain spaces';
    }
    
    if (!['field','lab','delivery','accountant','manager'].includes(form.role)) {
      errors.role = 'Select a valid role';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onInviteSubmit = (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const onInviteConfirm = async () => {
    setError(''); setSuccess('');
    try {
      await inviteStaff({ 
        email: noSpaces(form.email.trim()), 
        phone: sanitizePhone(form.phone.trim()),
        name: form.name.trim(),
        address: form.address.trim(),
        staffId: noSpaces((form.staffId || '').toUpperCase().trim()),
        experience: form.experience ? parseInt(form.experience) : 0,
        role: (form.role === 'lab') ? 'lab_staff' 
            : (form.role === 'delivery') ? 'delivery_staff' 
            : (form.role === 'accountant') ? 'accountant' 
            : (form.role === 'manager') ? 'manager'
            : 'field_staff'
      });
      setSuccess('Invitation sent successfully.');
      setForm({ email: '', phone: '', name: '', address: '', staffId: '', role: 'field', experience: '' });
      setShowConfirmation(false);
      await load();
    } catch (e) {
      const status = e?.response?.status;
      const msg = status === 404
        ? 'Backend endpoint /api/staff/invite not found (404). Please implement this API or update the URL.'
        : (status === 409 ? 'Email already used' : (e?.response?.data?.message || e?.message || 'Failed to send invite'));
      setError(msg);
    }
  };

  const onInviteCancel = () => {
    setShowConfirmation(false);
    setValidationErrors({});
  };

  const stats = getStaffStats();
  const filteredStaff = getFilteredStaff();

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>Staff Management</h2>
          <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>View and manage all staff with their IDs</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className={`btn ${viewMode === 'records' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setViewMode('records');
              setStatusFilter('approved');
              // Scroll to staff table
              setTimeout(() => {
                const table = document.querySelector('.dashboard-table');
                if (table) {
                  table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
          >
            Staff Records
          </button>
          <button 
            className="btn btn-primary" 
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && <div style={{ color: 'tomato', marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: 'limegreen', marginTop: 8 }}>{success}</div>}

      {/* Show invitation form only when in invites mode */}
      {viewMode === 'invites' && (
        <div style={{ 
          marginTop: 24,
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>📧 Send Staff Invitation</h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>
            Fill in the staff details below to send an invitation email
          </p>
        
        <form onSubmit={onInviteSubmit} style={{ 
          display: 'grid', 
          gap: 16, 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
        }}>
          <div>
            <label>Name *</label><br />
            <input 
              type="text" 
              value={form.name} 
              onChange={(e)=>setForm({ ...form, name: e.target.value })} 
              placeholder="Full Name" 
              required 
              style={{ borderColor: validationErrors.name ? '#dc3545' : '' }}
            />
            {validationErrors.name && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{validationErrors.name}</div>}
          </div>
          
          <div>
            <label>Email *</label><br />
            <input 
              type="email" 
              value={form.email}
              onChange={(e)=>{
                const val = noSpaces(e.target.value);
                setForm({ ...form, email: val });
                const lower = val.toLowerCase();
                const inInvites = rows.some(r => (r.email || '').toLowerCase() === lower);
                const inUsers = staffUsers.some(u => (u.email || '').toLowerCase() === lower);
                setEmailTaken(inInvites || inUsers);
              }} 
              placeholder="staff@example.com" 
              required 
              style={{ borderColor: validationErrors.email ? '#dc3545' : '' }}
            />
            {validationErrors.email && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{validationErrors.email}</div>}
            {(!validationErrors.email && emailTaken) && <div style={{ color: '#d97706', fontSize: '12px', marginTop: '4px' }}>Email already used</div>}
          </div>
          
          <div>
            <label>Phone Number *</label><br />
            <input 
              type="tel" 
              inputMode="numeric"
              value={form.phone}
              onChange={(e)=>setForm({ ...form, phone: sanitizePhone(e.target.value) })} 
              placeholder="9876543210 or +919876543210" 
              required 
              style={{ borderColor: validationErrors.phone ? '#dc3545' : '' }}
              onKeyDown={(e)=>{ if (e.key === ' ') e.preventDefault(); }}
            />
            {validationErrors.phone && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{validationErrors.phone}</div>}
          </div>
          
          <div>
            <label>Role *</label><br />
            <select
              value={form.role}
              onChange={(e)=>setForm({ ...form, role: e.target.value })}
              required
              style={{ width:'100%', borderColor: validationErrors.role ? '#dc3545' : '' }}
            >
              <option value="field">Field Staff</option>
              <option value="lab">Lab Staff</option>
              <option value="delivery">Delivery Staff</option>
              <option value="accountant">Accountant</option>
              <option value="manager">Manager</option>
            </select>
            {validationErrors.role && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{validationErrors.role}</div>}
          </div>
          
          <div>
            <label>Experience (Years)</label><br />
            <input 
              type="number" 
              value={form.experience}
              onChange={(e)=>setForm({ ...form, experience: e.target.value })} 
              placeholder="e.g., 5" 
              min="0"
              max="50"
            />
          </div>
          
          <div>
            <label>Experience (Years)</label><br />
            <input 
              type="number" 
              value={form.experience}
              onChange={(e)=>setForm({ ...form, experience: e.target.value })} 
              placeholder="e.g., 5" 
              min="0"
              max="50"
            />
          </div>
          
          <div>
            <label>
              {(() => {
                if (form.role === 'delivery') return 'Staff ID (e.g., STF-2025-005) *';
                if (form.role === 'accountant') return 'Staff ID (e.g., ACC01) *';
                if (form.role === 'manager') return 'Staff ID (e.g., MGR01) *';
                return 'Staff ID (HFP01) *';
              })()}
            </label><br />
            <div style={{ display:'flex', gap:8 }}>
              <input 
                type="text"
                value={form.staffId}
                onChange={(e)=>setForm({ ...form, staffId: noSpaces(e.target.value.toUpperCase()) })}
                placeholder={form.role === 'delivery' ? 'STF-2025-005' : (form.role === 'accountant' ? 'ACC01' : (form.role === 'manager' ? 'MGR01' : 'HFP01'))}
                required
                maxLength={form.role === 'delivery' ? 13 : 5}
                style={{ flex:1, borderColor: validationErrors.staffId ? '#dc3545' : '' }}
                onKeyDown={(e)=>{ if (e.key === ' ') e.preventDefault(); }}
              />
              {form.role !== 'delivery' && (
                <button type="button" className="btn btn-outline" onClick={()=>{
                  const prefix = form.role === 'accountant' ? 'ACC' : (form.role === 'manager' ? 'MGR' : 'HFP');
                  const all = [...rows, ...staffUsers];
                  let max = 0;
                  all.forEach(u=>{
                    const sid = (u.staffId || u.staff_id || '').toString();
                    const up = sid.toUpperCase();
                    const m = up.startsWith(prefix) ? up.slice(prefix.length).match(/^(\d{2})$/) : null;
                    if (m) { const num = parseInt(m[1],10); if (!Number.isNaN(num)) max = Math.max(max, num); }
                  });
                  const next = Math.min(99, max + 1);
                  const nextId = `${prefix}${String(next).padStart(2,'0')}`;
                  setForm(f=>({ ...f, staffId: nextId }));
                }}>Generate</button>
              )}
            </div>
            {validationErrors.staffId && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{validationErrors.staffId}</div>}
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Address *</label><br />
            <textarea 
              value={form.address} 
              onChange={(e)=>setForm({ ...form, address: e.target.value })} 
              placeholder="Complete address with city, state, postal code" 
              required 
              rows={3}
              style={{ width: '100%', borderColor: validationErrors.address ? '#dc3545' : '' }}
            />
            {validationErrors.address && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{validationErrors.address}</div>}
          </div>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading || Object.keys(validationErrors).length > 0}>
              {loading ? 'Validating...' : 'Send Invitation'}
            </button>
          </div>
        </form>

        {showConfirmation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            opacity: 1
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              color: '#111',
              opacity: 1
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#0B6E4F' }}>Confirm Staff Invitation</h3>
              <p style={{ marginBottom: '16px', color: '#374151' }}>Please review the details before sending the invitation:</p>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '14px', 
                borderRadius: '6px', 
                marginBottom: '16px',
                color: '#111',
                opacity: 1,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ marginBottom: 6 }}><strong>Name:</strong> <span style={{ color: '#111' }}>{form.name}</span></div>
                <div style={{ marginBottom: 6 }}><strong>Email:</strong> <span style={{ color: '#111' }}>{form.email}</span></div>
                <div style={{ marginBottom: 6 }}><strong>Phone:</strong> <span style={{ color: '#111' }}>{form.phone}</span></div>
                <div style={{ marginBottom: 6 }}><strong>Address:</strong> <span style={{ color: '#111' }}>{form.address}</span></div>
                <div style={{ marginBottom: 6 }}><strong>Role:</strong> <span style={{ color: '#111' }}>{
                  form.role === 'lab' ? 'Lab Staff' : 
                  (form.role === 'delivery' ? 'Delivery Staff' : 
                  (form.role === 'accountant' ? 'Accountant' : 
                  (form.role === 'manager' ? 'Manager' : 'Field Staff')))
                }</span></div>
                <div><strong>Staff ID:</strong> <span style={{ color: '#111' }}>{(form.staffId || '').toUpperCase()}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={onInviteCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={onInviteConfirm}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {rows.filter(r => r.status === 'verified').length > 0 && (
        <div style={{ 
          marginTop: 24, 
          padding: '20px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '8px', 
          border: '1px solid #ffeaa7' 
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>
            🔔 Pending Staff Approvals ({rows.filter(r => r.status === 'verified').length})
          </h3>
          <p style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '14px' }}>
            The following staff members have completed their registration and are waiting for your approval:
          </p>
          <div style={{ display: 'grid', gap: '15px' }}>
            {rows.filter(r => r.status === 'verified').map(r => (
              <div key={r._id} style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                borderRadius: '6px', 
                border: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{r.name}</div>
                  <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                    📧 {r.email} • 📱 {r.phone} • 🆔 {r.staffId}
                  </div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>
                    📍 {r.address} • 👤 {(r.role || 'field_staff').replace('_', ' ').toUpperCase()}
                  </div>
                  {r.verifiedAt && (
                    <div style={{ color: '#28a745', fontSize: '12px', marginTop: '4px' }}>
                      ✅ Submitted: {new Date(r.verifiedAt).toLocaleDateString()} at {new Date(r.verifiedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-success" 
                    onClick={()=>onApprove(r._id || r.id)}
                    style={{ minWidth: '100px' }}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={()=>downloadPdf(r)}
                    title="View detailed information"
                  >
                    📄 Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 32, marginBottom: 16 }}>All Staff ({filteredStaff.length} shown)</h3>
      <div style={{ marginTop: 8, overflowX: 'auto' }}>
        <table className="dashboard-table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Staff ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(r => (
              <tr key={r._id || r.id || r.email} style={{ 
                backgroundColor: r.status === 'verified' ? '#fff3cd' : 'transparent' 
              }}>
                <td>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    backgroundColor: r.staffId ? '#e8f5e8' : '#fef2f2', 
                    padding: '6px 8px', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                    color: r.staffId ? '#16a34a' : '#dc2626',
                    border: r.staffId ? '1px solid #16a34a' : '1px solid #dc2626'
                  }}>
                    {r.staffId || 'NO ID'}
                  </div>
                  {r.staffId && (
                    <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
                      {r.staffId.length} chars
                    </div>
                  )}
                </td>
                <td>
                  <div>
                    <strong>{r.name || '-'}</strong>
                    {r.status === 'verified' && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        📍 {r.address || 'No address provided'}
                      </div>
                    )}
                  </div>
                </td>
                <td>{r.email || '-'}</td>
                <td>
                  <span style={{ 
                    textTransform: 'capitalize',
                    color: r.role === 'field_staff' ? '#0B6E4F' : 
                           r.role === 'delivery_staff' ? '#ff6b35' : 
                           r.role === 'lab_staff' ? '#6c5ce7' : 
                           r.role === 'accountant' ? '#0ea5e9' : 
                           r.role === 'manager' ? '#8b5cf6' : '#666',
                    fontWeight: '500'
                  }}>
                    {(r.role || 'field_staff').replace('_', ' ')}
                  </span>
                </td>
                <td>{r.phone || '-'}</td>
                <td>
                  {(() => {
                    const status = (r.status || (r.userId?.status));
                    const label = status === 'sent' ? 'Pending Invite' :
                                  status === 'verified' ? 'Waiting Approval' :
                                  status === 'approved' ? 'Approved' :
                                  status === 'cancelled' ? 'Rejected' :
                                  status === 'active' ? 'Active' :
                                  status === 'suspended' ? 'Deactivated' : (status || '-');
                    
                    const color = status === 'sent' ? '#ffc107' :
                                  status === 'verified' ? '#ff6b35' :
                                  status === 'approved' ? '#28a745' :
                                  status === 'cancelled' ? '#dc3545' :
                                  status === 'active' ? '#28a745' :
                                  status === 'suspended' ? '#6c757d' : '#666';
                    
                    return (
                      <span style={{ 
                        color: color, 
                        fontWeight: 'bold',
                        fontSize: '13px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: color === '#ffc107' ? '#fef3c7' :
                                        color === '#ff6b35' ? '#fed7aa' :
                                        color === '#28a745' ? '#dcfce7' :
                                        color === '#dc3545' ? '#fef2f2' :
                                        color === '#6c757d' ? '#f3f4f6' : '#f8fafc'
                      }}>
                        {label}
                      </span>
                    );
                  })()}
                  {r.status === 'verified' && r.verifiedAt && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      Submitted: {new Date(r.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.status === 'verified' && (
                      <>
                        <button 
                          className="btn btn-sm btn-success" 
                          onClick={()=>onApprove(r._id || r.id)}
                          title="Approve this staff member"
                        >
                          ✓ Approve
                        </button>
                        <button 
                          className="btn btn-sm btn-info" 
                          onClick={()=>downloadPdf(r)}
                          title="View detailed information"
                        >
                          📄 Details
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button className="btn btn-sm btn-outline" onClick={()=>toggleActive(r.userId?._id || r._id || r.id, (r.userId?.status || r.status) === 'active')}>
                        {(r.userId?.status || r.status) === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {r.status !== 'verified' && (
                      <button className="btn btn-sm" onClick={()=>downloadPdf(r)}>Download PDF</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && !loading && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9aa', padding: '40px' }}>
                {rows.length === 0 ? 'No staff found.' : 'No staff match the current filters.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showStaffIdOnly && (
        <div className="dash-card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Staff IDs Quick Reference</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {filteredStaff.map(staff => (
              <div 
                key={staff._id} 
                style={{ 
                  padding: 12, 
                  backgroundColor: staff.staffId ? '#f0fdf4' : '#fef2f2',
                  borderRadius: 8,
                  border: staff.staffId ? '1px solid #16a34a' : '1px solid #dc2626',
                  textAlign: 'center'
                }}
              >
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: 16, 
                  fontWeight: '700',
                  color: staff.staffId ? '#16a34a' : '#dc2626',
                  marginBottom: 4
                }}>
                  {staff.staffId || 'NO ID'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {staff.name || 'Unknown'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {(staff.role || 'field_staff').replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
          {filteredStaff.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              No staff match the current filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStaff;