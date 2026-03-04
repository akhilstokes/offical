import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiBell, FiUser, FiLogOut, FiSettings, FiCheckCircle, FiClock, FiAlertCircle
} from 'react-icons/fi';
import './AccountantLayout.css';

const AccountantLayoutAntigravity = ({ children }) => {
    const navigate = useNavigate();
    const { user, updateProfile, logout } = useAuth();
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    // Dropdown States
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New Salary Request', time: '5m ago', type: 'pending' },
        { id: 2, title: 'Inventory Low', time: '1h ago', type: 'alert' },
        { id: 3, title: 'Bill Approved', time: '2h ago', type: 'success' }
    ]);

    // Edit Profile State
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', email: '' });

    // Initialize form data
    useEffect(() => {
        if (user) {
            setEditFormData({ name: user.name || '', email: user.email || '' });
        }
    }, [user]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(editFormData);
            setIsEditProfileOpen(false);
        } catch (error) {
            console.error('Failed to update profile', error);
        }
    };

    const handleLogout = async () => {
        const confirmLogout = window.confirm('Are you sure you want to logout?');
        if (confirmLogout) {
            try {
                await logout();
                navigate('/login');
            } catch (error) {
                console.error('Logout failed:', error);
            }
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        else if (hour < 18) return "Good Afternoon";
        else return "Good Evening";
    };

    const navigationItems = [
        {
            section: 'Overview',
            items: [
                { to: '/accountant/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
                { to: '/accountant/rates', icon: 'fa-chart-line', label: 'Set Live Rate' },
            ]
        },
        {
            section: 'Operations',
            items: [
                { to: '/accountant/expenses', icon: 'fa-receipt', label: 'Expenses' },
                { to: '/accountant/stock', icon: 'fa-warehouse', label: 'Stock Monitor' },
                { to: '/accountant/delivery-intake', icon: 'fa-truck-loading', label: 'Delivery Intake' },
            ]
        },
        {
            section: 'Staff Management',
            items: [
                { to: '/accountant/attendance', icon: 'fa-user-check', label: 'Attendance' },
                { to: '/accountant/leave', icon: 'fa-calendar-times', label: 'Leave' },
                { to: '/accountant/salaries', icon: 'fa-money-bill-wave', label: 'Salaries' },
            ]
        },
        {
            section: 'Billing',
            items: [
                { to: '/accountant/bill-generation', icon: 'fa-file-invoice-dollar', label: 'Bill Generation' },
            ]
        }
    ];

    return (
        <div className="modern-dashboard">
            {/* Modern Sidebar - Admin Style */}
            <aside className="accountant-sidebar">
                {/* Sidebar Header */}
                <div className="accountant-sidebar-header">
                    <div className="accountant-brand">
                        <div className="accountant-brand-icon">
                            <i className="fas fa-calculator"></i>
                        </div>
                        <div className="accountant-brand-text">
                            <h3>HFP Accountant</h3>
                            <span>Finance Panel</span>
                        </div>
                    </div>
                </div>

                {/* User Profile Card */}
                <div className="accountant-user-card">
                    <div className="accountant-user-avatar">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="accountant-user-info">
                        <div className="accountant-user-greeting">Welcome back,</div>
                        <div className="accountant-user-name">{user?.name || user?.email || 'Accountant'}</div>
                        <div className="accountant-user-role">Finance Manager</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="accountant-nav">
                    {navigationItems.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="accountant-nav-section">
                            <div className="accountant-nav-title">{section.section}</div>
                            <div className="accountant-nav-items">
                                {section.items.map((item, itemIndex) => (
                                    <NavLink
                                        key={itemIndex}
                                        to={item.to}
                                        className={({ isActive }) => 
                                            `accountant-nav-item ${isActive ? 'active' : ''}`
                                        }
                                    >
                                        <div className="accountant-nav-icon">
                                            <i className={`fas ${item.icon}`}></i>
                                        </div>
                                        <span className="accountant-nav-label">{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="accountant-sidebar-footer">
                    <button className="accountant-logout-btn" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <div className="accountant-main-content">
                <header className="accountant-top-header">
                    <div className="accountant-header-content">
                        <div className="accountant-header-left">
                            <div className="accountant-page-title">
                                <div className="accountant-page-icon">
                                    <i className="fas fa-calculator"></i>
                                </div>
                                <div className="accountant-page-info">
                                    <h1>{getGreeting()}, {user?.name || 'Jeffin'}!</h1>
                                    <p>Holy Family Polymers - Accountant Dashboard 👋</p>
                                </div>
                            </div>
                        </div>

                        <div className="accountant-header-right">
                            {/* Notifications Dropdown */}
                            <div className="accountant-dropdown-wrapper" ref={notificationRef}>
                                <button
                                    className={`accountant-notification-btn ${isNotificationOpen ? 'active' : ''}`}
                                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                >
                                    <FiBell />
                                    {notifications.length > 0 && (
                                        <div className="accountant-notification-badge">{notifications.length}</div>
                                    )}
                                </button>

                                {isNotificationOpen && (
                                    <div className="accountant-dropdown-menu">
                                        <div className="accountant-dropdown-header">
                                            <h4>Notifications</h4>
                                            <button onClick={() => navigate('/accountant/alerts')}>View All</button>
                                        </div>
                                        <div className="accountant-dropdown-list">
                                            {notifications.map(n => (
                                                <div key={n.id} className="accountant-dropdown-item">
                                                    <div className={`item-icon ${n.type}`}>
                                                        {n.type === 'success' && <FiCheckCircle />}
                                                        {n.type === 'pending' && <FiClock />}
                                                        {n.type === 'alert' && <FiAlertCircle />}
                                                    </div>
                                                    <div className="item-content">
                                                        <p className="item-title">{n.title}</p>
                                                        <span className="item-time">{n.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Dropdown */}
                            <div className="accountant-profile-dropdown" ref={profileRef}>
                                <button
                                    className="accountant-profile-btn"
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    <div className="accountant-profile-avatar">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <div className="accountant-profile-info">
                                        <div className="accountant-profile-name">{user?.name || 'Accountant'}</div>
                                        <div className="accountant-profile-role">Finance Manager</div>
                                    </div>
                                </button>

                                {isProfileOpen && (
                                    <div className="accountant-dropdown-menu accountant-profile-menu">
                                        <div className="accountant-dropdown-item" onClick={() => setIsEditProfileOpen(true)}>
                                            <i className="fas fa-user-edit"></i>
                                            Edit Profile
                                        </div>
                                        <div className="accountant-dropdown-item" onClick={handleLogout}>
                                            <i className="fas fa-sign-out-alt"></i>
                                            Sign Out
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="accountant-content">
                    {children}
                </main>
            </div>

            {/* Modern Edit Profile Modal */}
            {isEditProfileOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>Edit Profile</h2>
                            <button
                                className="modal-close"
                                onClick={() => setIsEditProfileOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    placeholder="Enter your email address"
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsEditProfileOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountantLayoutAntigravity;
