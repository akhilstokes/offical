import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    const location = useLocation();


    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);

    const isHome = location.pathname === '/';



    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            navigate('/login');
        }
    };

    return (

        <nav className={`navbar${scrolled ? ' scrolled' : ''} ${isHome ? 'home-nav' : ''}`}>
            <div className="navbar-container">
                {/* Logo Section */}
                <div className="navbar-logo">
                    <Link to="/" className="navbar-brand-logo">
                        <img
                            src="/images/logo.png"
                            alt="Company Logo"
                            className="company-logo"
                        />
                    </Link>
                </div>

                {/* Navigation Menu */}
                <div className="navbar-menu">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Home
                    </NavLink>
                    
                    <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        About Us
                    </NavLink>

                    <NavLink to="/awards" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Awards
                    </NavLink>

                    <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Contact
                    </NavLink>

                    <NavLink to="/gallery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Gallery
                    </NavLink>
                </div>

                {/* Auth Section */}
                <div className="navbar-auth">
                    {!isAuthenticated ? (
                        <div className="auth-buttons">
                            <Link to="/register" className="auth-btn signup-btn">
                                Sign Up
                            </Link>
                            <Link to="/login" className="auth-btn login-btn">
                                Sign In
                            </Link>
                        </div>
                    ) : (
                        <div className="profile-menu" ref={menuRef}>
                            <button type="button" className="profile-btn" onClick={() => setMenuOpen(v => !v)}>
                                <i className="fas fa-user-circle"></i>
                                {user?.name ? `${user.name.split(' ')[0]}` : 'Profile'}
                            </button>
                            {menuOpen && (
                                <div className="profile-dropdown">
                                    <NavLink to="/user/profile/view" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                                        <i className="fas fa-eye"></i>
                                        <span>View Profile</span>
                                    </NavLink>
                                    <NavLink to="/user/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                                        <i className="fas fa-pen"></i>
                                        <span>Edit Profile</span>
                                    </NavLink>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                                        <i className="fas fa-sign-out-alt"></i>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
