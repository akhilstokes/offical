import React, { useState, useEffect, useMemo } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiDollarSign, FiFileText, FiCalendar, FiX, FiBell, FiAlertTriangle, FiArrowRight, FiSend, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AccountantAlerts.css';

const AccountantAlerts = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'overdue'

  // Notification Modal State
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyForm, setNotifyForm] = useState({
    title: '',
    message: '',
    target: 'all' // all, staff, manager
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${base}/api/accountant/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${base}/api/accountant/alerts/${alertId}/dismiss`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchAlerts();
        toast.info('Alert dismissed');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleComplete = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${base}/api/accountant/alerts/${alertId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchAlerts();
        toast.success('Alert marked as completed');
      }
    } catch (error) {
      console.error('Error completing alert:', error);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifyForm.title || !notifyForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${base}/api/bulk-notifications/role`;
      let body = {
        title: notifyForm.title,
        message: notifyForm.message,
        type: 'info'
      };

      if (notifyForm.target === 'all') {
        url = `${base}/api/bulk-notifications/all`;
      } else {
        body.role = notifyForm.target; // 'staff' or 'manager'
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Notification sent to ${data.count || 'users'} recipients`);
        setShowNotifyModal(false);
        setNotifyForm({ title: '', message: '', target: 'all' });
      } else {
        toast.error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'payment':
        return <FiDollarSign />;
      case 'deadline':
        return <FiCalendar />;
      case 'document':
        return <FiFileText />;
      case 'compliance':
        return <FiAlertTriangle />;
      default:
        return <FiAlertCircle />;
    }
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter(alert => {
      if (filter === 'pending') return alert.status === 'pending';
      if (filter === 'overdue') return alert.status === 'overdue';
      return true;
    });
  }, [alerts, filter]);

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      overdue: alerts.filter(a => a.status === 'overdue').length,
      highPriority: alerts.filter(a => a.priority === 'high' && a.status !== 'completed').length,
      completed: alerts.filter(a => a.status === 'completed').length
    };
  }, [alerts]);

  return (
    <div className="alerts-container">
      {/* Header - Simplified as layout already has greeting */}
      <div className="page-header">
        <div className="header-actions-left">
          <div className="filter-group">
            <button
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`filter-btn ${filter === 'overdue' ? 'active-overdue' : ''}`}
            >
              Overdue
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`filter-btn ${filter === 'pending' ? 'active-pending' : ''}`}
            >
              Pending
            </button>
          </div>
        </div>
        <div className="header-actions-right">
          <button
            onClick={() => setShowNotifyModal(true)}
            className="btn-send-message"
          >
            <FiSend /> Send Message
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview - Grid layout for better organization */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-info">
                <div className="stat-label">TOTAL ACTIVE</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-icon blue"><FiBell /></div>
            </div>
            <div className="stat-card red">
              <div className="stat-info">
                <div className="stat-label">OVERDUE</div>
                <div className="stat-value">{stats.overdue}</div>
              </div>
              <div className="stat-icon red"><FiAlertCircle /></div>
            </div>
            <div className="stat-card orange">
              <div className="stat-info">
                <div className="stat-label">HIGH PRIORITY</div>
                <div className="stat-value">{stats.highPriority}</div>
              </div>
              <div className="stat-icon orange"><FiClock /></div>
            </div>
            <div className="stat-card green">
              <div className="stat-info">
                <div className="stat-label">COMPLETED</div>
                <div className="stat-value">{stats.completed}</div>
              </div>
              <div className="stat-icon green"><FiCheckCircle /></div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="alerts-section">
            <h3 className="section-title">
              {filter === 'all' ? <FiBell /> : filter === 'overdue' ? <FiAlertCircle /> : <FiClock />}
              {filter === 'all' ? 'ALL' : filter.toUpperCase()} NOTIFICATIONS
            </h3>

            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => {
                const daysUntil = getDaysUntilDue(alert.dueDate);
                return (
                  <div key={alert._id} className={`alert-item priority-${alert.priority || 'medium'} status-${alert.status}`}>
                    <div className="alert-icon-wrapper">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="alert-content">
                      <div className="alert-header">
                        <h4 className="alert-title">{alert.title}</h4>
                      </div>
                      <p className="alert-desc">{alert.description}</p>

                      <div className="alert-meta">
                        {alert.dueDate && (
                          <span className={`meta-tag meta-due ${daysUntil < 0 ? 'urgent' : daysUntil === 0 ? 'today' : ''}`}>
                            <FiCalendar />
                            Due: {new Date(alert.dueDate).toLocaleDateString()}
                            {daysUntil !== null && (
                              <strong>({daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Today' : `${daysUntil} days left`})</strong>
                            )}
                          </span>
                        )}
                        {alert.priority && (
                          <span className="meta-tag" style={{ background: '#f1f5f9', textTransform: 'capitalize' }}>
                            Priority: {alert.priority}
                          </span>
                        )}
                        {alert.link && (
                          <Link to={alert.link} className="view-link">
                            View Details <FiArrowRight />
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="alert-actions">
                      {alert.status !== 'completed' && (
                        <button
                          className="action-btn btn-complete"
                          onClick={() => handleComplete(alert._id)}
                          title="Mark as Completed"
                        >
                          <FiCheckCircle size={20} />
                        </button>
                      )}
                      <button
                        className="action-btn btn-dismiss"
                        onClick={() => handleDismiss(alert._id)}
                        title="Dismiss Alert"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><FiCheckCircle /></div>
                <div className="empty-text">All caught up!</div>
                <div className="empty-subtext">No {filter !== 'all' ? filter : ''} alerts found at the moment.</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Send Notification Modal */}
      {showNotifyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Send Notification</h3>
              <button className="modal-close" onClick={() => setShowNotifyModal(false)}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSendNotification}>
              <div className="form-group">
                <label className="form-label">Recipient Group</label>
                <select
                  value={notifyForm.target}
                  onChange={e => setNotifyForm({ ...notifyForm, target: e.target.value })}
                  className="form-select"
                >
                  <option value="all">All Staff & Managers</option>
                  <option value="manager">Managers Only</option>
                  <option value="staff">Staff Only</option>
                  <option value="lab">Lab Staff Only</option>
                  <option value="delivery_staff">Delivery Staff Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject / Title</label>
                <input
                  type="text"
                  value={notifyForm.title}
                  onChange={e => setNotifyForm({ ...notifyForm, title: e.target.value })}
                  placeholder="e.g., Important Meeting"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  rows="4"
                  value={notifyForm.message}
                  onChange={e => setNotifyForm({ ...notifyForm, message: e.target.value })}
                  placeholder="Type your message here..."
                  className="form-textarea"
                  required
                ></textarea>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-submit"
                >
                  {sending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <FiSend /> Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantAlerts;
