import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AuthStyles.css';

import './ButtonFix.css';



const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`,
                { email }
            );
            setMessage(response.data.message || 'Password reset link has been sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while sending the reset link.');
        } finally {
            setIsLoading(false);
        }
    };

    return (

        <div className="modern-auth-wrapper">
            <div className="auth-container">
                {/* Background Elements */}
                <div className="bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>

                {/* Main Content */}
                <div className="auth-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="logo-section">
                            <div className="logo-icon">
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                    <rect width="40" height="40" rx="12" fill="url(#logoGradient)" />
                                    <path d="M12 20L18 14L28 24L22 30L12 20Z" fill="white" fillOpacity="0.9" />
                                    <defs>
                                        <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40">
                                            <stop stopColor="#3B82F6" />
                                            <stop offset="1" stopColor="#1D4ED8" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <div className="logo-text">
                                <h1>Holy Family Polymers</h1>
                                <p>Smart Manufacturing Solutions</p>
                            </div>
                        </div>

                        <Link to="/" className="back-home">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Home
                        </Link>
                    </div>

                    {/* Welcome Section */}
                    <div className="welcome-section welcome-premium-green">
                        <div className="reset-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" fill="currentColor" />
                                <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2>Reset Your Password</h2>
                        <p>Enter your email address and we'll send you a secure link to reset your password</p>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="alert alert-success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
                                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Reset Form */}
                    <form onSubmit={onSubmit} className="auth-form">
                        <div className="form-field">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button className="btn-primary" type="submit" disabled={isLoading}>
                            {isLoading && <div className="spinner"></div>}
                            {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="auth-footer">
                        <div className="signup-prompt">
                            Remember your password?
                            <Link to="/login" className="link-primary">
                                Sign In
                            </Link>
                        </div>
                        <div className="signup-prompt">
                            Don't have an account?
                            <Link to="/register" className="link-primary">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;