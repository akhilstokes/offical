import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
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

      if (salaryRes.ok) {
        const salaryData = await salaryRes.json();
        setDailyRate(salaryData.dailyRate || 0);
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
        const rate = salaryData?.dailyRate || 0;
        
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
                      {Math.floor(weekEarnings / dailyRate)} days worked
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
                      {Math.floor(monthEarnings / dailyRate)} days worked
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
                          <th>PAYMENT DATE</th>
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
                            <td className="date-cell">
                              {salary.paymentDate 
                                ? new Date(salary.paymentDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
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
                    <p>No salary bills found</p>
                    <span>Your salary bills will appear here once generated by the accountant</span>
                  </div>
                )}
              </div>

              {/* Summary Card */}
              {salaries.length > 0 && (
                <div className="summary-card">
                  <h3>💼 Payment Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Total Paid</span>
                      <span className="summary-value paid">
                        ₹{salaries
                          .filter(s => s.status === 'paid')
                          .reduce((sum, s) => sum + (s.netSalary || 0), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Pending</span>
                      <span className="summary-value pending">
                        ₹{salaries
                          .filter(s => s.status === 'pending' || s.status === 'approved')
                          .reduce((sum, s) => sum + (s.netSalary || 0), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Bills</span>
                      <span className="summary-value">{salaries.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StaffEarningsAndBills;
