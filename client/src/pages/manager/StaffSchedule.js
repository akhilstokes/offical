import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffSchedule.css';

const StaffSchedule = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 6); // 7 days total (including start date)
    return date.toISOString().split('T')[0];
  });
  const [selectAll, setSelectAll] = useState(false);
  const [schedules, setSchedules] = useState({});
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    staffId: '',
    shift: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/all-staff', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStaff(response.data.staff);
        // Initialize schedules state
        const initialSchedules = {};
        response.data.staff.forEach(s => {
          initialSchedules[s._id] = {
            selected: false,
            shift: 'morning'
          };
        });
        setSchedules(initialSchedules);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    
    const updatedSchedules = { ...schedules };
    Object.keys(updatedSchedules).forEach(staffId => {
      updatedSchedules[staffId].selected = checked;
    });
    setSchedules(updatedSchedules);
  };

  const handleStaffSelect = (staffId, checked) => {
    setSchedules(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        selected: checked
      }
    }));
  };

  const handleShiftChange = (staffId, shift) => {
    setSchedules(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        shift: shift
      }
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      // Validation
      if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        alert('Start date must be before or equal to end date');
        return;
      }

      const selectedCount = Object.values(schedules).filter(s => s.selected).length;
      if (selectedCount === 0) {
        alert('Please select at least one staff member');
        return;
      }

      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Calculate all dates in the week range
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      // Prepare schedule data for selected staff for all dates in the week
      const scheduleData = [];
      Object.entries(schedules)
        .filter(([_, data]) => data.selected)
        .forEach(([staffId, data]) => {
          dates.forEach(date => {
            scheduleData.push({
              staffId,
              date,
              shift: data.shift
            });
          });
        });

      const response = await axios.post(
        'http://localhost:5000/api/manager/schedule/bulk-assign',
        { schedules: scheduleData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const dayCount = dates.length;
        const staffCount = Object.values(schedules).filter(s => s.selected).length;
        alert(`Schedule saved successfully for ${staffCount} staff member(s) across ${dayCount} day(s)!`);
        // Reset selections
        setSelectAll(false);
        const resetSchedules = { ...schedules };
        Object.keys(resetSchedules).forEach(staffId => {
          resetSchedules[staffId].selected = false;
        });
        setSchedules(resetSchedules);
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (historyFilters.startDate) params.append('startDate', historyFilters.startDate);
      if (historyFilters.endDate) params.append('endDate', historyFilters.endDate);
      if (historyFilters.staffId) params.append('staffId', historyFilters.staffId);
      if (historyFilters.shift) params.append('shift', historyFilters.shift);

      const response = await axios.get(
        `http://localhost:5000/api/manager/schedule/history?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setHistoryData(response.data.schedules);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      alert('Failed to load schedule history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setHistoryFilters({
      startDate: '',
      endDate: '',
      staffId: '',
      shift: ''
    });
  };

  const handleHistoryFilterChange = (field, value) => {
    setHistoryFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyHistoryFilters = () => {
    fetchHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      'field_staff': 'role-field',
      'delivery_staff': 'role-delivery',
      'lab_staff': 'role-lab',
      'manager': 'role-manager',
      'accountant': 'role-accountant',
      'staff': 'role-staff'
    };
    return roleMap[role] || 'role-default';
  };

  const formatRole = (role) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="schedule-container">
        <div className="loading-state">Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h1 className="schedule-title">Staff Schedule Management</h1>
        <p className="schedule-subtitle">Assign shifts to staff members</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      <div className="schedule-controls">
        <div className="control-group">
          <label className="control-label">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="control-group">
          <label className="control-label">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="select-all-control">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="checkbox-input"
            />
            <span className="checkbox-text">Select All Staff</span>
          </label>
        </div>

        <button
          onClick={handleSaveSchedule}
          disabled={saving}
          className="btn-save-schedule"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>

        <button
          onClick={handleShowHistory}
          className="btn-history"
        >
          History
        </button>
      </div>

      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Staff Name</th>
              <th>Role</th>
              <th>Shift</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  No staff members found
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member._id} className={schedules[member._id]?.selected ? 'row-selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={schedules[member._id]?.selected || false}
                      onChange={(e) => handleStaffSelect(member._id, e.target.checked)}
                      className="checkbox-input"
                    />
                  </td>
                  <td className="staff-name">{member.name}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                      {formatRole(member.role)}
                    </span>
                  </td>
                  <td>
                    <div className="shift-selector">
                      <label className="shift-option">
                        <input
                          type="radio"
                          name={`shift-${member._id}`}
                          value="morning"
                          checked={schedules[member._id]?.shift === 'morning'}
                          onChange={() => handleShiftChange(member._id, 'morning')}
                          disabled={!schedules[member._id]?.selected}
                        />
                        <span>Morning</span>
                      </label>
                      <label className="shift-option">
                        <input
                          type="radio"
                          name={`shift-${member._id}`}
                          value="evening"
                          checked={schedules[member._id]?.shift === 'evening'}
                          onChange={() => handleShiftChange(member._id, 'evening')}
                          disabled={!schedules[member._id]?.selected}
                        />
                        <span>Evening</span>
                      </label>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="schedule-summary">
        <div className="summary-card">
          <span className="summary-label">Total Staff:</span>
          <span className="summary-value">{staff.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Selected:</span>
          <span className="summary-value">
            {Object.values(schedules).filter(s => s.selected).length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Morning Shift:</span>
          <span className="summary-value">
            {Object.values(schedules).filter(s => s.selected && s.shift === 'morning').length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Evening Shift:</span>
          <span className="summary-value">
            {Object.values(schedules).filter(s => s.selected && s.shift === 'evening').length}
          </span>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="history-modal-overlay" onClick={handleCloseHistory}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h2>Schedule History</h2>
              <button className="close-btn" onClick={handleCloseHistory}>×</button>
            </div>

            <div className="history-filters">
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={historyFilters.startDate}
                  onChange={(e) => handleHistoryFilterChange('startDate', e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={historyFilters.endDate}
                  onChange={(e) => handleHistoryFilterChange('endDate', e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Staff</label>
                <select
                  value={historyFilters.staffId}
                  onChange={(e) => handleHistoryFilterChange('staffId', e.target.value)}
                  className="filter-input"
                >
                  <option value="">All Staff</option>
                  {staff.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Shift</label>
                <select
                  value={historyFilters.shift}
                  onChange={(e) => handleHistoryFilterChange('shift', e.target.value)}
                  className="filter-input"
                >
                  <option value="">All Shifts</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="full-day">Full Day</option>
                  <option value="night">Night</option>
                </select>
              </div>
              <button 
                onClick={handleApplyHistoryFilters}
                className="btn-apply-filters"
                disabled={historyLoading}
              >
                {historyLoading ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>

            <div className="history-content">
              {historyLoading ? (
                <div className="history-loading">Loading history...</div>
              ) : historyData.length === 0 ? (
                <div className="history-empty">No schedule history found</div>
              ) : (
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Staff Name</th>
                        <th>Role</th>
                        <th>Shift</th>
                        <th>Status</th>
                        <th>Assigned By</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((record) => (
                        <tr key={record._id}>
                          <td>{formatDate(record.date)}</td>
                          <td>{record.staffName}</td>
                          <td>
                            <span className={`role-badge ${getRoleBadgeClass(record.staffRole)}`}>
                              {formatRole(record.staffRole)}
                            </span>
                          </td>
                          <td>
                            <span className="shift-badge">{record.shift}</span>
                          </td>
                          <td>
                            <span className={`status-badge status-${record.status}`}>
                              {record.status}
                            </span>
                          </td>
                          <td>{record.assignedBy?.name || 'N/A'}</td>
                          <td className="date-time">{formatDateTime(record.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="history-footer">
              <p>Total Records: {historyData.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSchedule;
