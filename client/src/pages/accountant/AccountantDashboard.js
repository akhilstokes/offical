import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AccountantDashboard.css';

const AccountantDashboard = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Auto Wages',
      icon: 'fa-money-bill-wave',
      color: '#10b981',
      path: '/accountant/wages'
    },
    {
      title: 'Set Live Rate',
      icon: 'fa-chart-line',
      color: '#3b82f6',
      path: '/accountant/rates'
    },
    {
      title: 'Delivery Intake',
      icon: 'fa-truck',
      color: '#8b5cf6',
      path: '/accountant/delivery-intake'
    },
    {
      title: 'Stock Monitor',
      icon: 'fa-boxes',
      color: '#f59e0b',
      path: '/accountant/stock'
    },
    {
      title: 'Attendance',
      icon: 'fa-calendar-check',
      color: '#ec4899',
      path: '/accountant/attendance'
    },
    {
      title: 'Product Orders',
      icon: 'fa-shopping-cart',
      color: '#f43f5e',
      path: '/accountant/orders'
    },
    {
      title: 'Salaries',
      icon: 'fa-coins',
      color: '#06b6d4',
      path: '/accountant/salaries'
    }
  ];

  return (
    <div className="simple-dashboard">
      <div className="simple-header">
        <h1>Accountant Dashboard</h1>
        <p>Select an action to get started</p>
      </div>

      <div className="simple-grid">
        {quickActions.map((action, index) => (
          <div
            key={index}
            className="simple-card"
            onClick={() => navigate(action.path)}
          >
            <div className="simple-icon" style={{ backgroundColor: action.color }}>
              <i className={`fas ${action.icon}`}></i>
            </div>
            <h3>{action.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountantDashboard;
