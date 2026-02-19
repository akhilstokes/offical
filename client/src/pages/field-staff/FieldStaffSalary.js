import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './FieldStaffSalary.css';

const FieldStaffSalary = () => {
  const { user } = useAuth();
  const [salaryData, setSalaryData] = useState({
    totalEarnings: 3390,
    daysWorked: 30,
    dailyWage: 113,
    pendingAmount: 113
  });
  const [dailyBreakdown, setDailyBreakdown] = useState([
    { date: 'Jan 30, 2026', day: 'Friday', hours: '8h 00m', rate: '₹113', amount: '₹113', status: 'Pending' },
    { date: 'Jan 29, 2026', day: 'Thursday', hours: '8h 00m', rate: '₹113', amount: '₹113', status: 'Paid' },
    { date: 'Jan 28, 2026', day: 'Wednesday', hours: '8h 00m', rate: '₹113', amount: '₹113', status: 'Paid' },
    { date: 'Jan 27, 2026', day: 'Tuesday', hours: '8h 00m', rate: '₹113', amount: '₹113', status: 'Paid' },
    { date: 'Jan 26, 2026', day: 'Monday', hours: '8h 00m', rate: '₹113', amount: '₹113', status: 'Paid' },
    { date: 'Jan 25, 2026', day: 'Sunday', hours: 'OFF', rate: '-', amount: '-', status: 'Holiday' }
  ]);
  const [recentPayments, setRecentPayments] = useState([
    { amount: 1300, date: 'Jan 15, 2026', type: 'Advance', id: 'TXN-8811' },
    { amount: 3256, date: 'Dec 31, 2025', type: 'Salary', id: 'TXN-7723' }
  ]);

  const handleDownloadSlip = () => {
    alert('Downloading salary slip...');
  };

  const handleRequestAdvance = () => {
    alert('Request advance submitted');
  };

  const handleViewHistory = () => {
    alert('Viewing full history...');
  };

  const handleViewAllTransactions = () => {
    alert('Viewing all transactions...');
  };

  const handleReceipt = (id) => {
    alert(`Viewing receipt ${id}`);
  };

  return (
    <div className="field-staff-salary-page">
      {/* Blue Header */}
      <div className="salary-header">
        <div className="header-content">
          <h1>Salary Details</h1>
          <p className="header-date">
            <i className="fas fa-calendar"></i>
            January 2026
          </p>
        </div>
        <button className="download-slip-btn" onClick={handleDownloadSlip}>
          <i className="fas fa-download"></i>
          Download Slip
        </button>
      </div>

      {/* Four Stat Cards */}
      <div className="salary-stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">TOTAL EARNINGS</span>
            <div className="stat-icon green-icon">
              <i className="fas fa-wallet"></i>
            </div>
          </div>
          <h2 className="stat-value">₹{salaryData.totalEarnings.toLocaleString()}</h2>
          <p className="stat-change positive">
            <i className="fas fa-arrow-up"></i>
            +12% from last month
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">DAYS WORKED</span>
            <div className="stat-icon blue-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
          </div>
          <h2 className="stat-value">{salaryData.daysWorked} Days</h2>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">DAILY WAGE</span>
            <div className="stat-icon purple-icon">
              <i className="fas fa-rupee-sign"></i>
            </div>
          </div>
          <h2 className="stat-value">₹{salaryData.dailyWage}</h2>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">PENDING AMOUNT</span>
            <div className="stat-icon orange-icon">
              <i className="fas fa-clock"></i>
            </div>
          </div>
          <h2 className="stat-value">₹{salaryData.pendingAmount}</h2>
          <p className="stat-info">For Jan 30</p>
        </div>
      </div>

      {/* Main Content: Daily Breakdown + Sidebar */}
      <div className="salary-content-layout">
        {/* Daily Breakdown Table */}
        <div className="daily-breakdown-section">
          <div className="section-header">
            <h2>Daily Breakdown</h2>
            <button className="view-history-link" onClick={handleViewHistory}>
              View Full History
            </button>
          </div>

          <div className="breakdown-table-wrapper">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>HOURS</th>
                  <th>RATE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {dailyBreakdown.map((day, index) => (
                  <tr key={index}>
                    <td>
                      <div className="date-column">
                        <span className="date-main">{day.date}</span>
                        <span className="date-day">{day.day}</span>
                      </div>
                    </td>
                    <td>
                      {day.hours !== 'OFF' ? (
                        <>
                          <i className="fas fa-clock"></i> {day.hours}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-times-circle"></i> OFF
                        </>
                      )}
                    </td>
                    <td>{day.rate}</td>
                    <td>{day.amount}</td>
                    <td>
                      <span className={`status-badge status-${day.status.toLowerCase()}`}>
                        {day.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Quick Actions + Recent Payments */}
        <div className="salary-sidebar">
          {/* Quick Actions */}
          <div className="sidebar-box quick-actions-box">
            <h3>QUICK ACTIONS</h3>
            <button className="action-btn primary-btn" onClick={handleDownloadSlip}>
              <i className="fas fa-download"></i>
              Download Salary Slip
            </button>
            <button className="action-btn secondary-btn" onClick={handleRequestAdvance}>
              <i className="fas fa-hand-holding-usd"></i>
              Request Advance
            </button>
          </div>

          {/* Recent Payments */}
          <div className="sidebar-box recent-payments-box">
            <h3>RECENT PAYMENTS</h3>
            <div className="payments-list">
              {recentPayments.map((payment, index) => (
                <div key={index} className="payment-item">
                  <div className="payment-details">
                    <p className="payment-amount">₹{payment.amount.toLocaleString()}</p>
                    <p className="payment-meta">{payment.date} • {payment.type}</p>
                  </div>
                  <button className="receipt-btn" onClick={() => handleReceipt(payment.id)}>
                    <i className="fas fa-receipt"></i>
                    Receipt
                  </button>
                </div>
              ))}
            </div>
            <button className="view-all-transactions-btn" onClick={handleViewAllTransactions}>
              View All Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldStaffSalary;
