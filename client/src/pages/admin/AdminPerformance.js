import React from 'react';
import './AdminPerformance.css';

const AdminPerformance = () => {
  const metrics = [
    { label: 'Total Users', value: '1,234', change: '+12%', trend: 'up', color: '#4169e1' },
    { label: 'Active Barrels', value: '856', change: '+8%', trend: 'up', color: '#34a853' },
    { label: 'Daily Transactions', value: '342', change: '-3%', trend: 'down', color: '#ff9800' },
    { label: 'System Uptime', value: '99.9%', change: '+0.1%', trend: 'up', color: '#9c27b0' }
  ];

  return (
    <div className="admin-performance-page">
      <div className="performance-header">
        <h1>Performance Metrics</h1>
        <p>Monitor system performance and key metrics</p>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{metric.label}</span>
              <span className={`metric-change ${metric.trend}`}>
                <i className={`fas fa-arrow-${metric.trend === 'up' ? 'up' : 'down'}`}></i>
                {metric.change}
              </span>
            </div>
            <div className="metric-value" style={{ color: metric.color }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="performance-charts">
        <div className="chart-card">
          <h3>System Performance Overview</h3>
          <div className="chart-placeholder">
            <i className="fas fa-chart-area"></i>
            <p>Performance charts will be displayed here</p>
          </div>
        </div>
        <div className="chart-card">
          <h3>User Activity Trends</h3>
          <div className="chart-placeholder">
            <i className="fas fa-chart-line"></i>
            <p>Activity trends will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPerformance;
