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

    const menuItems = [
        { path: '/accountant/rates', label: 'Set Live Rate' },
        { path: '/accountant/expenses', label: 'Expenses' },
        { path: '/accountant/stock', label: 'Stock Monitor' },
        { path: '/accountant/attendance', label: 'Attendance' },
        { path: '/accountant/leave', label: 'Leave' },
        { path: '/accountant/salaries', label: 'Salaries' },
        { path: '/accountant/bill-generation', label: 'Bill Generation' },
        { path: '/accountant/delivery-intake', label: 'Delivery Intake/Verify' },
        { path: '/accountant/documents', label: 'Documents' },
    ];

    return (
        <div className="modern-dashboard">
            {/* Modern Sidebar */}
            <aside className="modern-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-logo">
                        <img src="/images/logo.png" alt="Holy Family Polymers Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div className="brand-text">
                        <h3>Holy Family Polymers</h3>
                        <span>Accountant Module</span>
                    </div>
                </div>

                <nav className="sidebar-navigation">
                    <div className="nav-section">
                        <h4 className="nav-section-title">Main Menu</h4>
                        <ul className="nav-list">
                            {menuItems.map((item) => {
                                const validPath = item.path.startsWith('/') ? item.path : `/${item.path}`;
                                return (
                                    <li key={validPath} className="nav-item">
                                        <NavLink
                                            to={validPath}
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                        >
                                            <span className="nav-label">{item.label}</span>
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </nav>

                <div className="sidebar-logout">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FiLogOut className="logout-icon" />
                        <span className="logout-text">Logout</span>
                    </button>
                </div>
            </aside>

            <div className="main-wrapper">
                <header className="modern-header">
                    <div className="header-content">
                        <div className="header-left">
                            <div className="header-logo">
                                <img src="/images/logo.png" alt="Logo" />
                            </div>
                            <div className="header-greeting">
                                <h1>{getGreeting()}, {user?.name || 'Jeffin'}!</h1>
                                <p>Holy Family Polymers - Accountant Dashboard 👋</p>
                            </div>
                        </div>

                        <div className="header-actions">
                            {/* Notifications Dropdown */}
                            <div className="dropdown-wrapper" ref={notificationRef}>
                                <button
                                    className={`header-action-btn notification-btn ${isNotificationOpen ? 'active' : ''}`}
                                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                >
                                    <FiBell />
                                    <span className="notification-badge">{notifications.length}</span>
                                </button>

                                {isNotificationOpen && (
                                    <div className="dropdown-menu notification-dropdown">
                                        <div className="dropdown-header">
                                            <h4>Notifications</h4>
                                            <button onClick={() => navigate('/accountant/alerts')}>View All</button>
                                        </div>
                                        <div className="dropdown-list">
                                            {notifications.map(n => (
                                                <div key={n.id} className="dropdown-item">
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
                            <div className="dropdown-wrapper" ref={profileRef}>
                                <button
                                    className={`header-action-btn profile-icon-btn ${isProfileOpen ? 'active' : ''}`}
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    <FiUser />
                                </button>

                                {isProfileOpen && (
                                    <div className="dropdown-menu profile-dropdown">
                                        <div className="profile-info">
                                            <div className="profile-avatar">
                                                <FiUser />
                                            </div>
                                            <div className="profile-details">
                                                <p className="profile-name">{user?.name || 'Jeffin'}</p>
                                                <p className="profile-role">Accountant</p>
                                            </div>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item" onClick={() => setIsEditProfileOpen(true)}>
                                            <FiSettings /> <span>Edit Profile</span>
                                        </button>
                                        <button className="dropdown-item" onClick={handleLogout}>
                                            <FiLogOut /> <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="main-content">
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
