import React from 'react';
import './AdminReports.css';

const AdminReports = () => {
  const reports = [
    { id: 1, name: 'Barrel Movement Report', desc: 'Track all barrel movements and transactions', icon: 'fa-box', color: '#4169e1' },
    { id: 2, name: 'User Activity Report', desc: 'Monitor user activities and engagement', icon: 'fa-users', color: '#34a853' },
    { id: 3, name: 'Financial Report', desc: 'View financial transactions and billing', icon: 'fa-chart-line', color: '#ff9800' },
    { id: 4, name: 'Staff Performance Report', desc: 'Analyze staff productivity and performance', icon: 'fa-user-tie', color: '#9c27b0' },
    { id: 5, name: 'Inventory Report', desc: 'Check stock levels and inventory status', icon: 'fa-warehouse', color: '#f44336' },
    { id: 6, name: 'System Logs Report', desc: 'Review system logs and audit trails', icon: 'fa-file-alt', color: '#00bcd4' }
  ];

  return (
    <div className="admin-reports-page">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <p>Generate and view comprehensive system reports</p>
      </div>

      <div className="reports-grid">
        {reports.map(report => (
          <div key={report.id} className="report-card">
            <div className="report-icon" style={{ background: report.color }}>
              <i className={`fas ${report.icon}`}></i>
            </div>
            <h3>{report.name}</h3>
            <p>{report.desc}</p>
            <button className="btn-generate">
              <i className="fas fa-download"></i>
              Generate Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
