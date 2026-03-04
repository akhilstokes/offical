import React, { useState } from 'react';
import './ManagerNotifications.css';

const ManagerNotifications = () => {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  const handleSend = async () => {
    if (!title || !message) {
      alert('Please fill in both title and message');
      return;
    }

    setLoading(true);
    setSuccess('');

    try {
      const endpoint = targetRole === 'all' ? '/api/bulk-notifications/all' : '/api/bulk-notifications/role';
      const body = {
        title,
        message,
        ...(targetRole !== 'all' && { role: targetRole })
      };

      const res = await fetch(`${base}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        if (data.count === 0) {
          setSuccess(`⚠️ ${data.message || 'No recipients found'}`);
        } else {
          setSuccess(`✅ ${data.message || 'Notification sent successfully!'}`);
        }
        setTitle('');
        setMessage('');
      } else {
        alert(data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      alert('Error sending notification. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendQuickReminder = async (type) => {
    setLoading(true);
    setSuccess('');
    
    const messages = {
      attendance: {
        title: 'Attendance Reminder',
        message: 'Please mark your attendance for today. Thank you!'
      },
      meeting: {
        title: 'Team Meeting',
        message: 'Team meeting scheduled for today at 10:00 AM. Please be on time!'
      },
      reports: {
        title: 'Submit Reports',
        message: 'Please submit your pending reports by end of today. Thank you!'
      }
    };

    try {
      const res = await fetch(`${base}/api/bulk-notifications/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(messages[type])
      });

      const data = await res.json();

      if (res.ok) {
        if (data.count === 0) {
          setSuccess(`⚠️ ${messages[type].title}: No staff members found to notify`);
        } else {
          setSuccess(`✅ ${messages[type].title} sent to ${data.count} staff member(s)!`);
        }
      } else {
        alert(data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Send quick reminder error:', error);
      alert('Error sending notification. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-notifications">
      <div className="notification-header">
        <h1>
          <i className="fas fa-bullhorn"></i>
          Send Notifications
        </h1>
        <p>Send messages to your team</p>
      </div>

      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Messages</h3>
        <div className="quick-buttons">
          <button 
            className="quick-btn attendance"
            onClick={() => sendQuickReminder('attendance')}
            disabled={loading}
          >
            <i className="fas fa-clock"></i>
            Attendance Reminder
          </button>
          
          <button 
            className="quick-btn meeting"
            onClick={() => sendQuickReminder('meeting')}
            disabled={loading}
          >
            <i className="fas fa-users"></i>
            Team Meeting
          </button>
          
          <button 
            className="quick-btn reports"
            onClick={() => sendQuickReminder('reports')}
            disabled={loading}
          >
            <i className="fas fa-file-alt"></i>
            Submit Reports
          </button>
        </div>
      </div>

      {/* Custom Message */}
      <div className="custom-message">
        <h3>Custom Message</h3>
        
        <div className="form-group">
          <label>Send To:</label>
          <select 
            value={targetRole} 
            onChange={(e) => setTargetRole(e.target.value)}
          >
            <option value="all">All Staff</option>
            <option value="accountant">Accountants</option>
            <option value="lab_staff">Lab Staff</option>
            <option value="delivery_staff">Delivery Staff</option>
            <option value="field_worker">Field Workers</option>
          </select>
        </div>

        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
          />
        </div>

        <div className="form-group">
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            rows="4"
          />
        </div>

        <button 
          className="send-btn"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Sending...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i>
              Send Message
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ManagerNotifications;

