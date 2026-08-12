import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LabTechnicianDashboard.css';

const LabTechnicianDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState([
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3H16L18 9L12 21L6 9L8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '12', 
      label: 'Pending Tests',
      trend: '+8%',
      trendUp: true,
      color: 'blue'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '8', 
      label: 'Completed Today',
      trend: '+3%',
      trendUp: true,
      color: 'green'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '4', 
      label: 'In Progress',
      trend: '-1%',
      trendUp: false,
      color: 'orange'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '24', 
      label: 'Results Sent',
      trend: '+15%',
      trendUp: true,
      color: 'purple'
    },
  ]);

  const [labRequests, setLabRequests] = useState([
    { id: 1, patient: 'James Mwangi', test: 'Malaria Test', requestedBy: 'Dr. Sarah Johnson', priority: 'high', status: 'pending' },
    { id: 2, patient: 'Sarah Akinyi', test: 'Complete Blood Count', requestedBy: 'Dr. James Okello', priority: 'medium', status: 'in-progress' },
    { id: 3, patient: 'David Ochieng', test: 'Urinalysis', requestedBy: 'Dr. Sarah Johnson', priority: 'low', status: 'pending' },
    { id: 4, patient: 'Mary Atieno', test: 'Stool Test', requestedBy: 'Dr. James Okello', priority: 'high', status: 'completed' },
    { id: 5, patient: 'Joseph Odhiambo', test: 'HIV Test', requestedBy: 'Dr. Sarah Johnson', priority: 'medium', status: 'pending' },
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
          <path d="M8 3H16L18 9L12 21L6 9L8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'View Requests', 
      desc: 'Review laboratory requests', 
      action: () => alert('Lab Requests'),
      color: 'blue'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ), 
      title: 'Record Results', 
      desc: 'Enter test results', 
      action: () => alert('Results Form'),
      color: 'green'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Send to Doctor', 
      desc: 'Send results to doctor', 
      action: () => alert('Send Results'),
      color: 'purple'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Test Catalog', 
      desc: 'Manage test types', 
      action: () => alert('Test Catalog'),
      color: 'orange'
    },
  ];

  const getPriorityClass = (priority) => {
    const classes = {
      'high': 'lt-priority-high',
      'medium': 'lt-priority-medium',
      'low': 'lt-priority-low'
    };
    return classes[priority] || 'lt-priority-default';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return labels[priority] || priority;
  };

  const getStatusClass = (status) => {
    const classes = {
      'pending': 'lt-status-pending',
      'in-progress': 'lt-status-progress',
      'completed': 'lt-status-completed'
    };
    return classes[status] || 'lt-status-default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'in-progress': 'In Progress',
      'completed': 'Completed'
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
    <div className="lt-dashboard">
      {/* Silent Refresh Indicator */}
      <div className="lt-refresh-indicator">
        {isRefreshing && (
          <span className="lt-refresh-spinner"></span>
        )}
        {lastRefreshed && (
          <span className="lt-refresh-time">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Welcome Section */}
      <div className="lt-welcome-section">
        <div className="lt-welcome-text">
          <h1>Welcome back, {displayName}!</h1>
          <p>Here's an overview of your laboratory activities</p>
        </div>
        <div className="lt-welcome-date">
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="lt-stats-grid">
        {stats.map((stat, index) => (
          <div className={`lt-stat-card lt-stat-${stat.color}`} key={index}>
            <div className="lt-stat-icon">{stat.icon}</div>
            <div className="lt-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span className={`lt-stat-trend ${stat.trendUp ? 'lt-trend-up' : 'lt-trend-down'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="lt-section-header">
        <h2>Quick Actions</h2>
        <span className="lt-section-badge">4 actions</span>
      </div>
      <div className="lt-actions-grid">
        {quickActions.map((action, index) => (
          <div className={`lt-action-card lt-action-${action.color}`} key={index} onClick={action.action}>
            <div className="lt-action-icon">{action.icon}</div>
            <div className="lt-action-info">
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
            <span className="lt-action-arrow">→</span>
          </div>
        ))}
      </div>

      {/* Laboratory Requests */}
      <div className="lt-section-header">
        <h2>Laboratory Requests</h2>
        <span className="lt-section-badge lt-request-count">{labRequests.length} requests</span>
      </div>
      <div className="lt-requests-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Test Type</th>
              <th>Requested By</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {labRequests.length > 0 ? (
              labRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div className="lt-patient-name">
                      <span className="lt-patient-avatar">{request.patient.charAt(0)}</span>
                      {request.patient}
                    </div>
                  </td>
                  <td>{request.test}</td>
                  <td>{request.requestedBy}</td>
                  <td>
                    <span className={`lt-priority-badge ${getPriorityClass(request.priority)}`}>
                      {getPriorityLabel(request.priority)}
                    </span>
                  </td>
                  <td>
                    <span className={`lt-status-badge ${getStatusClass(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td>
                    <button className="lt-view-btn">View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="lt-no-data">
                  No laboratory requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LabTechnicianDashboard;