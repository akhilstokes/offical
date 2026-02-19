import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './userDashboardTheme.css';

const UserDashboard = () => {
  const [userName, setUserName] = useState('Valued Customer');
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Attempt to get user name from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj.name) setUserName(userObj.name);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  return (
    <div className="user-dashboard">
      <div className="userdash-header">
        <div className="userdash-title">
          <h2>{greeting}, {userName}!</h2>
          <p>Here's what's happening with your account today.</p>
        </div>
        <div className="userdash-header-actions">
          <NavLink to="/user/profile" className="userdash-profile-btn">
            <i className="fas fa-user-circle"></i>
            <span>My Profile</span>
          </NavLink>
        </div>
      </div>

      <div className="userdash-stats-row">
        <div className="userdash-stat-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper wallet">
              <i className="fas fa-wallet"></i>
            </div>
            <div className="userdash-stat-info">
              <span className="userdash-stat-label">Total Transactions</span>
              <h3 className="userdash-stat-value">View History</h3>
            </div>
          </div>
          <NavLink to="/user/transactions" className="userdash-stat-link">
            <span>Explore</span>
            <i className="fas fa-chevron-right"></i>
          </NavLink>
        </div>

        <div className="userdash-stat-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper rate">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="userdash-stat-info">
              <span className="userdash-stat-label">Current Live Rate</span>
              <h3 className="userdash-stat-value">Today's Updates</h3>
            </div>
          </div>
          <NavLink to="/user/live-rate" className="userdash-stat-link">
            <span>Check Now</span>
            <i className="fas fa-chevron-right"></i>
          </NavLink>
        </div>

        <div className="userdash-stat-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper alert">
              <i className="fas fa-bell"></i>
            </div>
            <div className="userdash-stat-info">
              <span className="userdash-stat-label">Recent Notifications</span>
              <h3 className="userdash-stat-value">Latest Alerts</h3>
            </div>
          </div>
          <NavLink to="/user/notifications" className="userdash-stat-link">
            <span>View All</span>
            <i className="fas fa-chevron-right"></i>
          </NavLink>
        </div>
      </div>

      <div className="userdash-section-label">
        <h3>Quick Actions</h3>
        <div className="section-divider"></div>
      </div>

      <div className="userdash-grid">
        <NavLink className="userdash-card" to="/user/profile">
          <div className="userdash-card-icon profile">
            <i className="fas fa-user"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Manage Profile</div>
            <div className="userdash-card-desc">Update your personal information and settings.</div>
          </div>
          <div className="userdash-card-cta">
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/live-rate">
          <div className="userdash-card-icon rate">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Market Live Rate</div>
            <div className="userdash-card-desc">Stay updated with current market trends and history.</div>
          </div>
          <div className="userdash-card-cta">
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/transactions">
          <div className="userdash-card-icon transactions">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Bills & Payments</div>
            <div className="userdash-card-desc">Download invoices and track your payment history.</div>
          </div>
          <div className="userdash-card-cta">
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/requests">
          <div className="userdash-card-icon support">
            <i className="fas fa-headset"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Support & Requests</div>
            <div className="userdash-card-desc">Raise requests for barrels or log complaints.</div>
          </div>
          <div className="userdash-card-cta">
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/notifications">
          <div className="userdash-card-icon notifications">
            <i className="fas fa-bell"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Account Alerts</div>
            <div className="userdash-card-desc">Check important updates and system notifications.</div>
          </div>
          <div className="userdash-card-cta">
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>

        <NavLink className="userdash-card" to="/user/sell-barrels">
          <div className="userdash-card-icon sell">
            <i className="fas fa-box-open"></i>
          </div>
          <div className="userdash-card-body">
            <div className="userdash-card-title">Sell Barrels</div>
            <div className="userdash-card-desc">Submit new requests to sell your barrels.</div>
          </div>
          <div className="userdash-card-cta">
            <i className="fas fa-arrow-right"></i>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default UserDashboard;
