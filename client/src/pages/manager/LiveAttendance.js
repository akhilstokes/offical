import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './LiveAttendance.css';

const LiveAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, present, absent, late, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const res = await axios.get('/api/attendance/today-all', {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: selectedDate }
      });

      if (res.data.success) {
        setAttendanceData(res.data.attendance || []);
      } else {
        setAttendanceData([]);
      }
    } catch (err) {
      setError('Failed to load attendance history');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn) return '-';
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diff = Math.floor((end - start) / (1000 * 60));
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const getStatusBadge = (record) => {
    if (!record.checkIn) {
      return { class: 'absent', text: 'Absent', icon: 'fa-times-circle' };
    }
    if (record.checkIn && record.checkOut) {
      return { class: 'checked-out', text: 'Completed', icon: 'fa-check-double' };
    }
    if (record.isLate) {
      return { class: 'late', text: `Late (${record.lateMinutes || 0}m)`, icon: 'fa-clock' };
    }
    return { class: 'checked-in', text: 'Present', icon: 'fa-check-circle' };
  };

  const filteredData = useMemo(() => {
    return attendanceData.filter(record => {
      // Exclude users with role "user" and "manager" - only show staff
      if (record.staff?.role === 'user' || record.staff?.role === 'manager') {
        return false;
      }

      let matchesFilter = true;

      if (filter === 'present') {
        matchesFilter = record.checkIn && !record.checkOut;
      } else if (filter === 'completed') {
        matchesFilter = record.checkIn && record.checkOut;
      } else if (filter === 'absent') {
        matchesFilter = !record.checkIn;
      } else if (filter === 'late') {
        matchesFilter = record.checkIn && record.isLate;
      }

      const search = searchTerm.toLowerCase();
      const matchesSearch =
        record.staff?.name?.toLowerCase().includes(search) ||
        record.staff?.staffId?.toLowerCase().includes(search) ||
        record.staff?.email?.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [attendanceData, filter, searchTerm]);

  const stats = useMemo(() => {
    // Filter out users with role "user" and "manager" for stats calculation
    const staffOnly = attendanceData.filter(r => 
      r.staff?.role !== 'user' && r.staff?.role !== 'manager'
    );
    return {
      total: staffOnly.length,
      present: staffOnly.filter(r => r.checkIn && !r.checkOut).length,
      completed: staffOnly.filter(r => r.checkIn && r.checkOut).length,
      late: staffOnly.filter(r => r.checkIn && r.isLate).length,
      absent: staffOnly.filter(r => !r.checkIn).length
    };
  }, [attendanceData]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
        Loading attendance history...
      </div>
    );
  }

  return (
    <div className="live-attendance-container">
      <div className="live-attendance-header">
        <div>
          <h1>Attendance History</h1>
          <p>All staff attendance for the selected date</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon"><i className="fas fa-users"></i></div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Staff</div>
          </div>
        </div>
        <div className="stat-card present">
          <div className="stat-icon"><i className="fas fa-user-check"></i></div>
          <div className="stat-content">
            <div className="stat-value">{stats.present}</div>
            <div className="stat-label">Present</div>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon"><i className="fas fa-check-double"></i></div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card late">
          <div className="stat-icon"><i className="fas fa-clock"></i></div>
          <div className="stat-content">
            <div className="stat-value">{stats.late}</div>
            <div className="stat-label">Late</div>
          </div>
        </div>
        <div className="stat-card absent">
          <div className="stat-icon"><i className="fas fa-user-times"></i></div>
          <div className="stat-content">
            <div className="stat-value">{stats.absent}</div>
            <div className="stat-label">Absent</div>
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search staff by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
            <option value="all">All Records</option>
            <option value="present">Present Only</option>
            <option value="completed">Completed Shifts</option>
            <option value="late">Late Arrivals</option>
            <option value="absent">Absent</option>
          </select>
          <button onClick={fetchAttendance} className="btn-refresh">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No attendance records found for this date
                </td>
              </tr>
            ) : (
              filteredData.map((r, i) => {
                const badge = getStatusBadge(r);
                return (
                  <tr key={r._id || `absent-${r.staff?._id || i}`} className={!r._id ? 'absent-row' : ''}>
                    <td>{r.staff?.name}</td>
                    <td>{r.staff?.role}</td>
                    <td>{formatTime(r.checkIn)}</td>
                    <td>{formatTime(r.checkOut)}</td>
                    <td>{calculateWorkingHours(r.checkIn, r.checkOut)}</td>
                    <td>
                      <span className={`status-badge ${badge.class}`}>
                        <i className={`fas ${badge.icon}`}></i> {badge.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveAttendance;
