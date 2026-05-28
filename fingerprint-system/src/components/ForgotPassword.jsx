import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [resendTimer, setResendTimer] = useState(0);
  
  // Field error states
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const navigate = useNavigate();

  // Password strength criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Validate email
  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('Email is required');
    }
  };

  // Validate OTP
  const validateOTP = (otpValue) => {
    if (!otpValue) {
      setOtpError('OTP is required');
      return false;
    } else if (otpValue.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return false;
    } else if (!/^\d+$/.test(otpValue)) {
      setOtpError('OTP must contain only numbers');
      return false;
    } else {
      setOtpError('');
      return true;
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setOtp(value);
    if (value && value.length === 6) {
      setOtpError('');
    } else if (value && value.length < 6) {
      setOtpError('OTP must be 6 digits');
    } else if (!value) {
      setOtpError('OTP is required');
    }
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    const criteria = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordCriteria(criteria);
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    } else if (!criteria.hasUppercase) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    } else if (!criteria.hasLowercase) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    } else if (!criteria.hasNumber) {
      setPasswordError('Password must contain at least one number');
      return false;
    } else if (!criteria.hasSpecialChar) {
      setPasswordError('Password must contain at least one special character');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    checkPasswordStrength(password);
    
    // Also validate confirm password if it exists
    if (confirmPassword) {
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  // Validate confirm password
  const validateConfirmPassword = (confirmValue) => {
    if (!confirmValue) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    } else if (confirmValue !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (!value) {
      setConfirmPasswordError('Please confirm your password');
    } else if (value !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    const isValid = validateEmail(email);
    
    if (!isValid) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      showToast(`OTP sent to ${email}`, 'success');
      setStep(2);
      setIsLoading(false);
      setResendTimer(30);
      
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1500);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    const isValid = validateOTP(otp);
    
    if (!isValid) {
      showToast(otpError || 'Please enter a valid OTP', 'error');
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      showToast('OTP verified successfully!', 'success');
      setStep(3);
      setIsLoading(false);
    }, 1500);
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    setTimeout(() => {
      showToast('New OTP sent to your email', 'success');
      setIsLoading(false);
      setResendTimer(30);
      
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1000);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate password
    const isPasswordValid = checkPasswordStrength(newPassword);
    const isConfirmValid = validateConfirmPassword(confirmPassword);
    
    if (!isPasswordValid) {
      showToast(passwordError || 'Please enter a valid password', 'error');
      return;
    }
    
    if (!isConfirmValid) {
      showToast(confirmPasswordError, 'error');
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      showToast('Password reset successfully! Redirecting to login...', 'success');
      setIsLoading(false);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }, 1500);
  };

  // Calculate password strength percentage
  const getStrengthPercentage = () => {
    const metCriteria = Object.values(passwordCriteria).filter(criteria => criteria === true).length;
    return (metCriteria / 5) * 100;
  };

  // Get strength color
  const getStrengthColor = () => {
    const percentage = getStrengthPercentage();
    if (percentage <= 20) return '#dc3545';
    if (percentage <= 40) return '#ff6b6b';
    if (percentage <= 60) return '#ffc107';
    if (percentage <= 80) return '#17a2b8';
    return '#28a745';
  };

  // Get strength text
  const getStrengthText = () => {
    const percentage = getStrengthPercentage();
    if (percentage <= 20) return 'Very Weak';
    if (percentage <= 40) return 'Weak';
    if (percentage <= 60) return 'Fair';
    if (percentage <= 80) return 'Good';
    return 'Strong';
  };

  return (
    <div className="forgot-password-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      <div className="forgot-password-wrapper">
        <div className="forgot-password-left">
          <div className="forgot-password-brand">
            <Link to="/" className="brand-link">
              <svg className="brand-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="#00b4d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="#00b4d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="#00b4d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 12C18 8.69 15.31 6 12 6" stroke="#00b4d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h2>Fingerprint System</h2>
            </Link>
            <p>Secure Biometric Authentication</p>
          </div>
          <div className="forgot-password-features">
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C10.6868 2 9.38642 2.25866 8.17317 2.7612C6.95991 3.26375 5.85752 4.00035 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C5.85752 19.9997 6.95991 20.7362 8.17317 21.2388C9.38642 21.7413 10.6868 22 12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h4>Secure Recovery</h4>
                <p>Bank-grade encryption</p>
              </div>
            </div>
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h4>Quick Process</h4>
                <p>Reset in minutes</p>
              </div>
            </div>
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h4>24/7 Support</h4>
                <p>Always here to help</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="forgot-password-right">
          <div className="forgot-password-form-container">
            {/* Step 1: Email Input */}
            {step === 1 && (
              <>
                <div className="forgot-password-header">
                  <h3>Forgot Password?</h3>
                  <p>Enter your email address to receive a verification code</p>
                </div>
                
                <form onSubmit={handleSendOTP} className="forgot-password-form" noValidate>
                  <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <div className={`input-icon ${emailError ? 'has-error' : ''}`}>
                      <svg className="input-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        type="email"
                        id="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={handleEmailChange}
                        onBlur={() => validateEmail(email)}
                        required
                        disabled={isLoading}
                        className={emailError ? 'error-input' : ''}
                      />
                    </div>
                    {emailError && <div className="field-error">{emailError}</div>}
                  </div>
                  
                  <button type="submit" className="reset-submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 2C14.6522 2 17.1957 3.05357 19.0711 4.92893" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Send Reset Code
                      </>
                    )}
                  </button>
                </form>
                
                <div className="back-to-login">
                  <Link to="/login">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Login
                  </Link>
                </div>
              </>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <>
                <div className="forgot-password-header">
                  <h3>Verify OTP</h3>
                  <p>Enter the 6-digit code sent to {email}</p>
                </div>
                
                <form onSubmit={handleVerifyOTP} className="forgot-password-form" noValidate>
                  <div className="input-group">
                    <label htmlFor="otp">Verification Code</label>
                    <div className={`input-icon ${otpError ? 'has-error' : ''}`}>
                      <svg className="input-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
                        <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2"/>
                        <line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <input
                        type="text"
                        id="otp"
                        placeholder="Enter 6-digit code"
                        maxLength="6"
                        value={otp}
                        onChange={handleOtpChange}
                        onBlur={() => validateOTP(otp)}
                        required
                        disabled={isLoading}
                        className={otpError ? 'error-input' : ''}
                      />
                    </div>
                    {otpError && <div className="field-error">{otpError}</div>}
                  </div>
                  
                  <button type="submit" className="reset-submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 2C14.6522 2 17.1957 3.05357 19.0711 4.92893" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </button>
                </form>
                
                <div className="resend-otp">
                  <button 
                    onClick={handleResendOTP} 
                    disabled={resendTimer > 0 || isLoading}
                    className="resend-btn"
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
                
                <div className="back-to-login">
                  <Link to="/login">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Login
                  </Link>
                </div>
              </>
            )}

            {/* Step 3: Reset Password */}
            {step === 3 && (
              <>
                <div className="forgot-password-header">
                  <h3>Reset Password</h3>
                  <p>Create a new password for your account</p>
                </div>
                
                <form onSubmit={handleResetPassword} className="forgot-password-form" noValidate>
                  <div className="input-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className={`input-icon ${passwordError ? 'has-error' : ''}`}>
                      <svg className="input-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={handlePasswordChange}
                        onBlur={() => checkPasswordStrength(newPassword)}
                        required
                        disabled={isLoading}
                        className={passwordError ? 'error-input' : ''}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.07887 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M4.73 4.73L19.27 19.27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordError && <div className="field-error">{passwordError}</div>}
                    
                    {/* Password Strength Indicator */}
                    {newPassword && !passwordError && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div 
                            className="strength-fill"
                            style={{
                              width: `${getStrengthPercentage()}%`,
                              backgroundColor: getStrengthColor()
                            }}
                          />
                        </div>
                        <div className="strength-text" style={{ color: getStrengthColor() }}>
                          Password Strength: {getStrengthText()}
                        </div>
                      </div>
                    )}
                    
                    {/* Password Criteria List */}
                    {newPassword && (
                      <div className="password-criteria">
                        <div className={`criteria-item ${passwordCriteria.minLength ? 'met' : ''}`}>
                          {passwordCriteria.minLength ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`criteria-item ${passwordCriteria.hasUppercase ? 'met' : ''}`}>
                          {passwordCriteria.hasUppercase ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                          <span>At least one uppercase letter</span>
                        </div>
                        <div className={`criteria-item ${passwordCriteria.hasLowercase ? 'met' : ''}`}>
                          {passwordCriteria.hasLowercase ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                          <span>At least one lowercase letter</span>
                        </div>
                        <div className={`criteria-item ${passwordCriteria.hasNumber ? 'met' : ''}`}>
                          {passwordCriteria.hasNumber ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                          <span>At least one number</span>
                        </div>
                        <div className={`criteria-item ${passwordCriteria.hasSpecialChar ? 'met' : ''}`}>
                          {passwordCriteria.hasSpecialChar ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                          <span>At least one special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className={`input-icon ${confirmPasswordError ? 'has-error' : ''}`}>
                      <svg className="input-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        onBlur={() => validateConfirmPassword(confirmPassword)}
                        required
                        disabled={isLoading}
                        className={confirmPasswordError ? 'error-input' : ''}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.07887 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M4.73 4.73L19.27 19.27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {confirmPasswordError && <div className="field-error">{confirmPasswordError}</div>}
                    {confirmPassword && !confirmPasswordError && newPassword === confirmPassword && (
                      <div className="password-match-success">
                        ✓ Passwords match
                      </div>
                    )}
                  </div>
                  
                  <button type="submit" className="reset-submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 2C14.6522 2 17.1957 3.05357 19.0711 4.92893" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
                
                <div className="back-to-login">
                  <Link to="/login">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;