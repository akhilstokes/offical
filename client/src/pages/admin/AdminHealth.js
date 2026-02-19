import React from 'react';
import './AdminHealth.css';

const AdminHealth = () => {
  const healthStatus = [
    { service: 'Database', status: 'healthy', uptime: '99.9%', responseTime: '12ms' },
    { service: 'API Server', status: 'healthy', uptime: '99.8%', responseTime: '45ms' },
    { service: 'File Storage', status: 'healthy', uptime: '100%', responseTime: '8ms' },
    { service: 'Email Service', status: 'warning', uptime: '98.5%', responseTime: '120ms' },
    { service: 'SMS Gateway', status: 'healthy', uptime: '99.7%', responseTime: '200ms' },
    { service: 'Backup System', status: 'healthy', uptime: '100%', responseTime: '5ms' }
  ];

  return (
    <div className="admin-health-page">
      <div className="health-header">
        <h1>System Health</h1>
        <p>Monitor system health and service status</p>
      </div>

      <div className="health-overview">
        <div className="overview-card">
          <div className="overview-icon healthy">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="overview-info">
            <h2>All Systems Operational</h2>
            <p>Last checked: Just now</p>
          </div>
        </div>
      </div>

      <div className="health-services">
        <h3>Service Status</h3>
        <div className="services-list">
          {healthStatus.map((service, index) => (
            <div key={index} className="service-item">
              <div className="service-info">
                <div className="service-name">
                  <span className={`status-indicator ${service.status}`}></span>
                  {service.service}
                </div>
                <div className="service-metrics">
                  <span><i className="fas fa-clock"></i> Uptime: {service.uptime}</span>
                  <span><i className="fas fa-tachometer-alt"></i> Response: {service.responseTime}</span>
                </div>
              </div>
              <span className={`status-badge ${service.status}`}>
                {service.status === 'healthy' ? 'Healthy' : 'Warning'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHealth;
