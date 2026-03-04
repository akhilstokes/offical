
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ManagerHome.css';

const ManagerHome = () => {
  const [managerStats, setManagerStats] = useState({
    pendingSellRequests: 0,
    pendingBillApprovals: 0,
    activePickups: 0,
    completedSales: 0,
    totalRevenue: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchManagerStats();
    fetchRecentActivity();
  }, []);

  const fetchManagerStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/manager-dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || {};
        // Map the overview data to the stats format
        setManagerStats({
          pendingSellRequests: 0, // Not in overview, keep as 0
          pendingBillApprovals: 0, // Not in overview, keep as 0
          activePickups: 0, // Not in overview, keep as 0
          completedSales: 0, // Not in overview, keep as 0
          totalRevenue: 0 // Not in overview, keep as 0
        });
      } else {
        // If API fails, show zeros instead of static data
        setManagerStats({
          pendingSellRequests: 0,
          pendingBillApprovals: 0,
          activePickups: 0,
          completedSales: 0,
          totalRevenue: 0
        });
      }
    } catch (error) {
      console.error('Error fetching manager stats:', error);
      // Show zeros on error
      setManagerStats({
        pendingSellRequests: 0,
        pendingBillApprovals: 0,
        activePickups: 0,
        completedSales: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/manager-dashboard/staff/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        // The staff/activity endpoint returns staff activity data, not recent activity
        // For now, just show empty array since there's no matching endpoint
        setRecentActivity([]);
      } else {
        // If API fails, show empty array instead of static data
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Show empty array on error
      setRecentActivity([]);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      sell_request: 'fa-handshake',
      bill_approval: 'fa-receipt',
      pickup_completed: 'fa-truck',
      sale_approved: 'fa-check-circle'
    };
    return icons[type] || 'fa-info-circle';
  };

  const getActivityColor = (type) => {
    const colors = {
      sell_request: 'activity-sell',
      bill_approval: 'activity-bill',
      pickup_completed: 'activity-pickup',
      sale_approved: 'activity-approved'
    };
    return colors[type] || 'activity-default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low'
    };
    return colors[priority] || 'priority-default';
  };

  if (loading) {
    return (
      <div className="manager-home">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-home">
      <div className="welcome-section">
        <h1>👨‍💼 Manager Dashboard</h1>
        <p>Oversee barrel operations, approvals, and sales management</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card stat-requests">
          <div className="stat-icon">
            <i className="fas fa-handshake"></i>
          </div>
          <div className="stat-content">
            <h3>{managerStats.pendingSellRequests}</h3>
            <p>Pending Sell Requests</p>
          </div>
        </div>

        <div className="stat-card stat-bills">
          <div className="stat-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="stat-content">
            <h3>{managerStats.pendingBillApprovals}</h3>
            <p>Bills to Approve</p>
          </div>
        </div>

        <div className="stat-card stat-pickups">
          <div className="stat-icon">
            <i className="fas fa-truck"></i>
          </div>
          <div className="stat-content">
            <h3>{managerStats.activePickups}</h3>
            <p>Active Pickups</p>
          </div>
        </div>

        <div className="stat-card stat-revenue">
          <div className="stat-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="stat-content">
            <h3>₹{managerStats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Core Manager Functions */}
      <div className="manager-functions">
        <h2>Core Manager Functions</h2>
        <div className="functions-grid">
          <Link to="/manager/sell-requests" className="function-card function-sell">
            <div className="function-icon">
              <i className="fas fa-handshake"></i>
            </div>
            <div className="function-content">
              <h3>Approve Sell Requests</h3>
              <p>Review and approve user barrel selling requests</p>
              {managerStats.pendingSellRequests > 0 && (
                <span className="notification-badge">{managerStats.pendingSellRequests}</span>
              )}
            </div>
          </Link>

          <Link to="/manager/assign-pickup" className="function-card function-pickup">
            <div className="function-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <div className="function-content">
              <h3>Assign Pickup Staff</h3>
              <p>Assign delivery staff for barrel collection</p>
            </div>
          </Link>

          <Link to="/manager/bill-approvals" className="function-card function-bills">
            <div className="function-icon">
              <i className="fas fa-clipboard-check"></i>
            </div>
            <div className="function-content">
              <h3>Verify Bills</h3>
              <p>Review and verify bills prepared by Accountant</p>
              {managerStats.pendingBillApprovals > 0 && (
                <span className="notification-badge">{managerStats.pendingBillApprovals}</span>
              )}
            </div>
          </Link>

          <Link to="/manager/final-approvals" className="function-card function-approvals">
            <div className="function-icon">
              <i className="fas fa-stamp"></i>
            </div>
            <div className="function-content">
              <h3>Final Sale Approval</h3>
              <p>Approve final company sales with seal</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="empty-activity">
            <div className="empty-icon">
              <i className="fas fa-history"></i>
            </div>
            <p>No recent activity</p>
            <span>Activity will appear here when actions are performed</span>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className={`activity-item ${getActivityColor(activity.type)}`}>
                <div className="activity-icon">
                  <i className={`fas ${getActivityIcon(activity.type)}`}></i>
                </div>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <span className="activity-date">
                    {new Date(activity.date).toLocaleString()}
                  </span>
                </div>
                <div className={`activity-priority ${getPriorityColor(activity.priority)}`}>
                  {activity.priority}
                </div>
                <div className={`activity-status status-${activity.status}`}>
                  {activity.status}
                </div>
              </div>
            ))}
          </div>
        )}
        {recentActivity.length > 0 && (
          <Link to="/manager/all-activity" className="view-all-link">
            View All Activity →
          </Link>
        )}
      </div>

      {/* Management Tools */}
      <div className="management-tools">
        <h2>Management Tools</h2>
        <div className="tools-grid">
          <Link to="/manager/pickup-tracking" className="tool-card">
            <i className="fas fa-map-marker-alt"></i>
            <span>Pickup Tracking</span>
          </Link>
          
          <Link to="/manager/staff-performance" className="tool-card">
            <i className="fas fa-chart-bar"></i>
            <span>Staff Performance</span>
          </Link>
          
          <Link to="/manager/sales-reports" className="tool-card">
            <i className="fas fa-file-chart-line"></i>
            <span>Sales Reports</span>
          </Link>
          
          <Link to="/manager/revenue-analytics" className="tool-card">
            <i className="fas fa-analytics"></i>
            <span>Revenue Analytics</span>
          </Link>
          
          <Link to="/manager/notifications" className="tool-card">
            <i className="fas fa-bell"></i>
            <span>Notifications</span>
          </Link>
          
          <Link to="/manager/settings" className="tool-card">
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Today's Summary - Dynamic Data */}
      <div className="quick-stats">
        <h2>Today's Summary</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Requests Processed</h4>
            <div className="summary-value">{managerStats.completedSales || 0}</div>
          </div>
          <div className="summary-card">
            <h4>Bills Approved</h4>
            <div className="summary-value">{managerStats.pendingBillApprovals || 0}</div>
          </div>
          <div className="summary-card">
            <h4>Sales Completed</h4>
            <div className="summary-value">{managerStats.completedSales || 0}</div>
          </div>
          <div className="summary-card">
            <h4>Revenue Generated</h4>
            <div className="summary-value">₹{(managerStats.totalRevenue || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerHome;
