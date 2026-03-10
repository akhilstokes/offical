import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LanguageContext } from '../../contexts/LanguageContext';
import { useContext } from 'react';
import './Navbar.css';

const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const { language, setLanguage, t } = useContext(LanguageContext);
    const navigate = useNavigate();

    const location = useLocation();


    const [menuOpen, setMenuOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const menuRef = useRef(null);
    const langRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const isHome = location.pathname === '/';



    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
            if (langRef.current && !langRef.current.contains(e.target)) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.body.classList.add('dark-mode');
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

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
                        {t('nav.home')}
                    </NavLink>

                    <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        {t('nav.about')}
                    </NavLink>

                    <NavLink to="/awards" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        {t('nav.awards')}
                    </NavLink>

                    <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        {t('nav.contact')}
                    </NavLink>

                    <NavLink to="/gallery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        {t('nav.gallery')}
                    </NavLink>
                </div>

                {/* Auth & Settings Section */}
                <div className="navbar-auth">
                    {/* Settings Toggles (Theme & Language) */}
                    <div className="nav-settings-group">
                        <button
                            className="nav-icon-btn"
                            onClick={toggleTheme}
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                        </button>

                        <div className="nav-lang-menu" ref={langRef}>
                            <button
                                className="nav-icon-btn"
                                onClick={() => setLangOpen(!langOpen)}
                                title="Change Language"
                            >
                                <i className="fas fa-globe"></i>
                            </button>
                            {langOpen && (
                                <div className="nav-lang-dropdown">
                                    <button
                                        className={`lang-item ${language === 'en' ? 'active' : ''}`}
                                        onClick={() => { setLanguage('en'); setLangOpen(false); }}
                                    >
                                        English
                                    </button>
                                    <button
                                        className={`lang-item ${language === 'ml' ? 'active' : ''}`}
                                        onClick={() => { setLanguage('ml'); setLangOpen(false); }}
                                    >
                                        മലയാളം
                                    </button>
                                    <button
                                        className={`lang-item ${language === 'hi' ? 'active' : ''}`}
                                        onClick={() => { setLanguage('hi'); setLangOpen(false); }}
                                    >
                                        हिन्दी
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isAuthenticated ? (
                        <div className="auth-buttons">
                            <Link to="/register" className="auth-btn signup-btn">
                                {t('nav.signup')}
                            </Link>
                            <Link to="/login" className="auth-btn login-btn">
                                {t('nav.signin')}
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
