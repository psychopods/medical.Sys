import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './UserProfile.css';

import { API_ENDPOINTS, API_BASE_URL } from '../../config/endpoints.js';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    role: ''
  });
  
  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const navigate = useNavigate();

  // Icon components
  const IconEdit = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
    </svg>
  );

  const IconSave = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );

  const IconCancel = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );

  const IconUser = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const IconEmail = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7L12 13L2 7"/>
    </svg>
  );

  const IconPhone = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );

  const IconLock = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );

  const IconBriefcase = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );

  const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch current user profile
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.me, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        
        setProfileData({
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || userData.phoneNumber || userData.phone_number || '',
          username: userData.username || '',
          role: userData.roleName || userData.role || 'Staff'
        });
        
        // Update the stored user data
        const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          id: userData.id,
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName || userData.first_name,
          lastName: userData.lastName || userData.last_name,
          role: userData.role,
          phone: userData.phone || userData.phoneNumber || userData.phone_number
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setLoading(false);
        return;
      }
      
      // Fallback to stored user data
      const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      if (storedUser && storedUser.username) {
        setProfileData({
          firstName: storedUser.firstName || storedUser.first_name || '',
          lastName: storedUser.lastName || storedUser.last_name || '',
          email: storedUser.email || '',
          phone: storedUser.phone || storedUser.phone_number || '',
          username: storedUser.username || '',
          role: storedUser.role || 'Staff'
        });
        setLoading(false);
        return;
      }
      
      console.error('Failed to fetch profile');
      showToastMessage('Failed to load profile', 'error');
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToastMessage('Network error', 'error');
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async () => {
    setSaving(true);
    try {
      let userId = user?.id || user?.user_id;
      
      if (!userId) {
        const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        userId = storedUser.id || storedUser.user_id;
      }
      
      if (!userId) {
        showToastMessage('Unable to identify user', 'error');
        setSaving(false);
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.user(userId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: profileData.username,
          email: profileData.email,
          roleId: user?.roleId || user?.role_id,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone
        })
      });
      
      if (response.ok) {
        showToastMessage('Profile updated successfully');
        setIsEditing(false);
        
        // Update local storage user data
        const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        const errorData = await response.json();
        showToastMessage(errorData.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToastMessage('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Change password using the correct API endpoint
  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToastMessage('New passwords do not match', 'error');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showToastMessage('Password must be at least 6 characters', 'error');
      return;
    }
    
    setSaving(true);
    try {
      let userId = user?.id || user?.user_id;
      
      if (!userId) {
        const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        userId = storedUser.id || storedUser.user_id;
      }
      
      if (!userId) {
        showToastMessage('Unable to identify user', 'error');
        setSaving(false);
        return;
      }
      
      // Using the correct endpoint from the API docs: POST /api/auth/users/:id/reset-password
      const response = await fetch(API_ENDPOINTS.resetPassword(userId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          password: passwordData.newPassword
        })
      });
      
      if (response.ok) {
        showToastMessage('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.json();
        showToastMessage(errorData.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToastMessage('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchUserProfile();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Get user initials for avatar
  const getUserInitials = () => {
    const firstName = profileData.firstName || '';
    const lastName = profileData.lastName || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    return (profileData.username?.charAt(0).toUpperCase() || 'U');
  };

  // Get full name
  const getFullName = () => {
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    if (profileData.firstName) return profileData.firstName;
    if (profileData.lastName) return profileData.lastName;
    if (profileData.username) return profileData.username;
    return 'User';
  };

  const ToastNotification = () => {
    if (!toast.show) return null;
    return (
      <div className={`user-profile-toast ${toast.type}`}>
        <div className="user-profile-toast-content">
          {toast.type === 'success' && <span>✓</span>}
          {toast.type === 'error' && <span>✗</span>}
          {toast.type === 'info' && <span>ℹ</span>}
          <span>{toast.message}</span>
        </div>
        <button className="user-profile-toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="user-profile-loading">
          <div className="user-profile-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <ToastNotification />
      <div className="user-profile-container">
        <div className="user-profile-content">
          {/* Profile Header */}
          <div className="user-profile-header">
            <div className="user-profile-avatar">
              <span>{getUserInitials()}</span>
            </div>
            <div className="user-profile-header-info">
              <h1>{getFullName()}</h1>
              <p className="user-profile-role">
                <IconBriefcase /> {profileData.role}
              </p>
              <p className="user-profile-email">
                <IconEmail /> {profileData.email}
              </p>
            </div>
            {!isEditing && (
              <button className="user-profile-edit-btn" onClick={() => setIsEditing(true)}>
                <IconEdit /> Edit Profile
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="user-profile-tabs">
            <button 
              className={`user-profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <IconUser /> Profile Information
            </button>
            <button 
              className={`user-profile-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <IconLock /> Security
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="user-profile-section">
              {isEditing ? (
                <form onSubmit={(e) => { e.preventDefault(); updateUserProfile(); }} className="user-profile-form">
                  <div className="user-profile-form-row">
                    <div className="user-profile-form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="user-profile-form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="user-profile-form-row">
                    <div className="user-profile-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div className="user-profile-form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="user-profile-form-row">
                    <div className="user-profile-form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        value={profileData.username}
                        disabled
                        className="user-profile-disabled-input"
                      />
                      <small>Username cannot be changed</small>
                    </div>
                  </div>

                  <div className="user-profile-form-actions">
                    <button type="button" className="user-profile-cancel-btn" onClick={() => {
                      setIsEditing(false);
                      fetchUserProfile();
                    }}>
                      <IconCancel /> Cancel
                    </button>
                    <button type="submit" className="user-profile-save-btn" disabled={saving}>
                      <IconSave /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="user-profile-info-grid">
                  <div className="user-profile-info-card">
                    <div className="user-profile-info-icon"><IconUser /></div>
                    <div className="user-profile-info-content">
                      <label>Full Name</label>
                      <span>{getFullName()}</span>
                    </div>
                  </div>

                  <div className="user-profile-info-card">
                    <div className="user-profile-info-icon"><IconEmail /></div>
                    <div className="user-profile-info-content">
                      <label>Email Address</label>
                      <span>{profileData.email || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="user-profile-info-card">
                    <div className="user-profile-info-icon"><IconPhone /></div>
                    <div className="user-profile-info-content">
                      <label>Phone Number</label>
                      <span>{profileData.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="user-profile-info-card">
                    <div className="user-profile-info-icon"><IconBriefcase /></div>
                    <div className="user-profile-info-content">
                      <label>Username</label>
                      <span>{profileData.username}</span>
                    </div>
                  </div>

                  <div className="user-profile-info-card">
                    <div className="user-profile-info-icon"><IconBriefcase /></div>
                    <div className="user-profile-info-content">
                      <label>Role</label>
                      <span>{profileData.role}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="user-profile-section">
              <div className="user-profile-security-container">
                <h3>Change Password</h3>
                <p className="user-profile-security-hint">Choose a strong password that you don't use elsewhere</p>
                
                <form onSubmit={(e) => { e.preventDefault(); changePassword(); }} className="user-profile-form">
                  <div className="user-profile-form-row">
                    <div className="user-profile-form-group full-width">
                      <label>New Password</label>
                      <div className="user-profile-password-wrapper">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Enter new password"
                          required
                        />
                        <button type="button" className="user-profile-password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="user-profile-form-row">
                    <div className="user-profile-form-group full-width">
                      <label>Confirm New Password</label>
                      <div className="user-profile-password-wrapper">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="user-profile-password-requirements">
                    <h4>Password Requirements:</h4>
                    <ul>
                      <li className={passwordData.newPassword.length >= 6 ? 'valid' : ''}>
                        <IconCheck /> At least 6 characters
                      </li>
                      <li className={/[A-Z]/.test(passwordData.newPassword) ? 'valid' : ''}>
                        <IconCheck /> At least one uppercase letter
                      </li>
                      <li className={/[a-z]/.test(passwordData.newPassword) ? 'valid' : ''}>
                        <IconCheck /> At least one lowercase letter
                      </li>
                      <li className={/[0-9]/.test(passwordData.newPassword) ? 'valid' : ''}>
                        <IconCheck /> At least one number
                      </li>
                    </ul>
                  </div>

                  <div className="user-profile-form-actions">
                    <button type="submit" className="user-profile-save-btn" disabled={saving}>
                      <IconSave /> {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;