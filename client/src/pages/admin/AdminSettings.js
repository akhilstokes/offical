import React, { useState } from 'react';
import './AdminSettings.css';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    companyName: 'Holy Family Polymers',
    email: 'admin@holyfamilypolymers.com',
    phone: '+91 1234567890',
    address: 'Kerala, India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'English'
  });

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="admin-settings-page">
      <div className="settings-header">
        <h1>System Settings</h1>
        <p>Configure system-wide parameters and preferences</p>
      </div>

      <div className="settings-sections">
        {/* Company Information */}
        <div className="settings-section">
          <h2>Company Information</h2>
          <div className="settings-grid">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="settings-section">
          <h2>Regional Settings</h2>
          <div className="settings-grid">
            <div className="form-group">
              <label>Currency</label>
              <select name="currency" value={settings.currency} onChange={handleChange} className="form-control">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Timezone</label>
              <select name="timezone" value={settings.timezone} onChange={handleChange} className="form-control">
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Format</label>
              <select name="dateFormat" value={settings.dateFormat} onChange={handleChange} className="form-control">
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select name="language" value={settings.language} onChange={handleChange} className="form-control">
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Malayalam">Malayalam</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="settings-section">
          <h2>System Preferences</h2>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Email Notifications</h3>
                <p>Send email notifications for important events</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h3>SMS Notifications</h3>
                <p>Send SMS alerts for critical updates</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h3>Auto Backup</h3>
                <p>Automatically backup data daily</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h3>Maintenance Mode</h3>
                <p>Enable maintenance mode for system updates</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button className="btn-save" onClick={handleSave}>
            <i className="fas fa-save"></i>
            Save Settings
          </button>
          <button className="btn-cancel">
            <i className="fas fa-times"></i>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
