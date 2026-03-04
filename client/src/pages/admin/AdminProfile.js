import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminProfile.css';

const AdminProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: 'admin',
    phone: '',
    joinedDate: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || 'Administrator',
        email: user.email || '',
        role: user.role || 'admin',
        phone: user.phone || 'Not provided',
        joinedDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
      });
    }
  }, [user]);

  return (
    <div className="admin-profile-container">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {profileData.name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-header-info">
          <h1>{profileData.name}</h1>
          <p className="profile-role">System Administrator</p>
        </div>
      </div>

      <div className="profile-card">
        <h2>Personal Information</h2>
        <div className="profile-info-grid">
          <div className="info-item">
            <label>Full Name</label>
            <div className="info-value">{profileData.name}</div>
          </div>
          <div className="info-item">
            <label>Email Address</label>
            <div className="info-value">{profileData.email}</div>
          </div>
          <div className="info-item">
            <label>Phone Number</label>
            <div className="info-value">{profileData.phone}</div>
          </div>
          <div className="info-item">
            <label>Role</label>
            <div className="info-value">
              <span className="role-badge">{profileData.role}</span>
            </div>
          </div>
          <div className="info-item">
            <label>Member Since</label>
            <div className="info-value">{profileData.joinedDate}</div>
          </div>
          <div className="info-item">
            <label>Status</label>
            <div className="info-value">
              <span className="status-badge active">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-card">
        <h2>Permissions & Access</h2>
        <div className="permissions-list">
          <div className="permission-item">
            <i className="fas fa-check-circle"></i>
            <span>Full system access</span>
          </div>
          <div className="permission-item">
            <i className="fas fa-check-circle"></i>
            <span>User management</span>
          </div>
          <div className="permission-item">
            <i className="fas fa-check-circle"></i>
            <span>Staff management</span>
          </div>
          <div className="permission-item">
            <i className="fas fa-check-circle"></i>
            <span>Inventory control</span>
          </div>
          <div className="permission-item">
            <i className="fas fa-check-circle"></i>
            <span>Financial operations</span>
          </div>
          <div className="permission-item">
            <i className="fas fa-check-circle"></i>
            <span>System configuration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
