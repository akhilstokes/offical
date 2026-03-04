import React, { useState, useEffect } from 'react';
import './ShiftModal.css';

const ShiftModal = ({ isOpen, onClose, shift, date, assignments, onSave }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    staff: '',
    notes: '',
    status: 'scheduled'
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isOpen) {
      fetchStaffList();
    }
  }, [isOpen]);

  const fetchStaffList = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch staff from all three roles
      const roles = ['field_staff', 'lab_staff', 'delivery_staff'];
      const staffPromises = roles.map(role =>
        fetch(`${API_BASE}/api/user-management/staff?role=${role}&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.ok ? res.json() : { users: [] })
      );

      const results = await Promise.all(staffPromises);
      
      // Combine all staff from different roles
      const allStaff = results.reduce((acc, result) => {
        return [...acc, ...(result.users || [])];
      }, []);

      // Remove duplicates based on _id
      const uniqueStaff = allStaff.filter((staff, index, self) =>
        index === self.findIndex(s => s._id === staff._id)
      );

      setStaffList(uniqueStaff);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  const handleAssignStaff = async () => {
    if (!assignmentForm.staff) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/shift-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shift: shift._id,
          staff: assignmentForm.staff,
          date: date.toISOString().split('T')[0],
          notes: assignmentForm.notes,
          status: assignmentForm.status
        })
      });

      if (response.ok) {
        const newAssignment = await response.json();
        if (onSave) onSave(newAssignment);
        setAssignmentForm({ staff: '', notes: '', status: 'scheduled' });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to assign staff');
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Failed to assign staff');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/shift-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        if (onSave) onSave({ removed: assignmentId });
      } else {
        alert('Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId, newStatus) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/shift-assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedAssignment = await response.json();
        if (onSave) onSave(updatedAssignment);
      } else {
        alert('Failed to update assignment status');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#3b82f6',
      confirmed: '#10b981',
      in_progress: '#f59e0b',
      completed: '#059669',
      cancelled: '#ef4444',
      no_show: '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: 'fa-calendar',
      confirmed: 'fa-check-circle',
      in_progress: 'fa-clock',
      completed: 'fa-check-double',
      cancelled: 'fa-times-circle',
      no_show: 'fa-user-times'
    };
    return icons[status] || 'fa-question-circle';
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvailableStaff = () => {
    const assignedStaffIds = assignments.map(a => a.staff._id);
    return staffList.filter(staff => !assignedStaffIds.includes(staff._id));
  };

  if (!isOpen || !shift) return null;

  return (
    <div className="shift-modal-overlay" onClick={onClose}>
      <div className="shift-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h2>{shift.name}</h2>
            <p>{date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-info-circle"></i>
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <i className="fas fa-users"></i>
            Assignments ({assignments.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'assign' ? 'active' : ''}`}
            onClick={() => setActiveTab('assign')}
          >
            <i className="fas fa-user-plus"></i>
            Assign Staff
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="shift-info-grid">
                <div className="info-card">
                  <div className="info-label">Time</div>
                  <div className="info-value">
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Duration</div>
                  <div className="info-value">{shift.durationHours} hours</div>
                </div>

                <div className="info-card">
                  <div className="info-label">Category</div>
                  <div className="info-value">{shift.category}</div>
                </div>

                <div className="info-card">
                  <div className="info-label">Type</div>
                  <div className="info-value">{shift.type}</div>
                </div>

                <div className="info-card">
                  <div className="info-label">Staff Capacity</div>
                  <div className="info-value">
                    {assignments.length} / {shift.maxStaff}
                    <div className="capacity-bar">
                      <div 
                        className="capacity-fill"
                        style={{ 
                          width: `${(assignments.length / shift.maxStaff) * 100}%`,
                          backgroundColor: assignments.length >= shift.maxStaff ? '#10b981' : '#3b82f6'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-label">Location</div>
                  <div className="info-value">{shift.location}</div>
                </div>

                <div className="info-card">
                  <div className="info-label">Department</div>
                  <div className="info-value">{shift.department}</div>
                </div>

                {shift.supervisor && (
                  <div className="info-card">
                    <div className="info-label">Supervisor</div>
                    <div className="info-value">{shift.supervisor.name}</div>
                  </div>
                )}
              </div>

              {shift.description && (
                <div className="shift-description">
                  <h4>Description</h4>
                  <p>{shift.description}</p>
                </div>
              )}

              {shift.specialRequirements && (
                <div className="special-requirements">
                  <h4>Special Requirements</h4>
                  <p>{shift.specialRequirements}</p>
                </div>
              )}

              {shift.breaks && shift.breaks.length > 0 && (
                <div className="shift-breaks">
                  <h4>Breaks</h4>
                  <div className="breaks-list">
                    {shift.breaks.map((breakItem, index) => (
                      <div key={index} className="break-item">
                        <span className="break-name">{breakItem.name}</span>
                        <span className="break-time">
                          {formatTime(breakItem.startTime)} - {formatTime(breakItem.endTime)}
                        </span>
                        <span className={`break-type ${breakItem.isPaid ? 'paid' : 'unpaid'}`}>
                          {breakItem.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="assignments-tab">
              {assignments.length === 0 ? (
                <div className="no-assignments">
                  <i className="fas fa-user-slash"></i>
                  <h3>No Staff Assigned</h3>
                  <p>No staff members have been assigned to this shift yet.</p>
                </div>
              ) : (
                <div className="assignments-list">
                  {assignments.map((assignment) => (
                    <div key={assignment._id} className="assignment-card">
                      <div className="assignment-header">
                        <div className="staff-info">
                          <div className="staff-avatar">
                            {assignment.staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="staff-details">
                            <div className="staff-name">{assignment.staff.name}</div>
                            <div className="staff-email">{assignment.staff.email}</div>
                          </div>
                        </div>

                        <div className="assignment-status">
                          <div 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(assignment.status) }}
                          >
                            <i className={`fas ${getStatusIcon(assignment.status)}`}></i>
                            {assignment.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="assignment-details">
                        {assignment.notes && (
                          <div className="assignment-notes">
                            <strong>Notes:</strong> {assignment.notes}
                          </div>
                        )}

                        {assignment.attendance.checkedIn && (
                          <div className="attendance-info">
                            <div className="attendance-item">
                              <i className="fas fa-sign-in-alt"></i>
                              Check-in: {new Date(assignment.attendance.checkInTime).toLocaleTimeString()}
                            </div>
                            {assignment.attendance.checkedOut && (
                              <div className="attendance-item">
                                <i className="fas fa-sign-out-alt"></i>
                                Check-out: {new Date(assignment.attendance.checkOutTime).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="assignment-actions">
                        <select
                          value={assignment.status}
                          onChange={(e) => updateAssignmentStatus(assignment._id, e.target.value)}
                          disabled={loading}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No Show</option>
                        </select>

                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveAssignment(assignment._id)}
                          disabled={loading}
                        >
                          <i className="fas fa-trash"></i>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assign Staff Tab */}
          {activeTab === 'assign' && (
            <div className="assign-tab">
              <div className="assign-form">
                <h4>Assign New Staff Member</h4>
                
                <div className="form-group">
                  <label>Filter by Staff Name</label>
                  <select
                    value={assignmentForm.staff}
                    onChange={(e) => setAssignmentForm({...assignmentForm, staff: e.target.value})}
                  >
                    <option value="">Select staff member...</option>
                    {getAvailableStaff().map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={assignmentForm.status}
                    onChange={(e) => setAssignmentForm({...assignmentForm, status: e.target.value})}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={assignmentForm.notes}
                    onChange={(e) => setAssignmentForm({...assignmentForm, notes: e.target.value})}
                    placeholder="Add any special notes or instructions..."
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="assign-btn"
                    onClick={handleAssignStaff}
                    disabled={!assignmentForm.staff || loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus"></i>
                        Assign Staff
                      </>
                    )}
                  </button>
                </div>
              </div>

              {assignments.length >= shift.maxStaff && (
                <div className="capacity-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  <strong>Shift at Full Capacity</strong>
                  <p>This shift has reached its maximum capacity of {shift.maxStaff} staff members.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;