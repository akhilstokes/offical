import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import './UnifiedStaffSalary.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const UnifiedStaffSalary = () => {
  const [salaries, setSalaries] = useState([]);
  const [dailyRate, setDailyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMySalary();
  }, []);

  const loadMySalary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/salary/my-salary`, {
        headers: authHeaders()
      });

      if (!res.ok) {
        throw new Error('Failed to load salary data');
      }

      const response = await res.json();
      setSalaries(response.data || []);
      setDailyRate(response.dailyRate || 0);
    } catch (err) {
      setError(err.message || 'Failed to load salary');
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1] || 'Unknown';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'status-pending',
      approved: 'status-approved',
      paid: 'status-paid',
      rejected: 'status-rejected'
    };
    return statusColors[status] || 'status-pending';
  };

  return (
    <div className="my-salary-page">
      <div className="salary-header">
        <h1>My Salary</h1>
        <p>View your salary information and payment history</p>
      </div>

      {/* Daily Rate Card */}
      <div className="daily-rate-card">
        <div className="rate-icon">
          <i className="fas fa-rupee-sign"></i>
        </div>
        <div className="rate-info">
          <h3>Daily Rate</h3>
          <p className="rate-amount">₹{dailyRate.toFixed(2)}</p>
          <span className="rate-label">Per Day</span>
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Salary Records */}
      <div className="salary-records-card">
        <div className="card-header">
          <h2>Salary History</h2>
          <button onClick={loadMySalary} className="refresh-btn" disabled={loading}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading salary records...</p>
          </div>
        ) : salaries.length > 0 ? (
          <div className="salary-table-wrapper">
            <table className="salary-table">
              <thead>
                <tr>
                  <th>MONTH</th>
                  <th>YEAR</th>
                  <th>GROSS</th>
                  <th>DEDUCTIONS</th>
                  <th>NET PAY</th>
                  <th>STATUS</th>
                  <th>APPROVED AT</th>
                  <th>PAID AT</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((salary) => (
                  <tr key={salary._id}>
                    <td>
                      <span className="month-badge">{getMonthName(salary.month)}</span>
                    </td>
                    <td>{salary.year}</td>
                    <td className="amount-cell">₹{salary.grossSalary.toFixed(2)}</td>
                    <td className="amount-cell deduction">₹{salary.totalDeductions.toFixed(2)}</td>
                    <td className="amount-cell net">₹{salary.netSalary.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(salary.status)}`}>
                        {salary.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {salary.approvedAt 
                        ? new Date(salary.approvedAt).toLocaleDateString('en-IN')
                        : '-'}
                    </td>
                    <td>
                      {salary.paymentDate 
                        ? new Date(salary.paymentDate).toLocaleDateString('en-IN')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-file-invoice-dollar"></i>
            <p>No salary records found</p>
            <span>Your salary records will appear here once generated</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedStaffSalary;