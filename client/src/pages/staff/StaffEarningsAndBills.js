import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import './StaffEarningsAndBills.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const StaffEarningsAndBills = () => {
  const [dailyRate, setDailyRate] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [attendance, setAttendance] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('earnings');
  const [workerInfo, setWorkerInfo] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDailyEarnings(),
        loadSalaryRecords()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyEarnings = async () => {
    try {
      // Get salary info with daily rate
      const salaryRes = await fetch(`${API}/api/salary/my-salary`, {
        headers: authHeaders()
      });

      let salaryData = null;
      if (salaryRes.ok) {
        const resJson = await salaryRes.json();
        // Assuming the endpoint returns { success: true, worker: ..., data: [...] }
        salaryData = resJson;
        setWorkerInfo(resJson.worker || null);
        setDailyRate(resJson.worker?.dailyWage || 0);
      }

      // Get attendance for earnings calculation
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const attendanceRes = await fetch(
        `${API}/api/attendance/history`,
        { headers: authHeaders() }
      );

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        const records = attendanceData.data || [];
        
        // Filter for current month
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate >= firstDayOfMonth && recordDate <= today;
        });
        
        setAttendance(monthRecords);

        // Calculate earnings
        const rate = salaryData?.worker?.dailyWage || 0;
        
        // Today's earnings
        const todayRecord = monthRecords.find(r => {
          const recordDate = new Date(r.date);
          return recordDate.toDateString() === today.toDateString();
        });
        setTodayEarnings(todayRecord ? rate : 0);

        // Week earnings
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        const weekRecords = monthRecords.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate >= firstDayOfWeek;
        });
        setWeekEarnings(weekRecords.length * rate);

        // Month earnings
        setMonthEarnings(monthRecords.length * rate);
      }
    } catch (err) {
      console.error('Error loading earnings:', err);
    }
  };

  const loadSalaryRecords = async () => {
    try {
      const res = await fetch(`${API}/api/salary/my-salary`, {
        headers: authHeaders()
      });

      if (res.ok) {
        const response = await res.json();
        setSalaries(response.data || []);
      }
    } catch (err) {
      console.error('Error loading salary records:', err);
    }
  };

  const downloadPayslip = (salary) => {
    const doc = new jsPDF();
    const monthName = getMonthName(salary.month);
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text('HOLY FAMILY POLYMERS', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`PAYSLIP - ${monthName.toUpperCase()} ${salary.year}`, 105, 30, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Employee Info
    doc.setFontSize(12);
    doc.text(`Employee Name: ${workerInfo?.name || 'Staff Member'}`, 20, 45);
    doc.text(`Staff ID: ${workerInfo?.staffId || 'N/A'}`, 20, 52);
    doc.text(`Period: ${monthName} ${salary.year}`, 140, 45);
    doc.text(`Status: ${salary.status?.toUpperCase()}`, 140, 52);
    
    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 65, 170, 10, 'F');
    doc.text('Description', 25, 72);
    doc.text('Amount (INR)', 150, 72);
    
    // Salary Breakdown
    let y = 85;
    const addRow = (label, value, isDeduction = false) => {
      doc.text(label, 25, y);
      const amountStr = isDeduction ? `-${value.toFixed(2)}` : value.toFixed(2);
      doc.text(amountStr, 150, y);
      y += 10;
    };
    
    addRow('Basic Salary (Based on Attendance)', salary.basicSalary || 0);
    addRow('Medical Allowance', salary.medicalAllowance || 0);
    addRow('Transportation Allowance', salary.transportationAllowance || 0);
    addRow('Overtime Pay', salary.overtime || 0);
    addRow('Bonus', salary.bonus || 0);
    
    doc.setFont(undefined, 'bold');
    addRow('Gross Salary', salary.grossSalary || 0);
    doc.setFont(undefined, 'normal');
    
    y += 5;
    doc.text('Deductions:', 25, y);
    y += 10;
    
    addRow('Income Tax', salary.deductions?.tax || 0, true);
    addRow('Provident Fund', salary.deductions?.providentFund || 0, true);
    addRow('Professional Tax', salary.deductions?.professionalTax || 0, true);
    addRow('Other Deductions', salary.deductions?.other || 0, true);
    
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('NET PAYABLE', 25, y);
    doc.text(`INR ${salary.netSalary?.toFixed(2)}`, 150, y);
    
    // Footer
    y = 250;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('This is a computer generated payslip and does not require a signature.', 105, y, { align: 'center' });
    doc.text('Holy Family Polymers - Industrial Estate, Kerala', 105, y + 7, { align: 'center' });
    
    doc.save(`Payslip_${monthName}_${salary.year}.pdf`);
    toast.success('Payslip downloaded successfully');
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
    <div className="staff-earnings-page">
      <div className="page-header">
        <h1>💰 My Earnings & Salary</h1>
        <p>Track your daily earnings and salary payments</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          <i className="fas fa-coins"></i> Daily Earnings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          <i className="fas fa-file-invoice-dollar"></i> Salary Bills
        </button>
        <button 
          className={`tab-btn ${activeTab === 'banking' ? 'active' : ''}`}
          onClick={() => setActiveTab('banking')}
        >
          <i className="fas fa-university"></i> Banking Details
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your data...</p>
        </div>
      ) : (
        <>
          {/* DAILY EARNINGS TAB */}
          {activeTab === 'earnings' && (
            <div className="earnings-section">
              {/* Daily Rate Card */}
              <div className="rate-card">
                <div className="rate-icon">
                  <i className="fas fa-rupee-sign"></i>
                </div>
                <div className="rate-info">
                  <h3>Your Daily Rate</h3>
                  <p className="rate-amount">₹{dailyRate.toFixed(2)}</p>
                  <span className="rate-label">Per Working Day</span>
                </div>
              </div>

              {/* Earnings Summary Cards */}
              <div className="earnings-grid">
                <div className="earning-card today">
                  <div className="earning-icon">
                    <i className="fas fa-calendar-day"></i>
                  </div>
                  <div className="earning-details">
                    <h4>Today's Earnings</h4>
                    <p className="earning-amount">₹{todayEarnings.toFixed(2)}</p>
                    <span className="earning-label">
                      {todayEarnings > 0 ? 'Present' : 'Not marked yet'}
                    </span>
                  </div>
                </div>

                <div className="earning-card week">
                  <div className="earning-icon">
                    <i className="fas fa-calendar-week"></i>
                  </div>
                  <div className="earning-details">
                    <h4>This Week</h4>
                    <p className="earning-amount">₹{weekEarnings.toFixed(2)}</p>
                    <span className="earning-label">
                      {dailyRate > 0 ? `${Math.floor(weekEarnings / dailyRate)} days worked` : '0 days'}
                    </span>
                  </div>
                </div>

                <div className="earning-card month">
                  <div className="earning-icon">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="earning-details">
                    <h4>This Month</h4>
                    <p className="earning-amount">₹{monthEarnings.toFixed(2)}</p>
                    <span className="earning-label">
                      {dailyRate > 0 ? `${Math.floor(monthEarnings / dailyRate)} days worked` : '0 days'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Attendance */}
              <div className="attendance-card">
                <div className="card-header">
                  <h2>📅 Recent Attendance</h2>
                  <button onClick={loadDailyEarnings} className="refresh-btn">
                    <i className="fas fa-sync-alt"></i> Refresh
                  </button>
                </div>

                {attendance.length > 0 ? (
                  <div className="attendance-list">
                    {attendance.slice(0, 10).map((record) => (
                      <div key={record._id} className="attendance-item">
                        <div className="attendance-date">
                          <i className="fas fa-calendar"></i>
                          <span>{new Date(record.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}</span>
                        </div>
                        <div className="attendance-time">
                          <i className="fas fa-clock"></i>
                          <span>
                            {record.checkInAt 
                              ? new Date(record.checkInAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </span>
                        </div>
                        <div className="attendance-earning">
                          <i className="fas fa-rupee-sign"></i>
                          <span>₹{dailyRate.toFixed(2)}</span>
                        </div>
                        <div className={`attendance-status ${record.status}`}>
                          {record.status || 'present'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-calendar-times"></i>
                    <p>No attendance records found</p>
                    <span>Your attendance will appear here</span>
                  </div>
                )}
              </div>

              {/* Payment Summary - Navigation Button Only */}
              <div className="history-action-container">
                <button className="full-history-btn" onClick={() => setActiveTab('bills')}>
                  <i className="fas fa-history"></i> View Full Payment History
                </button>
              </div>
            </div>
          )}

          {/* SALARY BILLS TAB */}
          {activeTab === 'bills' && (
            <div className="bills-section">
              <div className="bills-card">
                <div className="card-header">
                  <h2>💵 Salary Payment History</h2>
                  <button onClick={loadSalaryRecords} className="refresh-btn">
                    <i className="fas fa-sync-alt"></i> Refresh
                  </button>
                </div>

                {salaries.length > 0 ? (
                  <div className="salary-table-wrapper">
                    <table className="salary-table">
                      <thead>
                        <tr>
                          <th>PERIOD</th>
                          <th>WORKING DAYS</th>
                          <th>GROSS SALARY</th>
                          <th>DEDUCTIONS</th>
                          <th>NET PAY</th>
                          <th>STATUS</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaries.map((salary) => (
                          <tr key={salary._id} className={`salary-row ${salary.status}`}>
                            <td>
                              <div className="period-cell">
                                <span className="month-badge">{getMonthName(salary.month)}</span>
                                <span className="year-text">{salary.year}</span>
                              </div>
                            </td>
                            <td className="days-cell">
                              <i className="fas fa-calendar-check"></i>
                              {salary.presentDays || salary.totalDays || 0} days
                            </td>
                            <td className="amount-cell gross">
                              ₹{salary.grossSalary?.toFixed(2) || '0.00'}
                            </td>
                            <td className="amount-cell deduction">
                              -₹{salary.totalDeductions?.toFixed(2) || '0.00'}
                            </td>
                            <td className="amount-cell net">
                              <strong>₹{salary.netSalary?.toFixed(2) || '0.00'}</strong>
                            </td>
                            <td>
                              <span className={`status-badge ${getStatusBadge(salary.status)}`}>
                                {salary.status?.toUpperCase() || 'PENDING'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="download-payslip-btn"
                                onClick={() => downloadPayslip(salary)}
                                title="Download PDF Payslip"
                              >
                                <i className="fas fa-download"></i> Payslip
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
                    <p>No salary bills found</p>
                    <span>Your salary bills will appear here once generated by the accountant</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BANKING DETAILS TAB */}
          {activeTab === 'banking' && (
            <div className="banking-section">
              <div className="banking-card">
                <div className="card-header">
                  <h2>🏦 Banking Information</h2>
                  <p className="banking-subtitle">Your registered bank account for salary payments</p>
                </div>
                
                <div className="banking-content">
                  <div className="bank-info-grid">
                    <div className="bank-info-item">
                      <span className="info-label">Bank Name</span>
                      <span className="info-value">State Bank of India</span>
                    </div>
                    <div className="bank-info-item">
                      <span className="info-label">Account Holder</span>
                      <span className="info-value">{workerInfo?.name || 'Morni Bagama'}</span>
                    </div>
                    <div className="bank-info-item">
                      <span className="info-label">Account Number</span>
                      <span className="info-value">XXXX-XXXX-4582</span>
                    </div>
                    <div className="bank-info-item">
                      <span className="info-label">IFSC Code</span>
                      <span className="info-value">SBIN0001234</span>
                    </div>
                    <div className="bank-info-item">
                      <span className="info-label">Branch</span>
                      <span className="info-value">Industrial Estate, Palakkad</span>
                    </div>
                    <div className="bank-info-item">
                      <span className="info-label">Payment Status</span>
                      <span className="info-value verified">
                        <i className="fas fa-check-circle"></i> Verified for NEFT/UPI
                      </span>
                    </div>
                  </div>
                  
                  <div className="banking-notice">
                    <i className="fas fa-info-circle"></i>
                    <p>To change your banking details, please contact the HR or Accountant office with your original passbook and ID proof.</p>
                  </div>
                </div>
              </div>

              <div className="payout-preferences">
                <h3>🔔 Payout Preferences</h3>
                <div className="preference-item">
                  <div className="pref-label">
                    <span>SMS Notifications</span>
                    <p>Get alerted when salary is credited</p>
                  </div>
                  <div className="pref-toggle active">Enabled</div>
                </div>
                <div className="preference-item">
                  <div className="pref-label">
                    <span>Email Payslip</span>
                    <p>Receive PDF payslip on registered email</p>
                  </div>
                  <div className="pref-toggle active">Enabled</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StaffEarningsAndBills;