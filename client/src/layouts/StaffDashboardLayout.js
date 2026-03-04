import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './StaffDashboardLayout.css';
import { useAuth } from '../context/AuthContext';

const StaffDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const navigationItems = [
    {
      section: 'Overview',
      items: [
        { path: '/staff/attendance', icon: 'fa-user-clock', label: 'Attendance' },
        { path: '/staff/schedule', icon: 'fa-calendar-alt', label: 'My Schedule' },
      ]
    },
    {
      section: 'Leave & Salary',
      items: [
        { path: '/staff/leave', icon: 'fa-calendar-times', label: 'Apply Leave' },
        { path: '/staff/salary', icon: 'fa-money-bill-wave', label: 'Salary Details' },
      ]
    },
    {
      section: 'Operations',
      items: [
        { path: '/staff/issues', icon: 'fa-exclamation-circle', label: 'Raise Issue' },
        { path: '/staff/return-barrels', icon: 'fa-undo-alt', label: 'Return Barrel' },
      ]
    }
  ];

  return (
    <div className="staff-dashboard">
      {/* Sidebar */}
      <aside className={`staff-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header */}
        <div className="staff-sidebar-header">
          <div className="staff-brand">
            <div className="staff-brand-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="staff-brand-text">
              <h3>HFP Staff</h3>
              <span>Employee Panel</span>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="staff-user-card">
          <div className="staff-user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="staff-user-info">
            <div className="staff-user-greeting">Welcome back,</div>
            <div className="staff-user-name">{user?.name || 'Staff Member'}</div>
            <div className="staff-user-role">Field Staff</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="staff-nav">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="staff-nav-section">
              <div className="staff-nav-title">{section.section}</div>
              <div className="staff-nav-items">
                {section.items.map((item, itemIndex) => (
                  <NavLink
                    key={itemIndex}
                    to={item.path}
                    className={({ isActive }) => 
                      `staff-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <div className="staff-nav-icon">
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <span className="staff-nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="staff-sidebar-footer">
          <button className="staff-logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="staff-main-content">
        {/* Top Header Bar */}
        <header className="staff-top-header">
          <div className="staff-header-left">
            <div className="staff-page-title">
              <div className="staff-page-icon">
                <i className="fas fa-home"></i>
              </div>
              <div className="staff-page-info">
                <h1>Dashboard</h1>
                <p>Welcome to your staff portal</p>
              </div>
            </div>
          </div>
          <div className="staff-header-right">
            <div className="staff-profile-dropdown">
              <div className="staff-profile-btn">
                <div className="staff-profile-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="staff-profile-info">
                  <div className="staff-profile-name">{user?.name || 'Staff Member'}</div>
                  <div className="staff-profile-role">Field Staff</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="staff-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboardLayout;
