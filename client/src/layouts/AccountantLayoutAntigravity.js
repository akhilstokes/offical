import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiBell, FiUser, FiLogOut
} from 'react-icons/fi';
import './AccountantLayout.css';

const AccountantLayoutAntigravity = ({ children }) => {
    const navigate = useNavigate();
    const { user, updateProfile, logout } = useAuth();

    // Edit Profile State
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', email: '' });

    // Initialize form data when user data is available
    React.useEffect(() => {
        if (user) {
            setEditFormData({ name: user.name || '', email: user.email || '' });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(editFormData);
            setIsEditProfileOpen(false);
            // Optional: Show success notification
        } catch (error) {
            console.error('Failed to update profile', error);
            // Optional: Show error
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

    // Get current time for greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        else if (hour < 18) return "Good Afternoon";
        else return "Good Evening";
    };

    const menuItems = [
        { path: '/accountant/wages', label: 'Auto Wages' },
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
                {/* Logo Section */}
                <div className="sidebar-brand">
                    <div className="brand-logo">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="8" fill="url(#brandGradient)" />
                            <path d="M8 16L14 10L24 20L18 26L8 16Z" fill="white" fillOpacity="0.9" />
                            <defs>
                                <linearGradient id="brandGradient" x1="0" y1="0" x2="32" y2="32">
                                    <stop stopColor="#3B82F6" />
                                    <stop offset="1" stopColor="#1D4ED8" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="brand-text">
                        <h3>Holy Family Polymers</h3>
                        <span>Accountant Module</span>
                    </div>
                </div>

                {/* Navigation Menu */}
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

                {/* Logout Section */}
                <div className="sidebar-logout">
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <FiLogOut className="logout-icon" />
                        <span className="logout-text">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="main-wrapper">
                {/* Modern Header */}
                <header className="modern-header">
                    <div className="header-content">
                        {/* Greeting Section */}
                        <div className="header-greeting">
                            <h1>{getGreeting()}, {user?.name || 'Jeffin'}!</h1>
                            <p>Welcome to your dashboard 👋</p>
                        </div>

                        {/* Header Actions */}
                        <div className="header-actions">
                            {/* Notifications */}
                            <button
                                className="header-action-btn notification-btn"
                                onClick={() => navigate('/accountant/alerts')}
                                title="Notifications"
                            >
                                <FiBell />
                                <span className="notification-badge">3</span>
                            </button>

                            {/* Profile Icon */}
                            <button
                                className="header-action-btn profile-icon-btn"
                                onClick={() => navigate('/accountant/wages')}
                                title="Dashboard"
                            >
                                <FiUser />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
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
