import React, { useEffect, useState } from 'react';
import './ComplaintManagement.css';

const ComplaintManagement = () => {
  const [activeTab, setActiveTab] = useState('staff');
  const [attendanceData, setAttendanceData] = useState([]);
  const [staffComplaints, setStaffComplaints] = useState([]);
  const [userComplaints, setUserComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'staff') {
        // Fetch attendance data - use /all endpoint with manager auth
        try {
          const attendanceResponse = await fetch(`${API_BASE}/api/attendance/all`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (attendanceResponse.ok) {
            const result = await attendanceResponse.json();
            const data = result.data || result.attendance || result;
            setAttendanceData(Array.isArray(data) ? data : []);
          } else {
            console.warn('Failed to load attendance:', attendanceResponse.status);
            setAttendanceData([]);
          }
        } catch (err) {
          console.error('Error loading attendance:', err);
          setAttendanceData([]);
        }

        // Fetch staff complaints - use /all endpoint
        try {
          const complaintsResponse = await fetch(`${API_BASE}/api/complaints/all`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (complaintsResponse.ok) {
            const result = await complaintsResponse.json();
            const data = result.data || result.complaints || result;
            setStaffComplaints(Array.isArray(data) ? data : []);
          } else {
            console.warn('Failed to load complaints:', complaintsResponse.status);
            setStaffComplaints([]);
          }
        } catch (err) {
          console.error('Error loading complaints:', err);
          setStaffComplaints([]);
        }
      } else {
        // Fetch user complaints - use /all endpoint
        try {
          const userComplaintsResponse = await fetch(`${API_BASE}/api/complaints/all`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (userComplaintsResponse.ok) {
            const result = await userComplaintsResponse.json();
            const data = result.data || result.complaints || result;
            setUserComplaints(Array.isArray(data) ? data : []);
          } else {
            console.warn('Failed to load user complaints:', userComplaintsResponse.status);
            setUserComplaints([]);
          }
        } catch (err) {
          console.error('Error loading user complaints:', err);
          setUserComplaints([]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAttendance = async (id, action) => {
    try {
      // Correct endpoint: PUT /api/attendance/:id/verify or POST /api/attendance/:id/approve
      const endpoint = action === 'verify' 
        ? `${API_BASE}/api/attendance/${id}/verify`
        : `${API_BASE}/api/attendance/${id}/approve`;
      
      const method = action === 'verify' ? 'PUT' : 'POST';
      
      // Prepare request body
      const body = action === 'approve' 
        ? { status: 'approved' } // approveAttendance expects status in body
        : { verified: true }; // verifyAttendance expects verified in body
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Failed to ${action} attendance:`, errorData);
        alert(`Failed to ${action} attendance: ${errorData.message || response.status}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing attendance:`, error);
      alert(`Failed to ${action} attendance`);
    }
  };

  const handleComplaintAction = async (id, action) => {
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${action}/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        alert(`Failed to ${action} complaint`);
      }
    } catch (error) {
      console.error(`Error ${action}ing complaint:`, error);
      alert(`Failed to ${action} complaint`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      'lab_staff': '#3b82f6',
      'field_staff': '#10b981',
      'delivery_staff': '#f59e0b',
      'manager': '#8b5cf6',
      'accountant': '#ef4444',
      'admin': '#6b7280'
    };

    return (
      <span 
        className="role-badge"
        style={{ backgroundColor: roleColors[role] || '#6b7280' }}
      >
        {role?.replace('_', ' ').toUpperCase() || 'STAFF'}
      </span>
    );
  };

  return (
    <div className="complaint-management">
      {/* Header */}
      <div className="page-header">
        <h1>
          <i className="fas fa-exclamation-triangle"></i>
          Complaints & Actions
        </h1>
        <p>Handle complaints</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          Staff
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button className="refresh-btn" onClick={fetchData}>
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'staff' && (
          <div className="staff-section">
            {/* Side by Side Layout */}
            <div className="side-layout">
              {/* Left Side - Attendance */}
              <div className="left-panel">
                <div className="section-card">
                  <h3>Attendance - Pending Verification</h3>
                  {loading ? (
                    <div className="loading-state">
                      <i className="fas fa-spinner fa-spin"></i>
                      <p>Loading...</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>Staff</th>
                            <th>Date</th>
                            <th>Check In</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.length > 0 ? (
                            attendanceData.map((item) => (
                              <tr key={item._id}>
                                <td>{item.staffName || item.staff?.name || 'Unknown'}</td>
                                <td>{formatDate(item.date)}</td>
                                <td>{item.checkIn || '-'}</td>
                                <td>
                                  <div className="action-buttons">
                                    <button 
                                      className="verify-btn"
                                      onClick={() => handleVerifyAttendance(item._id, 'verify')}
                                    >
                                      Verify
                                    </button>
                                    <button 
                                      className="reject-btn"
                                      onClick={() => handleVerifyAttendance(item._id, 'reject')}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="no-data">No pending attendance records</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Recently Verified Section */}
                <div className="section-card">
                  <h3>Attendance - Recently Verified</h3>
                  <div className="empty-state">
                    <p>No verified records</p>
                  </div>
                </div>
              </div>

              {/* Right Side - Staff Complaints */}
              <div className="right-panel">
                <div className="section-card">
                  <h3>Staff Complaints</h3>
                  {loading ? (
                    <div className="loading-state">
                      <i className="fas fa-spinner fa-spin"></i>
                      <p>Loading...</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="simple-table">
                        <thead>
                          <tr>
                            <th>Staff</th>
                            <th>Role</th>
                            <th>Complaint</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffComplaints.length > 0 ? (
                            staffComplaints.map((complaint) => (
                              <tr key={complaint._id}>
                                <td>{complaint.staffName || complaint.staff?.name || 'Unknown'}</td>
                                <td>{getRoleBadge(complaint.staff?.role || complaint.role)}</td>
                                <td className="complaint-text" title={complaint.description}>
                                  {complaint.title || complaint.description || 'No description'}
                                </td>
                                <td>{formatDate(complaint.createdAt || complaint.date)}</td>
                                <td>
                                  <div className="action-buttons">
                                    <button 
                                      className="resolve-btn"
                                      onClick={() => handleComplaintAction(complaint._id, 'resolve')}
                                    >
                                      Resolve
                                    </button>
                                    <button 
                                      className="reject-btn"
                                      onClick={() => handleComplaintAction(complaint._id, 'reject')}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="no-data">No staff complaints</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-card">
              <h3>User Complaints</h3>
              {loading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading...</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Complaint</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userComplaints.length > 0 ? (
                        userComplaints.map((complaint) => (
                          <tr key={complaint._id}>
                            <td>{complaint.userName || complaint.user?.name || 'Unknown'}</td>
                            <td>{complaint.user?.email || complaint.email || '-'}</td>
                            <td className="complaint-text" title={complaint.description}>
                              {complaint.title || complaint.description || 'No description'}
                            </td>
                            <td>{formatDate(complaint.createdAt || complaint.date)}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="resolve-btn"
                                  onClick={() => handleComplaintAction(complaint._id, 'resolve')}
                                >
                                  Resolve
                                </button>
                                <button 
                                  className="reject-btn"
                                  onClick={() => handleComplaintAction(complaint._id, 'reject')}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="no-data">No user complaints</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintManagement;