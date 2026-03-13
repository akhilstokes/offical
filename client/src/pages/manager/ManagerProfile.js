import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManagerProfile.css';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ManagerProfile = () => {
  const { validateToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', location: '' });
  const [originalForm, setOriginalForm] = useState({ name: '', email: '', phoneNumber: '', location: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const init = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          const prefill = { 
            name: u.name || '', 
            email: u.email || '', 
            phoneNumber: u.phoneNumber || '', 
            location: u.location || '' 
          };
          setForm(prefill);
          setOriginalForm(prefill);
        }
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API}/api/users/profile`, { headers });
        const u = res.data;
        const fetched = { 
          name: u.name || '', 
          email: u.email || '', 
          phoneNumber: u.phoneNumber || '', 
          location: u.location || '' 
        };
        setForm(fetched);
        setOriginalForm(fetched);
      } catch (e) {
        console.error('Error loading profile:', e);
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
      const clean = form.phoneNumber.replace(/\D/g, '');
      const finalPhone = clean.startsWith('91') && clean.length === 12 ? clean.slice(2) : (clean.startsWith('0') ? clean.slice(1) : clean);
      const payload = { 
        name: form.name.trim(), 
        phoneNumber: finalPhone, 
        location: form.location.trim() 
      };
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.put(`${API}/api/users/profile`, payload, { headers });
      const updated = res.data.user;
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...current, ...updated }));
      const nextState = { 
        name: updated.name || form.name, 
        email: form.email, 
        phoneNumber: updated.phoneNumber || form.phoneNumber, 
        location: updated.location || form.location 
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="manager-profile-container">
      <aside className="manager-profile-summary">
        <div className="summary-header">
          <i className="fas fa-user-circle" />
          <span>Manager Profile</span>
        </div>
        <div className="summary-item">
          <div className="label">Name</div>
          <div className="value">{form.name || '--'}</div>
        </div>
        <div className="summary-item">
          <div className="label">Email</div>
          <div className="value">{form.email || '--'}</div>
        </div>
        <div className="summary-item">
          <div className="label">Phone</div>
          <div className="value">{form.phoneNumber || '--'}</div>
        </div>
        <div className="summary-item">
          <div className="label">Location</div>
          <div className="value">{form.location || '--'}</div>
        </div>
        <div className="summary-item">
          <div className="label">Role</div>
          <div className="value status-active">{user?.role ? user.role.replace(/_/g, ' ') : 'System Manager'}</div>
        </div>
      </aside>

      <section className="manager-profile-content">
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'edit' ? 'active' : ''}`} 
            onClick={() => setActiveTab('edit')}
          >
            <i className="fas fa-edit" /> Edit Profile
          </button>
          <button 
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`} 
            onClick={() => setActiveTab('password')}
          >
            <i className="fas fa-lock" /> Change Password
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {activeTab === 'edit' && (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  value={form.name} 
                  onChange={handleChange} 
                  placeholder="Your name" 
                  disabled={!editMode} 
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  disabled 
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input 
                  id="phoneNumber" 
                  name="phoneNumber" 
                  type="tel" 
                  value={form.phoneNumber} 
                  onChange={handleChange} 
                  placeholder="e.g. 9876543210" 
                  disabled={!editMode} 
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input 
                  id="location" 
                  name="location" 
                  type="text" 
                  value={form.location} 
                  onChange={handleChange} 
                  placeholder="City, State" 
                  disabled={!editMode} 
                />
              </div>
            </div>

            <div className="form-actions">
              {!editMode && (
                <button type="button" className="btn btn-primary" onClick={() => setEditMode(true)}>
                  <i className="fas fa-edit" /> Edit Profile
                </button>
              )}
              {editMode && (
                <>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Update Profile'}
                  </button>
                </>
              )}
            </div>
          </form>
        )}

        {activeTab === 'password' && (
          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input 
                id="currentPassword" 
                name="currentPassword" 
                type="password" 
                value={passwordForm.currentPassword} 
                onChange={handlePasswordChange} 
                placeholder="Enter current password" 
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input 
                  id="newPassword" 
                  name="newPassword" 
                  type="password" 
                  value={passwordForm.newPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="Enter new password" 
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  value={passwordForm.confirmPassword} 
                  onChange={handlePasswordChange} 
                  placeholder="Confirm password" 
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default ManagerProfile;
