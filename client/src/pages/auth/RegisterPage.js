import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import './RegisterPage.css';
import {
  cleanPhoneNumber,
  validateName,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateUserRegistration
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
    <div className="register-page-split">
      {/* Left Side - Branding */}
      <div className="register-brand-side">
        <div className="brand-decoration">
          <div className="decoration-circle decoration-1"></div>
          <div className="decoration-circle decoration-2"></div>
          <div className="decoration-circle decoration-3"></div>
        </div>

        <Link to="/" className="back-home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Home
        </Link>

        <div className="brand-logo">
          <div className="brand-logo-img">HFP</div>
        </div>

        <div className="brand-text">
          <h1>Join us</h1>
          <p>Smart Manufacturing Solutions</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="register-form-side">
        <div className="register-form-container">
          {/* Header */}
          <div className="form-header">
            <h2>Create Account</h2>
            <p>Enter your details to get started</p>
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

          {/* Messages */}
          {errors.general && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
              </svg>
              {errors.general}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* Registration Form - All Fields */}
          <form onSubmit={onSubmit} className="register-form">
            <div className={`form-field ${errors.name ? 'error' : ''} ${isValidName(name) ? 'valid' : ''}`}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="John Doe"
                maxLength={50}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
              {isValidName(name) && (
                <span className="field-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>

            <div className={`form-field ${errors.email ? 'error' : ''} ${isValidEmail(email) ? 'valid' : ''}`}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="hello@example.com"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
              {isValidEmail(email) && (
                <span className="field-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                placeholder="+1 (555) 000-0000"
                maxLength={15}
              />
              {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
              {isValidPhone(phoneNumber) && (
                <span className="field-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>

            <div className={`form-field ${errors.address ? 'error' : ''} ${isValidAddress(address) ? 'valid' : ''}`}>
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={address}
                onChange={onChange}
                placeholder="123 Main St, City, Country"
                rows="2"
                maxLength={500}
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
              {isValidAddress(address) && (
                <span className="field-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <small style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                Required for barrel delivery. Minimum 10 characters.
              </small>
            </div>

            <div className={`form-field ${errors.password ? 'error' : ''} ${isValidPassword(password) ? 'valid' : ''}`}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
              {isValidPassword(password) && (
                <span className="field-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              {isPasswordMatch(password, confirmPassword) && (
                <span className="field-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading && <div className="spinner"></div>}
              {isLoading ? 'Creating Account...' : 'Create Account'}
              {!isLoading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="auth-footer">
            <div className="signup-prompt">
              Already have an account?
              <Link to="/login" state={returnTo ? { from: returnTo } : undefined} className="link-primary">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
