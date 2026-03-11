import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="login-page-split">
            {/* Left Side - Branding */}
            <div className="login-brand-side">
                <div className="brand-logo">
                    <img src="/images/logo.png" alt="HFP Logo" className="brand-logo-img" />
                </div>
                <div className="brand-text">
                    <h1>Welcome Back</h1>
                    <p>Holy Family Polymers</p>
                </div>
                <div className="brand-decoration">
                    <div className="decoration-circle decoration-1"></div>
                    <div className="decoration-circle decoration-2"></div>
                    <div className="decoration-circle decoration-3"></div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="login-form-side">
                <div className="login-form-container">
                    <div className="form-header">
                        <h2>Sign In</h2>
                        <p>Enter your details to access your account.</p>
                    </div>

                    {error && (
                        <div className="error-alert">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="signin-form">
                        <div className="form-field">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-group">
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder="hello@example.com"
                                    required
                                />
                                <span className="input-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        <div className="form-field">
                            <div className="field-header">
                                <label htmlFor="password">Password</label>
                                <Link to="/forgot-password" className="forgot-link">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="input-group">
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
                                <span className="input-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path d="M12.93 5.93A10 10 0 0012 6c-4.478 0-8.268 2.943-9.543 7a9.97 9.97 0 001.563 3.029m5.858.908a3 3 0 114.243-4.243M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        <button className="signin-button" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="button-spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="divider-line">
                        <span>Or continue with</span>
                    </div>

                    <div className="google-signin">
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
                            width="100%"
                        />
                    </div>

                    <div className="signup-prompt">
                        Don't have an account?
                        <Link to="/register" className="signup-link-text">Sign up for free</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
