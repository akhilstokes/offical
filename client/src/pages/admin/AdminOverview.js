import React from 'react';
import './AdminOverview.css';

const AdminOverview = () => {
  const stats = [
    { label: 'Total Users', value: '1,234', icon: 'fa-users', color: '#4169e1' },
    { label: 'Active Barrels', value: '856', icon: 'fa-box', color: '#34a853' },
    { label: 'Staff Members', value: '45', icon: 'fa-user-tie', color: '#ff9800' },
    { label: 'Pending Requests', value: '12', icon: 'fa-clock', color: '#f44336' }
  ];

  const recentActivity = [
    { action: 'New barrel request', user: 'John Doe', time: '5 mins ago', icon: 'fa-box', color: '#4169e1' },
    { action: 'User registered', user: 'Jane Smith', time: '12 mins ago', icon: 'fa-user-plus', color: '#34a853' },
    { action: 'Barrel delivered', user: 'Mike Johnson', time: '25 mins ago', icon: 'fa-truck', color: '#ff9800' },
    { action: 'Payment received', user: 'Sarah Williams', time: '1 hour ago', icon: 'fa-dollar-sign', color: '#9c27b0' }
  ];

  return (
    <div className="admin-overview-page">
      <div className="overview-header">
        <h1>System Overview</h1>
        <p>Complete system status and activity overview</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ background: stat.color }}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-content">
        <div className="activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon" style={{ background: activity.color }}>
                  <i className={`fas ${activity.icon}`}></i>
                </div>
                <div className="activity-details">
                  <div className="activity-action">{activity.action}</div>
                  <div className="activity-meta">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions-section">
          <h3>Quick Actions</h3>
          <div className="quick-actions-list">
            <button className="quick-action-btn">
              <i className="fas fa-plus"></i>
              Add New User
            </button>
            <button className="quick-action-btn">
              <i className="fas fa-box"></i>
              Create Barrel
            </button>
            <button className="quick-action-btn">
              <i className="fas fa-file-alt"></i>
              Generate Report
            </button>
            <button className="quick-action-btn">
              <i className="fas fa-cog"></i>
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
