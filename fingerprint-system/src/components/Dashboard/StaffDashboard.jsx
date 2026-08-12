import React, { useState, useEffect, useRef, useCallback } from 'react';
import './StaffDashboard.css';

const StaffDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState([
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '32', 
      label: 'Children Supported',
      trend: '+15%',
      trendUp: true,
      color: 'blue'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C20.9464 6.8043 22 9.34784 22 12C22 14.6522 20.9464 17.1957 19.0711 19.0711C18.1425 19.9997 17.0401 20.7362 15.8268 21.2388C14.6136 21.7413 13.3132 22 12 22C9.34784 22 6.8043 20.9464 4.92893 19.0711C3.05357 17.1957 2 14.6522 2 12C2 9.34784 3.05357 6.8043 4.92893 4.92893C5.85752 4.00035 6.95991 3.26375 8.17317 2.7612C9.38642 2.25866 10.6868 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '48', 
      label: 'Food Supports',
      trend: '+8%',
      trendUp: true,
      color: 'green'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '56', 
      label: 'Clothes Provided',
      trend: '+12%',
      trendUp: true,
      color: 'purple'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '24', 
      label: 'Education Supports',
      trend: '+5%',
      trendUp: true,
      color: 'orange'
    },
  ]);

  const [recentSupports, setRecentSupports] = useState([
    { id: 1, child: 'James Mwangi', type: 'Food Support', date: '2026-08-10', status: 'completed' },
    { id: 2, child: 'Sarah Akinyi', type: 'Clothing', date: '2026-08-09', status: 'completed' },
    { id: 3, child: 'David Ochieng', type: 'Education Support', date: '2026-08-08', status: 'pending' },
    { id: 4, child: 'Mary Atieno', type: 'Counselling', date: '2026-08-07', status: 'completed' },
    { id: 5, child: 'Joseph Odhiambo', type: 'Food Support', date: '2026-08-06', status: 'pending' },
  ]);

  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Helper function to get user's display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.lastName) {
      return user.lastName;
    }
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.last_name) {
      return user.last_name;
    }
    if (user.username) {
      return user.username;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Quick Actions
  const quickActions = [
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C20.9464 6.8043 22 9.34784 22 12C22 14.6522 20.9464 17.1957 19.0711 19.0711C18.1425 19.9997 17.0401 20.7362 15.8268 21.2388C14.6136 21.7413 13.3132 22 12 22C9.34784 22 6.8043 20.9464 4.92893 19.0711C3.05357 17.1957 2 14.6522 2 12C2 9.34784 3.05357 6.8043 4.92893 4.92893C5.85752 4.00035 6.95991 3.26375 8.17317 2.7612C9.38642 2.25866 10.6868 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Provide Food Support', 
      desc: 'Record food assistance', 
      action: () => alert('Food Support Form'),
      color: 'green'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Provide Clothes', 
      desc: 'Record clothing assistance', 
      action: () => alert('Clothes Form'),
      color: 'blue'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Education Support', 
      desc: 'Record educational aid', 
      action: () => alert('Education Form'),
      color: 'purple'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5C21 16.1944 17.1944 20 12.5 20C11.599 20 10.7345 19.8607 9.92452 19.5998L3 21L4.40023 14.0755C4.13929 13.2655 4 12.401 4 11.5C4 6.80558 7.80558 3 12.5 3C17.1944 3 21 6.80558 21 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Counselling', 
      desc: 'Record social support', 
      action: () => alert('Counselling Form'),
      color: 'orange'
    },
  ];

  const getStatusClass = (status) => {
    const classes = {
      'completed': 'sd-status-completed',
      'pending': 'sd-status-pending',
      'in-progress': 'sd-status-progress'
    };
    return classes[status] || 'sd-status-default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'completed': 'Completed',
      'pending': 'Pending',
      'in-progress': 'In Progress'
    };
    return labels[status] || status;
  };

  // Silent refresh function
  const refreshData = useCallback(async (showSpinner = false) => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    
    if (showSpinner) {
      setIsRefreshing(true);
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      isRefreshingRef.current = false;
      if (showSpinner) {
        setIsRefreshing(false);
      }
    }
  }, []);

  const startBackgroundRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      refreshData(false);
    }, 30000);
  }, [refreshData]);

  const stopBackgroundRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    refreshData(true);
    startBackgroundRefresh();
    return () => {
      stopBackgroundRefresh();
    };
  }, [startBackgroundRefresh, stopBackgroundRefresh]);

  const displayName = getUserDisplayName();

  return (
    <div className="sd-dashboard">
      {/* Silent Refresh Indicator */}
      <div className="sd-refresh-indicator">
        {isRefreshing && (
          <span className="sd-refresh-spinner"></span>
        )}
        {lastRefreshed && (
          <span className="sd-refresh-time">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Welcome Section */}
      <div className="sd-welcome-section">
        <div className="sd-welcome-text">
          <h1>Welcome back, {displayName}!</h1>
          <p>Here's an overview of your social support activities</p>
        </div>
        <div className="sd-welcome-date">
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="sd-stats-grid">
        {stats.map((stat, index) => (
          <div className={`sd-stat-card sd-stat-${stat.color}`} key={index}>
            <div className="sd-stat-icon">{stat.icon}</div>
            <div className="sd-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span className={`sd-stat-trend ${stat.trendUp ? 'sd-trend-up' : 'sd-trend-down'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="sd-section-header">
        <h2>Quick Actions</h2>
        <span className="sd-section-badge">4 actions</span>
      </div>
      <div className="sd-actions-grid">
        {quickActions.map((action, index) => (
          <div className={`sd-action-card sd-action-${action.color}`} key={index} onClick={action.action}>
            <div className="sd-action-icon">{action.icon}</div>
            <div className="sd-action-info">
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
            <span className="sd-action-arrow">→</span>
          </div>
        ))}
      </div>

      {/* Recent Social Supports */}
      <div className="sd-section-header">
        <h2>Recent Social Supports</h2>
        <span className="sd-section-badge sd-support-count">{recentSupports.length} records</span>
      </div>
      <div className="sd-supports-table">
        <table>
          <thead>
            <tr>
              <th>Child</th>
              <th>Support Type</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentSupports.length > 0 ? (
              recentSupports.map((support) => (
                <tr key={support.id}>
                  <td>
                    <div className="sd-child-name">
                      <span className="sd-child-avatar">{support.child.charAt(0)}</span>
                      {support.child}
                    </div>
                  </td>
                  <td>
                    <span className="sd-support-type">{support.type}</span>
                  </td>
                  <td>{new Date(support.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</td>
                  <td>
                    <span className={`sd-status-badge ${getStatusClass(support.status)}`}>
                      {getStatusLabel(support.status)}
                    </span>
                  </td>
                  <td>
                    <button className="sd-view-btn">View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="sd-no-data">
                  No social supports recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffDashboard;