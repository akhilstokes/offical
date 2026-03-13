import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './LabDashboardLayout.css';
import { useAuth } from '../context/AuthContext';

const LabDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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
      navigate('/login');
    } catch {
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
          setUnreadCount(Number(data?.unread || (list.filter(n=>!n.read).length)));
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
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  const navigationItems = [
    { path: '/lab/dashboard', icon: 'fas fa-chart-line', label: 'Overview', category: 'main' },
    { path: '/lab/attendance', icon: 'fas fa-calendar-check', label: 'My Attendance', category: 'personal' },
    { path: '/lab/leave', icon: 'fas fa-calendar-times', label: 'My Leave', category: 'personal' },
    { path: '/lab/shift-schedule', icon: 'fas fa-clock', label: 'Shift Schedule', category: 'schedule' },
    { path: '/lab/check-in', icon: 'fas fa-flask', label: 'Sample Check-In', category: 'lab' },
    { path: '/lab/ai-rubber-process', icon: 'fas fa-brain', label: 'AI Rubber Process', category: 'lab' },
    { path: '/lab/chem-requests', icon: 'fas fa-atom', label: 'Chemical Requests', category: 'lab' },
    { path: '/lab/salary', icon: 'fas fa-money-bill-wave', label: 'My Salary', category: 'personal' },
    { path: '/lab/reports', icon: 'fas fa-file-chart-line', label: 'Reports', category: 'reports' }
  ];

  const categories = {
    main: { label: 'Dashboard', color: '#3b82f6' },
    personal: { label: 'Personal', color: '#10b981' },
    schedule: { label: 'Schedule', color: '#f59e0b' },
    lab: { label: 'Laboratory', color: '#8b5cf6' },
    ai: { label: 'AI Tools', color: '#ef4444' },
    reports: { label: 'Reports', color: '#6b7280' }
  };

  return (
    <div className="lab-dashboard-container">
      <aside className={`lab-sidebar ${sidebarOpen ? 'lab-sidebar--open' : 'lab-sidebar--closed'}`}>
        {/* Sidebar Header */}
        <div className="lab-sidebar-header">
          <div className="lab-logo">
            <div className="lab-logo-icon">
              <i className="fas fa-microscope"></i>
            </div>
            {sidebarOpen && (
              <div className="lab-logo-text">
                <span className="lab-title">HFP Lab</span>
                <span className="lab-subtitle">Laboratory Portal</span>
              </div>
            )}
          </div>
          <button 
            className="lab-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="lab-sidebar-nav">
          {Object.entries(categories).map(([categoryKey, category]) => {
            const categoryItems = navigationItems.filter(item => item.category === categoryKey);
            if (categoryItems.length === 0) return null;

            return (
              <div key={categoryKey} className="lab-nav-section">
                {sidebarOpen && (
                  <div className="lab-nav-section-header">
                    <span className="lab-nav-section-title">{category.label}</span>
                    <div 
                      className="lab-nav-section-indicator" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                  </div>
                )}
                <ul className="lab-nav-list">
                  {categoryItems.map((item) => (
                    <li key={item.path} className="lab-nav-item">
                      <NavLink 
                        to={item.path} 
                        className={({ isActive }) => 
                          `lab-nav-link ${isActive ? 'lab-nav-link--active' : ''}`
                        }
                        title={!sidebarOpen ? item.label : ''}
                      >
                        <div className="lab-nav-icon">
                          <i className={item.icon}></i>
                        </div>
                        {sidebarOpen && (
                          <span className="lab-nav-label">{item.label}</span>
                        )}
                        {sidebarOpen && (
                          <div className="lab-nav-arrow">
                            <i className="fas fa-chevron-right"></i>
                          </div>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User Profile in Sidebar */}
        {sidebarOpen && (
          <div className="lab-sidebar-footer">
            <div className="lab-user-profile">
              <div className="lab-user-avatar">
                <i className="fas fa-user-circle"></i>
              </div>
              <div className="lab-user-info">
                <span className="lab-user-name">
                  {(user && (user.name || 'Lab Staff')) || 'Lab Staff'}
                </span>
                <span className="lab-user-role">
                  {user?.role ? user.role.replace('_', ' ') : 'Lab Staff'}
                </span>
              </div>
              <button
                className="lab-logout-btn"
                onClick={handleLogout}
                title="Sign out"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className="lab-main-content">
        {/* Top Header */}
        <header className="lab-header">
          <div className="lab-header-left">
            {!sidebarOpen && (
              <button 
                className="lab-mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
              >
                <i className="fas fa-bars"></i>
              </button>
            )}
            <div className="lab-breadcrumb">
              <i className="fas fa-microscope"></i>
              <span>HFP Laboratory</span>
            </div>
          </div>

          <div className="lab-header-right">
            {/* Notification Bell */}
            <div className="lab-notification-bell" ref={notifRef}>
              <button 
                className="lab-notification-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notifications"
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="lab-notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="lab-notification-dropdown">
                  <div className="lab-notification-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="lab-notification-count">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="lab-notification-list">
                    {recentNotifications.length === 0 ? (
                      <div className="lab-notification-empty">
                        <i className="fas fa-bell-slash"></i>
                        <p>No notifications</p>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`lab-notification-item ${!notif.read ? 'lab-notification-item--unread' : ''}`}
                          onClick={() => {
                            // Only navigate if link exists and is a valid lab route
                            if (notif.link && notif.link.startsWith('/lab/')) {
                              navigate(notif.link);
                            }
                            setNotificationsOpen(false);
                          }}
                          style={{ cursor: notif.link && notif.link.startsWith('/lab/') ? 'pointer' : 'default' }}
                        >
                          <div className="lab-notification-content">
                            <div className="lab-notification-title">{notif.title}</div>
                            <div className="lab-notification-message">{notif.message}</div>
                            <div className="lab-notification-time">
                              {new Date(notif.createdAt).toLocaleString()}
                            </div>
                          </div>
                          {!notif.read && <div className="lab-notification-dot"></div>}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="lab-notification-footer">
                    <button
                      onClick={() => {
                        // Close dropdown - don't navigate to non-existent route
                        setNotificationsOpen(false);
                      }}
                      className="lab-notification-view-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="lab-profile-menu" ref={menuRef}>
              <button 
                className="lab-profile-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                title="Account menu"
              >
                <div className="lab-profile-avatar">
                  <i className="fas fa-user-circle"></i>
                </div>
                <div className="lab-profile-info">
                  <span className="lab-profile-name">
                    {(user && (user.name || 'Lab Staff')) || 'Lab Staff'}
                  </span>
                  <span className="lab-profile-role">
                    {user?.role ? user.role.replace('_', ' ') : 'Lab Staff'}
                  </span>
                </div>
                <i className="fas fa-chevron-down lab-profile-chevron"></i>
              </button>
              
              {menuOpen && (
                <div className="lab-profile-dropdown">
                  <button 
                    className="lab-dropdown-item lab-dropdown-item--logout"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="lab-content">{children}</main>
      </div>
    </div>
  );
};

export default LabDashboardLayout;
