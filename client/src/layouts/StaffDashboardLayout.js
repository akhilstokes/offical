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
    { path: '/staff/attendance', icon: 'fas fa-user-clock', label: 'Attendance' },
    { path: '/staff/schedule', icon: 'fas fa-calendar-alt', label: 'My Schedule' },
    { path: '/staff/leave', icon: 'fas fa-calendar-days', label: 'Apply Leave' },
    { path: '/staff/salary', icon: 'fas fa-wallet', label: 'Salary Details' },
    { path: '/staff/issues', icon: 'fas fa-exclamation-circle', label: 'Raise Issue' },
    { path: '/staff/return-barrels', icon: 'fas fa-undo', label: 'Return Barrel' }
  ];

  return (
    <div className="staff-dashboard">
      {/* Sidebar */}
      <aside className={`staff-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-section">
            <div className="brand-icon">
              <i className="fas fa-users"></i>
            </div>
            {!sidebarCollapsed && (
              <div className="brand-text">
                <h3>Staff Panel</h3>
                <span>DASHBOARD</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!sidebarCollapsed && <div className="section-title">MAIN MENU</div>}
            <ul className="nav-list">
              {navigationItems.map((item, index) => (
                <li key={index} className="nav-item">
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header Bar */}
        <header className="top-header-bar">
          <div className="header-left">
            <div className="breadcrumb">
              <span className="breadcrumb-item">Home</span>
              <i className="fas fa-chevron-right"></i>
              <span className="breadcrumb-item active">Dashboard</span>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.name || 'Morni Bagama'}</span>
              <i className="fas fa-user-circle"></i>
            </div>
            <button className="logout-link" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboardLayout;
