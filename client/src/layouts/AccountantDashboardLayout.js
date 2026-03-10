import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './DashboardLayout.css';
import { useAuth } from '../context/AuthContext';

const AccountantDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen] = useState(true);
  const [notificationCount] = useState(1);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        // no-op
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="dashboard-container">
      <aside className={`sidebar sidebar--flush-left ${sidebarOpen ? '' : 'sidebar--hidden'}`}>
        <div className="sidebar-header">Accountant</div>
        <ul className="sidebar-nav">
          <li className="nav-item"><NavLink to="/accountant">Dashboard</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/rates">Set Live Rate</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/stock">Stock Monitor</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/my-attendance">My Attendance</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/mark-attendance">Mark Attendance</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/leave">Leave</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/salaries">Salaries</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/payments">Bill Payments</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/orders">Product Orders</NavLink></li>
          <li className="nav-item"><NavLink to="/accountant/barrels">Delivery Intake/Verify</NavLink></li>
        </ul>
      </aside>
      <div className="main-content-wrapper">
        <header className="dashboard-header" style={{ justifyContent: 'flex-end' }}>
          <div className="user-header-actions">
            {/* Notification Button */}
            <button className="notification-btn" onClick={() => navigate('/accountant/alerts')}>
              <i className="fas fa-bell"></i>
              {notificationCount > 0 && (
                <div className="notification-badge">{notificationCount}</div>
              )}
            </button>

            <div className="profile-menu" ref={menuRef}>
              <button type="button" className="profile-link" onClick={() => navigate('/accountant/profile')}>
                <i className="fas fa-user-circle" />
                <span>{user?.name || 'Accountant'}</span>
              </button>
            </div>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default AccountantDashboardLayout;
