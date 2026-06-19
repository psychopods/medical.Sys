// /home/labdoo/medical.Sys/fingerprint-system/src/components/NotificationBell.jsx

import React, { useState, useEffect, useRef } from 'react';
import { fetchNotifications, markNotificationAsRead } from './services/notificationService';
import './NotificationBell.css';
import { getUsers } from '../services/api.js';

import { API_ENDPOINTS, API_BASE_URL } from '../config/endpoints.js';

const NotificationBell = ({ user, refreshTrigger }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [users, setUsers] = useState([]);
  const dropdownRef = useRef(null);
  const loadTimeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch users for getting creator names
  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user || !isMountedRef.current) return;
    setLoading(true);
    try {
      const data = await fetchNotifications(false);
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
      setUnreadCount(notificationsArray.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications with debounce to prevent multiple rapid calls
  const debouncedLoadNotifications = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      loadNotifications();
    }, 100);
  };

  // Start/stop the refresh interval based on dropdown state
  const startRefreshInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isOpen && user) {
      intervalRef.current = setInterval(() => {
        loadNotifications();
      }, 5000);
    }
  };

  const stopRefreshInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Load notifications on mount and when refreshTrigger changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      fetchUsers();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [user]);

  // Handle refresh interval based on dropdown state
  useEffect(() => {
    if (isOpen) {
      stopRefreshInterval();
    } else {
      startRefreshInterval();
    }
    return () => {
      if (!isOpen) {
      }
    };
  }, [isOpen, user]);

  // Refresh when refreshTrigger changes from Layout (but only if dropdown is closed)
  useEffect(() => {
    if (user && refreshTrigger !== undefined && !isOpen) {
      debouncedLoadNotifications();
    }
  }, [refreshTrigger, user, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRefreshInterval();
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  // Toggle dropdown and manage refresh interval
  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      stopRefreshInterval();
      loadNotifications();
    } else {
      startRefreshInterval();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) {
          setIsOpen(false);
          setExpandedNotification(null);
          startRefreshInterval();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation();
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setExpandedNotification(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    for (const notification of notifications) {
      await markNotificationAsRead(notification.id);
    }
    setNotifications([]);
    setUnreadCount(0);
    setExpandedNotification(null);
  };

  const toggleExpand = (notification, event) => {
    event.stopPropagation();
    setExpandedNotification(expandedNotification === notification.id ? null : notification.id);
  };

  // Get creator name
  const getCreatorName = (createdByStaffId) => {
    if (!createdByStaffId) return 'System';
    const userFound = users.find(u => u.id === createdByStaffId);
    if (userFound?.firstName && userFound?.lastName) {
      return `${userFound.firstName} ${userFound.lastName}`;
    }
    if (userFound?.username) return userFound.username;
    return 'Unknown';
  };

  // ===== FIXED DATE FORMATTING WITH PROPER TIME HANDLING =====
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      // Parse the date string - handle both ISO and timestamp formats
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      
      // Calculate time difference in milliseconds
      const diffMs = now.getTime() - date.getTime();
      
      // If the date is in the future, show the actual date and time
      if (diffMs < 0) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Show relative time for recent notifications
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      // For older notifications, show the actual date and time
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  // SVG Icons for notification types
  const IconSystem = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const IconAnnouncement = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const IconEvent = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const IconDefault = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const IconEmptyBell = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const IconCheck = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const getNotificationIconComponent = (type) => {
    switch(type) {
      case 'SYSTEM': return <IconSystem />;
      case 'ANNOUNCEMENT': return <IconAnnouncement />;
      case 'EVENT': return <IconEvent />;
      default: return <IconDefault />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'SYSTEM': return '#6c757d';
      case 'ANNOUNCEMENT': return '#0066cc';
      case 'EVENT': return '#28a745';
      default: return '#64748b';
    }
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
        title="Notifications"
      >
        <IconAnnouncement />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="notification-spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <IconEmptyBell />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${expandedNotification === notification.id ? 'expanded' : ''}`}
                >
                  <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
                    {getNotificationIconComponent(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">
                      {expandedNotification === notification.id 
                        ? notification.message 
                        : notification.message.length > 80 
                          ? `${notification.message.substring(0, 80)}...` 
                          : notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-creator">
                        By: {getCreatorName(notification.createdByStaffId)}
                      </span>
                      <span className="notification-time-separator">•</span>
                      <span className="notification-time">{formatDate(notification.createdAt)}</span>
                    </div>
                    {notification.message.length > 80 && (
                      <button 
                        className="notification-expand-btn"
                        onClick={(e) => toggleExpand(notification, e)}
                      >
                        {expandedNotification === notification.id ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                  <button 
                    className="notification-read-btn"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    title="Mark as read"
                  >
                    <IconCheck />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;