import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Profile.css';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
  const { validateToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // edit | password | bank | history
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', location: '', address: '', accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '' });
  const [originalForm, setOriginalForm] = useState({ name: '', email: '', phoneNumber: '', location: '', address: '', accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const init = async () => {
      try {
        // Prefill from localStorage for instant UI
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          const prefill = { 
            name: u.name || '', 
            email: u.email || '', 
            phoneNumber: u.phoneNumber || '', 
            location: u.location || '', 
            address: u.address || '',
            accountHolderName: u.accountHolderName || '',
            accountNumber: u.accountNumber || '',
            ifscCode: u.ifscCode || '',
            bankName: u.bankName || '',
            branchName: u.branchName || ''
          };
          setForm(prev => ({ ...prev, ...prefill }));
          setOriginalForm(prefill);
        }
        // Fetch fresh from backend with Authorization header
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API}/api/users/profile`, { headers });
        const u = res.data;
        const fetched = { 
          name: u.name || '', 
          email: u.email || '', 
          phoneNumber: u.phoneNumber || '', 
          location: u.location || '', 
          address: u.address || '',
          accountHolderName: u.accountHolderName || '',
          accountNumber: u.accountNumber || '',
          ifscCode: u.ifscCode || '',
          bankName: u.bankName || '',
          branchName: u.branchName || ''
        };
        setForm(fetched);
        setOriginalForm(fetched);
      } catch (e) {
        // Keep local values if request fails
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setSaving(true);
      // Normalize phone: strip non-digits, drop leading +, 91 or 0
      const clean = form.phoneNumber.replace(/\D/g, '');
      const finalPhone = clean.startsWith('91') && clean.length === 12 ? clean.slice(2) : (clean.startsWith('0') ? clean.slice(1) : clean);
      const payload = { 
        name: form.name.trim(), 
        phoneNumber: finalPhone, 
        location: form.location.trim(), 
        address: form.address.trim(),
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim(),
        bankName: form.bankName.trim(),
        branchName: form.branchName.trim()
      };
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.put(`${API}/api/users/profile`, payload, { headers });
      const updated = res.data.user;
      // Update local storage and refresh context
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...current, ...updated }));
      const nextState = { 
        name: updated.name || form.name, 
        email: form.email, 
        phoneNumber: updated.phoneNumber || form.phoneNumber, 
        location: updated.location || form.location, 
        address: updated.address || form.address,
        accountHolderName: updated.accountHolderName || form.accountHolderName,
        accountNumber: updated.accountNumber || form.accountNumber,
        ifscCode: updated.ifscCode || form.ifscCode,
        bankName: updated.bankName || form.bankName,
        branchName: updated.branchName || form.branchName
      };
      setForm(nextState);
      setOriginalForm(nextState);
      setMessage('Profile updated successfully');
      setEditMode(false);
      await validateToken();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(originalForm);
    setEditMode(false);
    setError('');
    setMessage('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Please fill all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/api/auth/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, { headers });
      setMessage('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('edit');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-container navy-theme">
      {/* Left summary */}
      <aside className="profile-summary">
        <div className="summary-title">
          <i className="fas fa-user-circle" />
          <span>Your Profile Details</span>
        </div>
        <div className="summary-item">
          <div className="label">Your Name</div>
          <div className="value">{form.name || '--'}</div>
        </div>
        <div className="summary-item">
          <div className="label">Your Email</div>
          <div className="value"><a href={`mailto:${form.email}`}>{form.email || '--'}</a></div>
        </div>
        <div className="summary-item">
          <div className="label">Your Mobile</div>
          <div className="value">{form.phoneNumber || '--'}</div>
        </div>
        <div className="summary-item">
          <div className="label">Status</div>
          <div className="value active">Active</div>
        </div>
      </aside>

      {/* Right content */}
      <section className="profile-content">
        <div className="tabs">
          <button className={`tab ${activeTab==='edit'?'active':''}`} onClick={() => setActiveTab('edit')}>Edit Profile</button>
          <button className={`tab ${activeTab==='bank'?'active':''}`} onClick={() => setActiveTab('bank')}>Bank Details</button>
          <button className={`tab ${activeTab==='password'?'active':''}`} onClick={() => setActiveTab('password')}>Change Password</button>
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        {activeTab === 'edit' && (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-row">
                <label htmlFor="name">Full Name</label>
                <input id="name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Your name" disabled={!editMode} />
              </div>
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} disabled />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label htmlFor="phoneNumber">Mobile No</label>
                <input id="phoneNumber" name="phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange} placeholder="e.g. 9876543210" disabled={!editMode} />
              </div>
              <div className="form-row">
                <label htmlFor="location">Location</label>
                <input id="location" name="location" type="text" value={form.location} onChange={handleChange} placeholder="City, State" disabled={!editMode} />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="address">Complete Address</label>
              <textarea 
                id="address" 
                name="address" 
                value={form.address} 
                onChange={handleChange} 
                placeholder="Enter your complete address (house/building, street, area, city, pincode)" 
                disabled={!editMode}
                rows="3"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-actions">
              {!editMode && (
                <button type="button" className="btn primary" onClick={() => setEditMode(true)}>Edit</button>
              )}
              {editMode && (
                <>
                  <button type="button" className="btn" onClick={handleCancel} disabled={saving} style={{ marginRight: 8 }}>Cancel</button>
                  <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Update'}</button>
                </>
              )}
            </div>
          </form>
        )}

        {activeTab === 'bank' && (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-row">
                <label htmlFor="accountHolderName">Account Holder Name</label>
                <input id="accountHolderName" name="accountHolderName" type="text" value={form.accountHolderName} onChange={handleChange} placeholder="As per bank passbook" disabled={!editMode} />
              </div>
              <div className="form-row">
                <label htmlFor="accountNumber">Account Number</label>
                <input id="accountNumber" name="accountNumber" type="text" value={form.accountNumber} onChange={handleChange} placeholder="Enter account number" disabled={!editMode} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label htmlFor="ifscCode">IFSC Code</label>
                <input id="ifscCode" name="ifscCode" type="text" value={form.ifscCode} onChange={handleChange} placeholder="e.g. SBIN0001234" disabled={!editMode} />
              </div>
              <div className="form-row">
                <label htmlFor="bankName">Bank Name</label>
                <input id="bankName" name="bankName" type="text" value={form.bankName} onChange={handleChange} placeholder="e.g. State Bank of India" disabled={!editMode} />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="branchName">Branch Name</label>
              <input id="branchName" name="branchName" type="text" value={form.branchName} onChange={handleChange} placeholder="Enter branch name" disabled={!editMode} />
            </div>

            <div className="form-actions">
              {!editMode && (
                <button type="button" className="btn primary" onClick={() => setEditMode(true)}>Edit Bank Details</button>
              )}
              {editMode && (
                <>
                  <button type="button" className="btn" onClick={handleCancel} disabled={saving} style={{ marginRight: 8 }}>Cancel</button>
                  <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Update Bank Details'}</button>
                </>
              )}
            </div>
          </form>
        )}

        {activeTab === 'password' && (
          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <div className="form-row">
              <label htmlFor="currentPassword">Current Password</label>
              <input id="currentPassword" name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Enter current password" />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label htmlFor="newPassword">New Password</label>
                <input id="newPassword" name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="Enter new password" />
              </div>
              <div className="form-row">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm password" />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Updating...' : 'Change Password'}</button>
            </div>
          </form>
        )}

      </section>
    </div>
  );
};

export default Profile;