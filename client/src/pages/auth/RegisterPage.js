import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import './AuthStyles.css';

import './ButtonFix.css';
import {
  cleanPhoneNumber,
  validateUserRegistration,
  validateName,
  validateEmail,
  validatePhoneNumber,
  validatePassword
} from '../../utils/validation';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '', // Add address field
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { register, googleSignIn } = useAuth();

  const returnTo = location.state?.from || null;
  const { name, email, phoneNumber, address, password, confirmPassword } = formData;

  // ✅ Validation helpers
  const isValidName = (v) => validateName(v)?.valid || v.length > 2;
  const isValidEmail = (v) => !validateEmail(v);
  const isValidPhone = (v) => !validatePhoneNumber(v);
  const isValidAddress = (v) => v && v.trim().length >= 10; // Address must be at least 10 characters
  const isValidPassword = (v) => !validatePassword(v);
  const isPasswordMatch = (a, b) => a === b && !!a;

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleKeyDown = (e) => {
    if (
      ['name', 'email', 'phoneNumber', 'password', 'confirmPassword'].includes(e.target.name) &&
      e.key === ' '
    ) {
      e.preventDefault();
    }
    // Allow spaces in address field
  };

  const validateForm = () => {
    const newErrors = validateUserRegistration(formData) || {};
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignInSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      await googleSignIn(credentialResponse.credential);
      navigate('/user', { replace: true });
    } catch {
      setErrors({ general: 'Google Sign-In failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');

    if (validateForm()) {
      try {
        const finalPhoneNumber = cleanPhoneNumber(phoneNumber);
        const registrationData = {
          name,
          email,
          phoneNumber: finalPhoneNumber,
          address: address.trim(), // Include address
          password
        };

        await register(registrationData);

        setSuccessMessage('🎉 Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: { registrationSuccess: true, email }
          });
        }, 2000);
      } catch (err) {
        console.error('❌ Registration error:', err);
        const message = err.response?.data?.message || '';
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors);
        } else if (/already exists/i.test(message)) {
          setErrors({ email: message });
        } else {
          setErrors({ general: message || 'An error occurred during registration.' });
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
                  <rect width="40" height="40" rx="12" fill="url(#logoGradient)"/>
                  <path d="M12 20L18 14L28 24L22 30L12 20Z" fill="white" fillOpacity="0.9"/>
                  <defs>
                    <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40">
                      <stop stopColor="#3B82F6"/>
                      <stop offset="1" stopColor="#1D4ED8"/>
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
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </Link>
          </div>

          {/* Welcome Section */}
          <div className="welcome-section">
            <h2>Create Your Account</h2>
            <p>Join Holy Family Polymers and start managing your operations efficiently</p>
          </div>

          {/* Google Sign Up */}
          <div className="google-login-container">
            <GoogleLogin
              onSuccess={handleGoogleSignInSuccess}
              onError={() => setErrors({ general: 'Google Sign-In failed. Please try again.' })}
              disabled={isLoading}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          <div className="divider">
            <span>or sign up with email</span>
          </div>

          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span>Personal Info</span>
            </div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Security</span>
            </div>
          </div>

          {/* Messages */}
          {errors.general && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {errors.general}
            </div>
          )}
          
          {successMessage && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {successMessage}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={onSubmit} className="auth-form">
            {step === 1 && (
              <>
                <div className={`form-field ${errors.name ? 'error' : ''} ${isValidName(name) ? 'valid' : ''}`}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={name}
                    onChange={onChange}
                    placeholder="Enter your full name"
                    maxLength={50}
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                  {isValidName(name) && (
                    <span className="field-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>

                <div className={`form-field ${errors.email ? 'error' : ''} ${isValidEmail(email) ? 'valid' : ''}`}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    placeholder="Enter your email address"
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                  {isValidEmail(email) && (
                    <span className="field-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>

                <div className={`form-field ${errors.phoneNumber ? 'error' : ''} ${isValidPhone(phoneNumber) ? 'valid' : ''}`}>
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    id="phoneNumber"
                    type="text"
                    name="phoneNumber"
                    value={phoneNumber}
                    onChange={onChange}
                    placeholder="Enter your phone number"
                    maxLength={15}
                  />
                  {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
                  {isValidPhone(phoneNumber) && (
                    <span className="field-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>

                <div className={`form-field ${errors.address ? 'error' : ''} ${isValidAddress(address) ? 'valid' : ''}`}>
                  <label htmlFor="address">Complete Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={address}
                    onChange={onChange}
                    placeholder="Enter your complete address (house/building, street, area, city, pincode)"
                    rows="3"
                    maxLength={500}
                    style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                  {isValidAddress(address) && (
                    <span className="field-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Required for barrel delivery. Minimum 10 characters.
                  </small>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className={`form-field ${errors.password ? 'error' : ''} ${isValidPassword(password) ? 'valid' : ''}`}>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Create a strong password"
                  />
                  {errors.password && <span className="field-error">{errors.password}</span>}
                  {isValidPassword(password) && (
                    <span className="field-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>

                <div className={`form-field ${errors.confirmPassword ? 'error' : ''} ${isPasswordMatch(password, confirmPassword) ? 'valid' : ''}`}>
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                  {isPasswordMatch(password, confirmPassword) && (
                    <span className="field-success">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              {step > 1 && (
                <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Previous
                </button>
              )}
              
              {step < 2 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (!isValidName(name)) return setErrors({ name: 'Please enter a valid name' });
                    if (!isValidEmail(email)) return setErrors({ email: 'Please enter a valid email address' });
                    if (!isValidPhone(phoneNumber)) return setErrors({ phoneNumber: 'Please enter a valid phone number' });
                    if (!isValidAddress(address)) return setErrors({ address: 'Please enter your complete address (minimum 10 characters)' });
                    setStep(2);
                  }}
                >
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <button className="btn-primary" type="submit" disabled={isLoading}>
                  {isLoading && <div className="spinner"></div>}
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>
          </form>

          {/* Footer Links */}
          <div className="auth-footer">
            <div className="signup-prompt">
              Already have an account? 
              <Link to="/login" state={returnTo ? { from: returnTo } : undefined} className="link-primary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
