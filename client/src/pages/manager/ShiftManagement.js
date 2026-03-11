import React, { useEffect, useState, useCallback } from 'react';
import AttendanceHistory from '../../components/common/AttendanceHistory';

const ShiftManagement = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    description: '',
    gracePeriod: 5
  });
  const [staffAssignment, setStaffAssignment] = useState({
    shiftId: '',
    staffIds: []
  });
  const [stats, setStats] = useState({});

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0, max = Infinity) => {
    if (value === '') return '';
    const num = parseInt(value);
    if (isNaN(num) || num < min || num > max) return '';
    return value;
  };

  const loadShifts = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts || []);
      }
    } catch (err) {
      console.error('Error loading shifts:', err);
    }
  }, [base, token]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  }, [base, token]);

  const loadAttendance = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/attendance/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
    }
  }, [base, token]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadShifts(), loadStaff(), loadAttendance()]);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadShifts, loadStaff, loadAttendance]);

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token, loadAllData]);

  const validateShiftForm = () => {
    if (!shiftForm.name.trim()) {
      alert('Shift name is required');
      return false;
    }
    if (!shiftForm.startTime) {
      alert('Start time is required');
      return false;
    }
    if (!shiftForm.endTime) {
      alert('End time is required');
      return false;
    }
    if (shiftForm.startTime === shiftForm.endTime) {
      alert('Start time and end time cannot be the same');
      return false;
    }
    if (shiftForm.gracePeriod < 0 || shiftForm.gracePeriod > 60) {
      alert('Grace period must be between 0 and 60 minutes');
      return false;
    }
    return true;
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    if (!validateShiftForm()) return;
    
    try {
      const res = await fetch(`${base}/api/shifts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(shiftForm)
      });
      
      if (res.ok) {
        setShowShiftForm(false);
        setShiftForm({ name: '', startTime: '', endTime: '', description: '', gracePeriod: 5 });
        await loadShifts();
        alert('Shift created successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to create shift');
      }
    } catch (err) {
      console.error('Error creating shift:', err);
      alert('Failed to create shift. Please try again.');
    }
  };

  const handleEditShift = async (e) => {
    e.preventDefault();
    if (!validateShiftForm()) return;
    
    try {
      const res = await fetch(`${base}/api/shifts/${editingShift._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(shiftForm)
      });
      
      if (res.ok) {
        setShowShiftForm(false);
        setEditingShift(null);
        setShiftForm({ name: '', startTime: '', endTime: '', description: '', gracePeriod: 5 });
        await loadShifts();
        alert('Shift updated successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to update shift');
      }
    } catch (err) {
      console.error('Error updating shift:', err);
      alert('Failed to update shift. Please try again.');
    }
  };

  const openEditShift = (shift) => {
    setEditingShift(shift);
    setShiftForm({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      description: shift.description || '',
      gracePeriod: shift.gracePeriod || 5
    });
    setShowShiftForm(true);
  };

  const openCreateShift = () => {
    setEditingShift(null);
    setShiftForm({ name: '', startTime: '', endTime: '', description: '', gracePeriod: 5 });
    setShowShiftForm(true);
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${base}/api/shifts/${shiftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        await loadShifts();
        alert('Shift deleted successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to delete shift');
      }
    } catch (err) {
      console.error('Error deleting shift:', err);
      alert('Failed to delete shift. Please try again.');
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${base}/api/shifts/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(staffAssignment)
      });
      
      if (res.ok) {
        setShowStaffAssignment(false);
        setStaffAssignment({ shiftId: '', staffIds: [] });
        await loadShifts();
        alert('Staff assigned successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to assign staff');
      }
    } catch (err) {
      console.error('Error assigning staff:', err);
      alert('Failed to assign staff. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      present: '#28a745',
      absent: '#dc3545',
      late: '#ffc107',
      half_day: '#17a2b8'
    };
    
    return (
      <span 
        style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '12px', 
          fontWeight: 'bold',
          backgroundColor: statusColors[status] || '#6c757d',
          color: 'white',
          textTransform: 'capitalize'
        }}
      >
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  if (!token) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Shift Management</h2>
        <div style={{ color: 'crimson', marginTop: 8 }}>
          Please log in to access shift management.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Shift Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-primary"
            onClick={openCreateShift}
          >
            Create Shift
          </button>
          <button 
            className="btn btn-outline-primary"
            onClick={() => setShowStaffAssignment(true)}
          >
            Assign Staff
          </button>
          <button 
            className="btn btn-outline-secondary"
            onClick={loadAllData}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16, padding: 12, backgroundColor: '#f8d7da', borderRadius: 4 }}>{error}</div>}

      {/* Stats Cards */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 16, 
          marginBottom: 20 
        }}>
          <div style={{ padding: 16, backgroundColor: '#e3f2fd', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1976d2' }}>
              {stats.totalStaff || 0}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Total Staff</div>
          </div>
          <div style={{ padding: 16, backgroundColor: '#e8f5e8', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>
              {stats.presentToday || 0}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Present Today</div>
          </div>
          <div style={{ padding: 16, backgroundColor: '#ffebee', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#c62828' }}>
              {stats.absentToday || 0}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Absent Today</div>
          </div>
          <div style={{ padding: 16, backgroundColor: '#fff3e0', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f57c00' }}>
              {stats.lateToday || 0}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>Late Today</div>
          </div>
        </div>
      )}

      {/* Shifts List */}
      <div style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 16 }}>Shifts</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div>Loading shifts...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {shifts.map((shift) => (
              <div key={shift._id} style={{ 
                padding: 16, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 8,
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{ marginBottom: 8, color: '#495057' }}>{shift.name}</h4>
                <div style={{ marginBottom: 8 }}>
                  <strong>Time:</strong> {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Grace Period:</strong> {shift.gracePeriod} minutes
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Staff Assigned:</strong> {shift.assignedStaff?.length || 0}
                </div>
                {shift.description && (
                  <div style={{ marginBottom: 12, fontSize: 14, color: '#6c757d' }}>
                    {shift.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setSelectedShift(shift)}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => openEditShift(shift)}
                  >
                    Edit Shift
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteShift(shift._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {shifts.length === 0 && !loading && (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: 40, 
                color: '#6c757d' 
              }}>
                No shifts found. Create a shift to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Today's Attendance */}
      <div style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 16 }}>Today's Attendance</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div>Loading attendance...</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-striped table-hover" style={{ minWidth: 800 }}>
              <thead className="table-dark">
                <tr>
                  <th>Staff Name</th>
                  <th>Role</th>
                  <th>Shift</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, index) => (
                  <tr key={record._id || index}>
                    <td>{record.staff?.name || 'Unknown'}</td>
                    <td>{record.staff?.role || '-'}</td>
                    <td>{record.shift?.name || '-'}</td>
                    <td>{formatTime(record.checkIn)}</td>
                    <td>{formatTime(record.checkOut)}</td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td>{record.location || '-'}</td>
                  </tr>
                ))}
                {attendance.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
                      No attendance records for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance History */}
      <div style={{ marginBottom: 40 }}>
        <AttendanceHistory staffType="all" />
      </div>

      {/* Create Shift Modal */}
      {showShiftForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: 8, 
            maxWidth: 500, 
            width: '90%', 
            maxHeight: '90%', 
            overflow: 'auto' 
          }}>
            <div style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 20 }}>
                {editingShift ? 'Edit Shift' : 'Create New Shift'}
              </h4>
              <form onSubmit={editingShift ? handleEditShift : handleCreateShift}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    Shift Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Morning Shift"
                    required
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                      Start Time *
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={shiftForm.startTime}
                      onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                      End Time *
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={shiftForm.endTime}
                      onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    Grace Period (minutes)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={shiftForm.gracePeriod}
                    onChange={(e) => {
                      const validated = validateNumberInput(e.target.value, 0, 60);
                      setShiftForm(prev => ({ ...prev, gracePeriod: validated === '' ? 5 : parseInt(validated) }));
                    }}
                    min="0"
                    max="60"
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={shiftForm.description}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Shift description..."
                  />
                </div>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowShiftForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingShift ? 'Update Shift' : 'Create Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Shift Details Modal */}
      {selectedShift && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: 8, 
            maxWidth: 600, 
            width: '90%', 
            maxHeight: '90%', 
            overflow: 'auto' 
          }}>
            <div style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 20 }}>Shift Details - {selectedShift.name}</h4>
              
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Start Time</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#495057' }}>{selectedShift.startTime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>End Time</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#495057' }}>{selectedShift.endTime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Grace Period</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#495057' }}>{selectedShift.gracePeriod} minutes</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Assigned Staff</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#495057' }}>{selectedShift.assignedStaff?.length || 0}</div>
                  </div>
                </div>
              </div>

              {selectedShift.description && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Description</div>
                  <div style={{ fontSize: 14, color: '#495057' }}>{selectedShift.description}</div>
                </div>
              )}

              {selectedShift.assignedStaff && selectedShift.assignedStaff.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 8 }}>Assigned Staff</div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 4, padding: 8 }}>
                    {selectedShift.assignedStaff.map((staff, index) => (
                      <div key={staff._id || index} style={{ 
                        padding: 8, 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: 4, 
                        marginBottom: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{staff.name}</div>
                          <div style={{ fontSize: 12, color: '#6c757d' }}>{staff.role}</div>
                        </div>
                        <div style={{ fontSize: 12, color: '#6c757d' }}>
                          {staff.email}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedShift(null)}
                >
                  Close
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    setSelectedShift(null);
                    openEditShift(selectedShift);
                  }}
                >
                  Edit Shift
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setSelectedShift(null);
                    handleDeleteShift(selectedShift._id);
                  }}
                >
                  Delete Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Assignment Modal */}
      {showStaffAssignment && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: 8, 
            maxWidth: 600, 
            width: '90%', 
            maxHeight: '90%', 
            overflow: 'auto' 
          }}>
            <div style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 20 }}>Assign Staff to Shift</h4>
              <form onSubmit={handleAssignStaff}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    Select Shift *
                  </label>
                  <select
                    className="form-control"
                    value={staffAssignment.shiftId}
                    onChange={(e) => setStaffAssignment(prev => ({ ...prev, shiftId: e.target.value }))}
                    required
                  >
                    <option value="">Choose a shift</option>
                    {shifts.map(shift => (
                      <option key={shift._id} value={shift._id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    Select Staff *
                  </label>
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 4, padding: 8 }}>
                    {staff.map(staffMember => (
                      <div key={staffMember._id} style={{ marginBottom: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={staffAssignment.staffIds.includes(staffMember._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStaffAssignment(prev => ({
                                  ...prev,
                                  staffIds: [...prev.staffIds, staffMember._id]
                                }));
                              } else {
                                setStaffAssignment(prev => ({
                                  ...prev,
                                  staffIds: prev.staffIds.filter(id => id !== staffMember._id)
                                }));
                              }
                            }}
                          />
                          <span>{staffMember.name} ({staffMember.role})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowStaffAssignment(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!staffAssignment.shiftId || staffAssignment.staffIds.length === 0}
                  >
                    Assign Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
