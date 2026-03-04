
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import './AdminDashboardLayout.css';
import { useAuth } from '../context/AuthContext';

const AdminDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationCount] = useState(1);
  const menuRef = useRef(null);


  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true });
    }
  };


  // Click outside handler
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin/home') return { title: 'Dashboard', subtitle: 'Admin overview and controls', icon: 'fa-tachometer-alt' };
    if (path.includes('/attendance')) return { title: 'Attendance', subtitle: 'Staff attendance management', icon: 'fa-user-check' };
    if (path.includes('/staff-management')) return { title: 'Staff Management', subtitle: 'Manage staff members', icon: 'fa-users-cog' };
    if (path.includes('/staff')) return { title: 'Staff', subtitle: 'Staff information', icon: 'fa-users' };
    if (path.includes('/expenses')) return { title: 'Expenses', subtitle: 'Expense management', icon: 'fa-receipt' };
    if (path.includes('/yard-stock')) return { title: 'Yard Stock', subtitle: 'Yard inventory management', icon: 'fa-warehouse' };
    if (path.includes('/godown-rubber-stock')) return { title: 'Godown Rubber Stock', subtitle: 'Rubber stock management', icon: 'fa-boxes' };
    if (path.includes('/hanger-space')) return { title: 'Hanger Free Space', subtitle: 'Storage space management', icon: 'fa-warehouse' };
    if (path.includes('/worker-schedule')) return { title: 'Worker Schedule', subtitle: 'Schedule management', icon: 'fa-calendar-alt' };
    if (path.includes('/worker-documents')) return { title: 'Worker Documents', subtitle: 'Document management', icon: 'fa-file-alt' };
    if (path.includes('/create-barrel')) return { title: 'Barrel', subtitle: 'Barrel management', icon: 'fa-drum' };
    if (path.includes('/barrel-register')) return { title: 'Barrel Issue Register', subtitle: 'Transaction ledger and audit trail', icon: 'fa-book' };
    if (path.includes('/barrel-requests')) return { title: 'Barrel Requests', subtitle: 'Handle barrel requests', icon: 'fa-drum' };
    if (path.includes('/chem-requests')) return { title: 'Chemical Requests', subtitle: 'Chemical request management', icon: 'fa-flask' };
    if (path.includes('/notifications')) return { title: 'Notifications', subtitle: 'Send broadcast notifications', icon: 'fa-bell' };
    if (path.includes('/rates')) return { title: 'Rates', subtitle: 'Rate management', icon: 'fa-chart-line' };
    if (path.includes('/rate-approval')) return { title: 'Rate Approval', subtitle: 'Approve submitted rates', icon: 'fa-check-circle' };
    if (path.includes('/vehicles')) return { title: 'Vehicle Management', subtitle: 'Manage delivery vehicles', icon: 'fa-truck' };
    return { title: 'Administration', subtitle: 'System administration', icon: 'fa-user-shield' };
  };

  const pageInfo = getPageTitle();

  const navigationItems = [
    {
      section: 'Overview',
      items: [
        { to: '/admin/home', icon: 'fa-tachometer-alt', label: 'Dashboard' },
        { to: '/admin/attendance', icon: 'fa-user-check', label: 'Attendance' },
      ]
    },
    {
      section: 'Staff Management',
      items: [
        { to: '/admin/staff', icon: 'fa-users', label: 'Staff' },
        { to: '/admin/staff-management', icon: 'fa-users-cog', label: 'Staff Management' },
        { to: '/admin/worker-schedule', icon: 'fa-calendar-alt', label: 'Worker Schedule' },
        { to: '/admin/worker-documents', icon: 'fa-file-alt', label: 'Worker Documents' },
      ]
    },
    {
      section: 'Inventory & Storage',
      items: [
        { to: '/admin/yard-stock', icon: 'fa-warehouse', label: 'Yard Stock' },
        { to: '/admin/godown-rubber-stock', icon: 'fa-boxes', label: 'Godown Rubber Stock' },
        { to: '/admin/hanger-space', icon: 'fa-warehouse', label: 'Hanger Free Space' },
      ]
    },
    {
      section: 'Barrel Management',
      items: [
        { to: '/admin/barrel-requests', icon: 'fa-drum', label: 'Barrel Requests' },
        { to: '/admin/barrel-register', icon: 'fa-book', label: 'Issue Register' },
      ]
    },
    {
      section: 'Operations',
      items: [
        { to: '/admin/expenses', icon: 'fa-receipt', label: 'Expenses' },
        { to: '/admin/chem-requests', icon: 'fa-flask', label: 'Chemical Requests' },
        { to: '/admin/notifications', icon: 'fa-bell', label: 'Notifications' },
        { to: '/admin/rates', icon: 'fa-chart-line', label: 'Rates' },
      ]
    },
    {
      section: 'Fleet Management',
      items: [
        { to: '/admin/vehicles', icon: 'fa-truck', label: 'Vehicles' },
      ]
    }
  ];

  // Allow both children (explicit) and Outlet (nested routes) usage
  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`admin-sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="admin-brand-icon">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="admin-brand-text">
              <h3>HFP Admin</h3>
              <span>Control Panel</span>
            </div>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="admin-user-card">
          <div className="admin-user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="admin-user-info">
            <div className="admin-user-greeting">Welcome back,</div>
            <div className="admin-user-name">{user?.name || user?.email || 'Administrator'}</div>
            <div className="admin-user-role">System Administrator</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-nav">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="admin-nav-section">
              <div className="admin-nav-title">{section.section}</div>
              <div className="admin-nav-items">
                {section.items.map((item, itemIndex) => (
                  <NavLink
                    key={itemIndex}
                    to={item.to}
                    className={({ isActive }) => 
                      `admin-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <div className="admin-nav-icon">
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <span className="admin-nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleSignOut}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`admin-main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Header */}
        <header className="admin-top-header">
          <div className="admin-header-left">
            <button 
              className="admin-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            
            <div className="admin-page-title">
              <div className="admin-page-icon">
                <i className={`fas ${pageInfo.icon}`}></i>
              </div>
              <div className="admin-page-info">
                <h1>{pageInfo.title}</h1>
                <p>{pageInfo.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="admin-header-right">
            {/* Notification Button */}
            <button 
              className="admin-notification-btn" 
              onClick={() => {
                // Admin notifications page doesn't exist yet - just show alert
                alert('Admin notifications page coming soon!');
              }}
              title="Notifications"
            >
              <i className="fas fa-bell"></i>
              {notificationCount > 0 && (
                <div className="admin-notification-badge">{notificationCount}</div>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="admin-profile-dropdown" ref={menuRef}>
              <button 
                className="admin-profile-btn"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className="admin-profile-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="admin-profile-info">
                  <div className="admin-profile-name">{user?.name || 'Administrator'}</div>
                  <div className="admin-profile-role">System Administrator</div>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="admin-dropdown-menu">
                  <NavLink 
                    to="/admin/profile" 
                    className="admin-dropdown-item"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <i className="fas fa-user"></i>
                    View Profile
                  </NavLink>
                  <NavLink 
                    to="/admin/settings" 
                    className="admin-dropdown-item"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <i className="fas fa-cog"></i>
                    Settings
                  </NavLink>
                  <div className="admin-dropdown-item" onClick={handleSignOut}>
                    <i className="fas fa-sign-out-alt"></i>
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
