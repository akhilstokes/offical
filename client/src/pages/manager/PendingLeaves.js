import React, { useState, useEffect } from 'react';
import './PendingLeaves.css';

const PendingLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/api/leave/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaves(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load pending leaves');
      }
    } catch (err) {
      console.error('Error fetching pending leaves:', err);
      setError('Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, action) => {
    try {
      const response = await fetch(`${API_BASE}/api/leave/${action}/${leaveId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessage(`Leave ${action}d successfully`);
        setTimeout(() => setMessage(''), 3000);
        await fetchPendingLeaves();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `Failed to ${action} leave`);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error(`Error ${action}ing leave:`, err);
      setError(`Failed to ${action} leave`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch {
      return 0;
    }
  };

  const getLeaveTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'sick': return '🏥';
      case 'casual': return '🏖️';
      case 'annual': return '🌴';
      case 'maternity': return '👶';
      case 'paternity': return '👨‍👶';
      case 'emergency': return '🚨';
      default: return '📅';
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'sick': return '#ef4444';
      case 'casual': return '#3b82f6';
      case 'annual': return '#10b981';
      case 'maternity': return '#f59e0b';
      case 'paternity': return '#8b5cf6';
      case 'emergency': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = !searchTerm || 
      (leave.staffName && leave.staffName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (leave.staff?.name && leave.staff.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (leave.leaveType && leave.leaveType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'all' || 
      (leave.leaveType && leave.leaveType.toLowerCase() === filter.toLowerCase());
    
    return matchesSearch && matchesFilter;
  });

  const leaveStats = {
    total: leaves.length,
    sick: leaves.filter(l => l.leaveType?.toLowerCase() === 'sick').length,
    casual: leaves.filter(l => l.leaveType?.toLowerCase() === 'casual').length,
    annual: leaves.filter(l => l.leaveType?.toLowerCase() === 'annual').length,
    emergency: leaves.filter(l => l.leaveType?.toLowerCase() === 'emergency').length
  };

  return (
    <div className="pending-leaves">
      {/* Header Section */}
      <div className="leaves-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <i className="fas fa-calendar-times"></i>
              Pending Leave Requests
            </h1>
            <p>Review and approve staff leave applications</p>
          </div>
          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={fetchPendingLeaves}
              disabled={loading}
            >
              <i className={`fas fa-sync-alt ${loading ? 'spinning' : ''}`}></i>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{leaveStats.total}</div>
              <div className="stat-label">Total Requests</div>
            </div>
          </div>
          <div className="stat-card sick">
            <div className="stat-icon">🏥</div>
            <div className="stat-content">
              <div className="stat-number">{leaveStats.sick}</div>
              <div className="stat-label">Sick Leave</div>
            </div>
          </div>
          <div className="stat-card casual">
            <div className="stat-icon">🏖️</div>
            <div className="stat-content">
              <div className="stat-number">{leaveStats.casual}</div>
              <div className="stat-label">Casual Leave</div>
            </div>
          </div>
          <div className="stat-card annual">
            <div className="stat-icon">🌴</div>
            <div className="stat-content">
              <div className="stat-number">{leaveStats.annual}</div>
              <div className="stat-label">Annual Leave</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="controls-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by staff name or leave type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'sick', 'casual', 'annual', 'emergency'].map(type => (
            <button
              key={type}
              className={`filter-tab ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {message}
        </div>
      )}

      {/* Leave Requests */}
      <div className="leaves-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p>Loading pending leaves...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <h3>
              {searchTerm || filter !== 'all' 
                ? 'No matching leave requests' 
                : 'No pending leave requests'}
            </h3>
            <p>
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'All leave requests have been processed'}
            </p>
          </div>
        ) : (
          <div className="leaves-grid">
            {filteredLeaves.map((leave) => (
              <div key={leave._id} className="leave-card">
                <div className="leave-header">
                  <div className="staff-info">
                    <div className="staff-avatar">
                      {(leave.staffName || leave.staff?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="staff-details">
                      <h3>{leave.staffName || leave.staff?.name || 'Unknown Staff'}</h3>
                    </div>
                  </div>
                  <span 
                    className="type-badge"
                    style={{ backgroundColor: getLeaveTypeColor(leave.leaveType) }}
                  >
                    {leave.leaveType || 'Leave'}
                  </span>
                </div>

                <div className="leave-dates">
                  <div className="date-item">
                    <span className="date-label">From</span>
                    <span className="date-value">{formatDate(leave.startDate)}</span>
                  </div>
                  <div className="date-separator">→</div>
                  <div className="date-item">
                    <span className="date-label">To</span>
                    <span className="date-value">{formatDate(leave.endDate)}</span>
                  </div>
                  <div className="duration-badge">
                    {calculateDays(leave.startDate, leave.endDate)} days
                  </div>
                </div>

                {leave.reason && (
                  <div className="leave-reason">
                    <p>{leave.reason}</p>
                  </div>
                )}

                <div className="leave-actions">
                  <button
                    className="action-btn approve-btn"
                    onClick={() => handleLeaveAction(leave._id, 'approve')}
                  >
                    <i className="fas fa-check"></i>
                    Approve
                  </button>
                  <button
                    className="action-btn reject-btn"
                    onClick={() => handleLeaveAction(leave._id, 'reject')}
                  >
                    <i className="fas fa-times"></i>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingLeaves;