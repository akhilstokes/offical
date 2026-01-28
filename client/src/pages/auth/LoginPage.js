import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login, googleSignIn } = useAuth();

    const returnTo = location.state?.from || null;
    const { email, password } = formData;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (error) setError('');
    };
    
    const navigatePostLogin = (loggedInUser) => {
        if (loggedInUser && loggedInUser.role === 'lab') {
            if (returnTo && String(returnTo).startsWith('/lab')) {
                navigate(returnTo, { replace: true });
            } else {
                navigate('/lab/dashboard', { replace: true });
            }
            return;
        }
        if (loggedInUser && loggedInUser.role === 'accountant') {
            navigate('/accountant', { replace: true });
            return;
        }
        if (returnTo) {
            navigate(returnTo, { replace: true });
            return;
        }
        if (loggedInUser && loggedInUser.role === 'admin') {
            navigate('/admin/home', { replace: true });
        } else if (loggedInUser && loggedInUser.role === 'manager') {
            navigate('/manager/home', { replace: true });
        } else if (loggedInUser && loggedInUser.role === 'delivery_staff') {
            navigate('/delivery', { replace: true });
        } else if (loggedInUser && loggedInUser.role === 'field_staff') {
            navigate('/staff', { replace: true });
        } else {
            navigate('/user', { replace: true });
        }
    };

    const handleGoogleSignInSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError('');
            
            if (!credentialResponse?.credential) {
                throw new Error('No credential received from Google');
            }
            
            const res = await googleSignIn(credentialResponse.credential);
            navigatePostLogin(res?.user);
        } catch (err) {
            console.error('Google Sign-In Error:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Google Sign-In failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            
            const res = await login(email, password);
            navigatePostLogin(res.user);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred during login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-container">
                {/* Login Icon */}
                <div className="login-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
                    </svg>
                </div>

                {/* Title */}
                <div className="login-title">
                    <h1>Sign in with email</h1>
                </div>
                <p className="login-subtitle">
                    Access your dashboard to manage rubber manufacturing operations
                </p>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={onSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <input 
                                id="email"
                                type="email" 
                                name="email" 
                                value={email} 
                                onChange={handleChange}
                                placeholder="Email"
                                className="form-input"
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <input 
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password" 
                                value={password} 
                                onChange={handleChange}
                                placeholder="Password"
                                className="form-input"
                                required
                            />
                            <button 
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="forgot-password-link">
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>
                    
                    <button className="login-button" type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Get Started'}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">
                    <span>Or sign in with</span>
                </div>

                {/* Social Login - Google Only */}
                <div className="social-login">
                    <GoogleLogin
                        onSuccess={handleGoogleSignInSuccess}
                        onError={() => {
                            setError('Google Sign-In failed. Please try again.');
                        }}
                        useOneTap
                        theme="outline"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                    />
                </div>

                {/* Sign Up Link */}
                <div className="signup-link">
                    Don't have an account?
                    <Link to="/register">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
