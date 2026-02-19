import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import './MySalary.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const MySalary = () => {
  const [salaries, setSalaries] = useState([]);
  const [dailyRate, setDailyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

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
      const rate = response.dailyRate || 0;
      console.log('Daily Rate loaded:', rate); // Debug log
      setDailyRate(rate);
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

  const viewPayslip = (salary) => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    const payslip = {
      staff: {
        name: user.name || 'Staff Member',
        email: user.email || '',
        role: user.role || 'staff'
      },
      monthName: getMonthName(salary.month),
      month: salary.month,
      year: salary.year,
      period: salary.period || `${getMonthName(salary.month)} ${salary.year}`,
      wageType: salary.wageType || 'Monthly',
      workingDays: salary.presentDays || salary.totalDays || salary.workingDays || 0,
      numberOfWeeks: salary.numberOfWeeks || 1,
      dailyRate: salary.dailyRate || dailyRate,
      basicSalary: salary.basicSalary || 0,
      medicalAllowance: salary.medicalAllowance || 0,
      transportationAllowance: salary.transportationAllowance || 0,
      overtime: salary.overtime || 0,
      bonus: salary.bonus || 0,
      grossSalary: salary.grossSalary || 0,
      deductions: {
        providentFund: salary.deductions?.providentFund || 0,
        professionalTax: salary.deductions?.professionalTax || 0,
        incomeTax: salary.deductions?.tax || salary.deductions?.incomeTax || 0,
        otherDeductions: salary.deductions?.other || salary.deductions?.otherDeductions || 0
      },
      totalDeductions: salary.totalDeductions || 0,
      netSalary: salary.netSalary || 0,
      status: salary.status || 'pending',
      paymentDate: salary.paymentDate,
      generatedAt: salary.createdAt,
      generatedDate: new Date(salary.createdAt || Date.now()).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    };

    setSelectedPayslip(payslip);
    setShowPayslip(true);
  };

  // Helper function to convert number to words (for Indian numbering system)
  const convertToWords = (amount) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (amount === 0) return 'Zero';
    
    const num = Math.floor(amount);
    let words = '';
    
    // Lakhs
    if (num >= 100000) {
      words += convertToWords(Math.floor(num / 100000)) + ' Lakh ';
      amount = num % 100000;
    }
    
    // Thousands
    if (num >= 1000) {
      words += convertToWords(Math.floor(num / 1000)) + ' Thousand ';
      amount = num % 1000;
    }
    
    // Hundreds
    if (num >= 100) {
      words += ones[Math.floor(num / 100)] + ' Hundred ';
      amount = num % 100;
    }
    
    // Tens and Ones
    if (num >= 20) {
      words += tens[Math.floor(num / 10)] + ' ';
      words += ones[num % 10];
    } else if (num >= 10) {
      words += teens[num - 10];
    } else if (num > 0) {
      words += ones[num];
    }
    
    return words.trim();
  };

  return (
    <div className="my-salary-page">
      <div className="salary-header">
        <h1>My Salary</h1>
        <p>View your salary information and payment history</p>
      </div>

      {/* Daily Rate Card */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        color: '#ffffff',
        padding: '30px',
        borderRadius: '12px',
        margin: '0 40px 30px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          flexShrink: '0',
          color: '#ffffff'
        }}>
          <i className="fas fa-rupee-sign" style={{color: '#ffffff !important'}}></i>
        </div>
        <div style={{flex: '1', color: '#ffffff'}}>
          <h3 style={{
            color: '#ffffff !important',
            fontSize: '16px !important',
            fontWeight: '600 !important',
            margin: '0 0 8px 0 !important',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Daily Rate
          </h3>
          <p style={{
            color: '#ffffff !important',
            fontSize: '36px !important',
            fontWeight: '700 !important',
            margin: '0 0 4px 0 !important',
            lineHeight: '1 !important'
          }}>
            ₹{dailyRate.toFixed(2)}
          </p>
          <span style={{
            color: '#ffffff !important',
            fontSize: '14px !important',
            display: 'block !important',
            fontWeight: '400 !important'
          }}>
            Per Day
          </span>
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
                  <th>ACTION</th>
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
                      <button 
                        className="view-payslip-btn"
                        onClick={() => viewPayslip(salary)}
                      >
                        <i className="fas fa-file-invoice"></i> View Payslip
                      </button>
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

      {/* Payslip Modal */}
      {showPayslip && selectedPayslip && (
        <div className="modal-overlay" onClick={() => setShowPayslip(false)}>
          <div className="modal-content payslip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Salary Payslip</h3>
              <button className="close-btn" onClick={() => setShowPayslip(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="payslip-content">
              {/* Company Header */}
              <div className="payslip-header">
                <h2>Holy Family Polymers</h2>
                <h3>Salary Slip</h3>
                <p className="payslip-month">{selectedPayslip.monthName} {selectedPayslip.year}</p>
                <p className="generated-date">Generated on: {selectedPayslip.generatedDate}</p>
              </div>

              {/* Employee Details */}
              <div className="payslip-section">
                <h4>Employee Details</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedPayslip.staff.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedPayslip.staff.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{selectedPayslip.staff.role?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Wage Type:</span>
                    <span className="detail-value">{selectedPayslip.wageType}</span>
                  </div>
                </div>
              </div>

              {/* Salary Period */}
              <div className="payslip-section">
                <h4>Salary Period</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Period:</span>
                    <span className="detail-value">{selectedPayslip.period}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Working Days:</span>
                    <span className="detail-value">
                      {selectedPayslip.workingDays} {selectedPayslip.wageType === 'Weekly' ? `days/week × ${selectedPayslip.numberOfWeeks} weeks` : 'days'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Daily Rate:</span>
                    <span className="detail-value">₹{(selectedPayslip.dailyRate || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="payslip-section">
                <h4>Earnings</h4>
                <div className="breakdown-table">
                  <div className="breakdown-row">
                    <span>Base Salary</span>
                    <span>₹{(selectedPayslip.basicSalary || 0).toFixed(2)}</span>
                  </div>
                  {(selectedPayslip.medicalAllowance || 0) > 0 && (
                    <div className="breakdown-row">
                      <span>Medical Allowance</span>
                      <span>₹{(selectedPayslip.medicalAllowance || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedPayslip.transportationAllowance || 0) > 0 && (
                    <div className="breakdown-row">
                      <span>Transportation Allowance</span>
                      <span>₹{(selectedPayslip.transportationAllowance || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedPayslip.overtime || 0) > 0 && (
                    <div className="breakdown-row">
                      <span>Overtime</span>
                      <span>₹{(selectedPayslip.overtime || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedPayslip.bonus || 0) > 0 && (
                    <div className="breakdown-row">
                      <span>Bonus</span>
                      <span>₹{(selectedPayslip.bonus || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="breakdown-row total">
                    <span>Gross Salary</span>
                    <span>₹{(selectedPayslip.grossSalary || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="payslip-section">
                <h4>Deductions</h4>
                <div className="breakdown-table">
                  {(selectedPayslip.deductions?.providentFund || 0) > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Provident Fund</span>
                      <span>₹{(selectedPayslip.deductions?.providentFund || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedPayslip.deductions?.professionalTax || 0) > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Professional Tax</span>
                      <span>₹{(selectedPayslip.deductions?.professionalTax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedPayslip.deductions?.incomeTax || 0) > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Income Tax</span>
                      <span>₹{(selectedPayslip.deductions?.incomeTax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedPayslip.deductions?.otherDeductions || 0) > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Other Deductions</span>
                      <span>₹{(selectedPayslip.deductions?.otherDeductions || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedPayslip.totalDeductions || 0) === 0 && (
                    <div className="breakdown-row">
                      <span>No Deductions</span>
                      <span>₹0.00</span>
                    </div>
                  )}
                  {(selectedPayslip.totalDeductions || 0) > 0 && (
                    <div className="breakdown-row total deduction">
                      <span>Total Deductions</span>
                      <span>₹{(selectedPayslip.totalDeductions || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Net Salary */}
              <div className="payslip-net-salary">
                <div className="net-salary-row">
                  <span>Net Salary</span>
                  <span className="net-amount">₹{(selectedPayslip.netSalary || 0).toFixed(2)}</span>
                </div>
                <p className="net-salary-words">
                  (Amount in words: {convertToWords(selectedPayslip.netSalary || 0)} Rupees Only)
                </p>
              </div>

              {/* Footer Note */}
              <div className="payslip-footer">
                <p>This is a computer-generated payslip and does not require a signature.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="btn-secondary"
              >
                <i className="fas fa-print"></i> Print
              </button>
              <button 
                type="button" 
                onClick={() => setShowPayslip(false)} 
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySalary;
