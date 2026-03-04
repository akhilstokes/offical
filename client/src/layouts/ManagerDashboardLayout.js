import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './ManagerDashboardLayout.css';
import { useAuth } from '../context/AuthContext';

const ManagerDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');


  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };


  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (!token) {
          setUnreadCount(0);
          setRecentNotifications([]);
          return;
        }

        const res = await fetch(`${base}/api/notifications?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
          setRecentNotifications(list);
          setUnreadCount(Number(data?.unread || (list.filter(n => !n.read).length)));
        } else {
          setUnreadCount(0);
          setRecentNotifications([]);
        }
      } catch {
        setUnreadCount(0);
        setRecentNotifications([]);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [base, token]);

  // Click outside handlers
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
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
    if (path === '/manager/home') return { title: 'Dashboard', subtitle: 'Manager overview and controls', icon: 'fa-tachometer-alt' };
    if (path.includes('/staff-schedule')) return { title: 'Staff Schedule', subtitle: 'Assign shifts to staff members', icon: 'fa-calendar-check' };
    if (path.includes('/live-attendance')) return { title: 'Attendance History', subtitle: 'View staff attendance records', icon: 'fa-history' };
    if (path.includes('/leaves')) return { title: 'Pending Leaves', subtitle: 'Review leave requests', icon: 'fa-calendar-times' };
    if (path.includes('/attendance')) return { title: 'Attendance Verify', subtitle: 'Verify staff attendance', icon: 'fa-user-check' };
    if (path.includes('/expenses')) return { title: 'Expenses', subtitle: 'Manage expenses', icon: 'fa-receipt' };
    if (path.includes('/completed')) return { title: 'Complaints & Actions', subtitle: 'Handle complaints', icon: 'fa-exclamation-triangle' };
    if (path.includes('/hanger-space')) return { title: 'Hanger Space', subtitle: 'Manage storage space', icon: 'fa-warehouse' };
    if (path.includes('/shifts')) return { title: 'Shift Planning', subtitle: 'Plan staff shifts', icon: 'fa-clock' };
    if (path.includes('/shift-management')) return { title: 'Shift Management', subtitle: 'Manage staff shifts and assignments', icon: 'fa-calendar-alt' };
    if (path.includes('/sell-requests')) return { title: 'Sell Requests', subtitle: 'Manage sell requests', icon: 'fa-handshake' };
    if (path.includes('/barrel-allocation')) return { title: 'Barrel Allocation', subtitle: 'Allocate barrels', icon: 'fa-boxes' };
    if (path.includes('/returned-barrels')) return { title: 'Returned Barrels', subtitle: 'Track returned barrels', icon: 'fa-undo' };
    if (path.includes('/bill-verification')) return { title: 'Bill Verification', subtitle: 'Verify pending bills', icon: 'fa-file-invoice-dollar' };
    if (path.includes('/wages')) return { title: 'Wages', subtitle: 'Manage staff wages', icon: 'fa-money-bill-wave' };
    if (path.includes('/staff-salary')) return { title: 'Staff Salary', subtitle: 'Handle staff salaries', icon: 'fa-coins' };
    if (path.includes('/stock')) return { title: 'Stock', subtitle: 'Inventory management', icon: 'fa-boxes' };
    if (path.includes('/chem-requests')) return { title: 'Chemical Requests', subtitle: 'Chemical request management', icon: 'fa-flask' };
    if (path.includes('/notifications')) return { title: 'Send Notifications', subtitle: 'Broadcast notifications', icon: 'fa-bullhorn' };
    return { title: 'Manager', subtitle: 'Management system', icon: 'fa-user-tie' };
  };

  const pageInfo = getPageTitle();

  const navigationItems = [
    {
      section: 'Operations',
      items: [
        { to: '/manager/home', icon: 'fa-tachometer-alt', label: 'Dashboard' },
        { to: '/manager/live-attendance', icon: 'fa-history', label: 'Attendance History' },
        { to: '/manager/leaves', icon: 'fa-calendar-times', label: 'Pending Leaves' },
        { to: '/manager/attendance', icon: 'fa-user-check', label: 'Attendance Verify' },
        { to: '/manager/expenses', icon: 'fa-receipt', label: 'Expenses' },
        { to: '/manager/completed', icon: 'fa-exclamation-triangle', label: 'Complaints & Actions' },
      ]
    },
    {
      section: 'Inventory & Space',
      items: [
        { to: '/manager/hanger-space', icon: 'fa-warehouse', label: 'Hanger Space' },
        { to: '/manager/stock', icon: 'fa-boxes', label: 'Stock Management' },
        { to: '/manager/returned-barrels', icon: 'fa-undo', label: 'Returned Barrels' },
      ]
    },
    {
      section: 'Business & Finance',
      items: [
        { to: '/manager/sell-requests', icon: 'fa-handshake', label: 'Sell Requests' },
        { to: '/manager/bill-verification', icon: 'fa-file-invoice-dollar', label: 'Bill Verification' },
        { to: '/manager/wages', icon: 'fa-money-bill-wave', label: 'Wages' },
        { to: '/manager/staff-salary', icon: 'fa-coins', label: 'Staff Salary' },
      ]
    },
    {
      section: 'Staff & Planning',
      items: [
        { to: '/manager/staff-schedule', icon: 'fa-calendar-check', label: 'Staff Schedule' },
        { to: '/manager/shift-management', icon: 'fa-calendar-alt', label: 'Shift Management' },
        { to: '/manager/chem-requests', icon: 'fa-flask', label: 'Chemical Requests' },
        { to: '/manager/notifications', icon: 'fa-bullhorn', label: 'Send Notifications' },
      ]
    }
  ];

  return (
    <div className="manager-dashboard-container">
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`manager-sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`manager-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="manager-sidebar-header">
          <div className="manager-brand">
            <div className="manager-brand-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="manager-brand-text">
              <h3>HFP Manager</h3>
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
        <div className="manager-user-card">
          <div className="manager-user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="manager-user-info">
            <div className="manager-user-greeting">Welcome back,</div>
            <div className="manager-user-name">{user?.name || user?.email || 'Manager'}</div>
            <div className="manager-user-role">System Manager</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="manager-nav">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="manager-nav-section">
              <div className="manager-nav-title">{section.section}</div>
              <div className="manager-nav-items">
                {section.items.map((item, itemIndex) => (
                  <NavLink
                    key={itemIndex}
                    to={item.to}
                    className={({ isActive }) => 
                      `manager-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <div className="manager-nav-icon">
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <span className="manager-nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="manager-sidebar-footer">
          <button className="manager-logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`manager-main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Header */}
        <header className="manager-top-header">
          <div className="manager-header-left">
            <button 
              className="manager-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            
            <div className="manager-page-title">
              <div className="manager-page-icon">
                <i className={`fas ${pageInfo.icon}`}></i>
              </div>
              <div className="manager-page-info">
                <h1>{pageInfo.title}</h1>
                <p>{pageInfo.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="manager-header-right">
            {/* Notifications */}
            <button 
              className="manager-notification-btn"
              onClick={() => navigate('/manager/notifications')}
              aria-label="Notifications"
            >
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && (
                <div className="manager-notification-dot">{unreadCount > 99 ? '99+' : unreadCount}</div>
              )}
            </button>

            {/* Profile Icon */}
            <button
              className="manager-profile-icon-btn"
              onClick={() => navigate('/manager/home')}
              aria-label="Dashboard"
            >
              <i className="fas fa-user-circle"></i>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="manager-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ManagerDashboardLayout;
