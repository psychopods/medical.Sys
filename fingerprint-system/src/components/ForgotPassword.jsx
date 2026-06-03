import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [resendTimer, setResendTimer] = useState(0);
  
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:9865';

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

  const checkPasswordStrength = (password) => {
    const criteria = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordCriteria(criteria);
    
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
    
    if (confirmPassword) {
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

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
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast(data.message || `OTP sent to ${email}`, 'success');
        setStep(2);
        setResendTimer(30);
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        showToast(data.message || 'Failed to send OTP. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const isValid = validateOTP(otp);
    if (!isValid) {
      showToast(otpError || 'Please enter a valid OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('OTP verified successfully!', 'success');
        setStep(3);
      } else {
        showToast(data.message || 'Invalid OTP. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Network error. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('New OTP sent to your email', 'success');
        setResendTimer(30);
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        showToast('Failed to resend OTP', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const isPasswordValid = checkPasswordStrength(newPassword);
    const isConfirmValid = validateConfirmPassword(confirmPassword);
    
    if (!isPasswordValid || !isConfirmValid) {
      showToast(passwordError || 'Please enter a valid password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('Password reset successfully! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showToast(data.message || 'Failed to reset password', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthPercentage = () => {
    const metCriteria = Object.values(passwordCriteria).filter(criteria => criteria === true).length;
    return (metCriteria / 5) * 100;
  };

  const getStrengthColor = () => {
    const percentage = getStrengthPercentage();
    if (percentage <= 20) return '#dc3545';
    if (percentage <= 40) return '#ff6b6b';
    if (percentage <= 60) return '#ffc107';
    if (percentage <= 80) return '#17a2b8';
    return '#28a745';
  };

  const getStrengthText = () => {
    const percentage = getStrengthPercentage();
    if (percentage <= 20) return 'Very Weak';
    if (percentage <= 40) return 'Weak';
    if (percentage <= 60) return 'Fair';
    if (percentage <= 80) return 'Good';
    return 'Strong';
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-hero">
        <div className="forgot-password-hero-content">
          <h1>Reset Password</h1>
          <p>Secure account recovery for TRHM Fingerprint System</p>
        </div>
      </div>

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

      <div className="forgot-password-container">
        <div className="forgot-password-wrapper">
          <div className="forgot-password-left">
            <div className="forgot-password-brand">
              <Link to="/" className="brand-link">
                <img 
                  src="/trhm.jpg" 
                  alt="TRHM Logo" 
                  className="brand-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <h2>TRHM System</h2>
              </Link>
              <p>Secure Biometric Authentication</p>
            </div>
            <div className="forgot-password-features">
              <div className="feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C10.6868 2 9.38642 2.25866 8.17317 2.7612C6.95991 3.26375 5.85752 4.00035 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C5.85752 19.9997 6.95991 20.7362 8.17317 21.2388C9.38642 21.7413 10.6868 22 12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h4>Secure Recovery</h4>
                  <p>Bank-grade encryption</p>
                </div>
              </div>
              <div className="feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6V12L16 14" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h4>Quick Process</h4>
                  <p>Reset in minutes</p>
                </div>
              </div>
              <div className="feature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              {step === 1 && (
                <>
                  <div className="forgot-password-header">
                    <h3>Forgot Password?</h3>
                    <p>Enter your email to receive a verification code</p>
                  </div>
                  <form onSubmit={handleSendOTP} className="forgot-password-form">
                    <div className="input-group">
                      <label>Email Address</label>
                      <div className={`input-icon ${emailError ? 'has-error' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <input type="email" placeholder="Enter your email" value={email} onChange={handleEmailChange} disabled={isLoading} />
                      </div>
                      {emailError && <div className="field-error">{emailError}</div>}
                    </div>
                    <button type="submit" className="reset-submit" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                  </form>
                  <div className="back-to-login">
                    <Link to="/login">← Back to Login</Link>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="forgot-password-header">
                    <h3>Verify OTP</h3>
                    <p>Enter the 6-digit code sent to {email}</p>
                  </div>
                  <form onSubmit={handleVerifyOTP} className="forgot-password-form">
                    <div className="input-group">
                      <label>Verification Code</label>
                      <div className={`input-icon ${otpError ? 'has-error' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/>
                          <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <input type="text" placeholder="Enter 6-digit code" maxLength="6" value={otp} onChange={handleOtpChange} disabled={isLoading} />
                      </div>
                      {otpError && <div className="field-error">{otpError}</div>}
                    </div>
                    <button type="submit" className="reset-submit" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </form>
                  <div className="resend-otp">
                    <button onClick={handleResendOTP} disabled={resendTimer > 0 || isLoading}>
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                  <div className="back-to-login">
                    <Link to="/login">← Back to Login</Link>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="forgot-password-header">
                    <h3>Reset Password</h3>
                    <p>Create a new password for your account</p>
                  </div>
                  <form onSubmit={handleResetPassword} className="forgot-password-form">
                    <div className="input-group">
                      <label>New Password</label>
                      <div className={`input-icon ${passwordError ? 'has-error' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <input type={showPassword ? "text" : "password"} placeholder="Enter new password" value={newPassword} onChange={handlePasswordChange} />
                        <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? '👁' : '👁‍🗨'}
                        </button>
                      </div>
                      {passwordError && <div className="field-error">{passwordError}</div>}
                      
                      {newPassword && !passwordError && (
                        <div className="password-strength">
                          <div className="strength-bar">
                            <div className="strength-fill" style={{ width: `${getStrengthPercentage()}%`, backgroundColor: getStrengthColor() }} />
                          </div>
                          <div className="strength-text" style={{ color: getStrengthColor() }}>Strength: {getStrengthText()}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="input-group">
                      <label>Confirm Password</label>
                      <div className={`input-icon ${confirmPasswordError ? 'has-error' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" value={confirmPassword} onChange={handleConfirmPasswordChange} />
                        <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? '👁' : '👁‍🗨'}
                        </button>
                      </div>
                      {confirmPasswordError && <div className="field-error">{confirmPasswordError}</div>}
                      {confirmPassword && !confirmPasswordError && newPassword === confirmPassword && (
                        <div className="password-match-success">✓ Passwords match</div>
                      )}
                    </div>
                    
                    <button type="submit" className="reset-submit" disabled={isLoading}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                  <div className="back-to-login">
                    <Link to="/login">← Back to Login</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;