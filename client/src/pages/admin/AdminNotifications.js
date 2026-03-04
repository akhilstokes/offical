import React, { useState } from 'react';
import './AdminNotifications.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const AdminNotifications = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch(`${API}/api/notifications/broadcast`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });

      // Check if response is HTML (404 error)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server endpoint not found. Please restart the server to load the broadcast route.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send notification');
      }

      setSuccess(`Notification sent successfully to ${data.count || 0} users!`);
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        targetRole: 'all',
        priority: 'normal'
      });
    } catch (err) {
      console.error('Notification error:', err);
      if (err.message.includes('JSON')) {
        setError('Server endpoint not found. Please restart the server to load the notification routes.');
      } else {
        setError(err.message || 'Failed to send notification. Please check if the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-notifications-container">
      <div className="notifications-header">
        <h1>Admin Notifications</h1>
        <p>Send broadcast notifications to users</p>
      </div>

      <div className="notification-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Notification Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter notification title"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Enter your message here..."
              required
              rows={6}
              maxLength={500}
            />
            <div className="char-count">{formData.message.length}/500</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="targetRole">Target Audience</label>
              <select
                id="targetRole"
                name="targetRole"
                value={formData.targetRole}
                onChange={handleChange}
              >
                <option value="all">All Users</option>
                <option value="user">Users/Customers</option>
                <option value="staff">Staff</option>
                <option value="delivery">Delivery Staff</option>
                <option value="lab">Lab Staff</option>
                <option value="manager">Managers</option>
                <option value="accountant">Accountants</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i>
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFormData({
                title: '',
                message: '',
                targetRole: 'all',
                priority: 'normal'
              })}
              disabled={loading}
            >
              Clear
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.title || !formData.message}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="notification-info">
        <h3>
          <i className="fas fa-info-circle"></i> Information
        </h3>
        <ul>
          <li>Notifications will be sent to all users matching the selected role</li>
          <li>Users will receive notifications in real-time if they are online</li>
          <li>High and Urgent priority notifications will be highlighted</li>
          <li>Maximum message length is 500 characters</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminNotifications;
