import React, { useState, useEffect, useRef, useCallback } from 'react';
import './DoctorDashboard.css';

const DoctorDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState([
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '24', 
      label: 'Pending Patients',
      trend: '+12%',
      trendUp: true,
      color: 'blue'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '18', 
      label: "Today's Consultations",
      trend: '+5%',
      trendUp: true,
      color: 'green'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '42', 
      label: 'Prescriptions Written',
      trend: '+8%',
      trendUp: true,
      color: 'purple'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '7', 
      label: 'Hospitalized Children',
      trend: '-2%',
      trendUp: false,
      color: 'red'
    },
  ]);

  const [assignedPatients, setAssignedPatients] = useState([
    { id: 1, name: 'James Mwangi', age: 7, condition: 'Malaria', vitalSigns: 'Temp: 38.5°C, HR: 110', status: 'critical' },
    { id: 2, name: 'Sarah Akinyi', age: 5, condition: 'Pneumonia', vitalSigns: 'Temp: 37.8°C, RR: 28', status: 'stable' },
    { id: 3, name: 'David Ochieng', age: 9, condition: 'Asthma', vitalSigns: 'Temp: 36.9°C, SpO2: 95%', status: 'improving' },
    { id: 4, name: 'Mary Atieno', age: 4, condition: 'Malnutrition', vitalSigns: 'Temp: 36.5°C, BMI: 14.2', status: 'underweight' },
    { id: 5, name: 'Joseph Odhiambo', age: 6, condition: 'UTI', vitalSigns: 'Temp: 37.2°C, BP: 110/70', status: 'treatment' },
  ]);

  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Helper function to get user's display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    // Check for firstName and lastName
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.lastName) {
      return user.lastName;
    }
    // Check for first_name and last_name (alternative format)
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.last_name) {
      return user.last_name;
    }
    // Fallback to username or email
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
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Review Patients', 
      desc: 'View assigned children and their medical history', 
      action: () => alert('Patient List'),
      color: 'blue'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Record Diagnosis', 
      desc: 'Enter medical diagnosis and treatment plan', 
      action: () => alert('Diagnosis Form'),
      color: 'green'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Write Prescription', 
      desc: 'Prescribe medication and dosage', 
      action: () => alert('Prescription Form'),
      color: 'purple'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3H16L18 9L12 21L6 9L8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Request Lab Test', 
      desc: 'Order laboratory tests and investigations', 
      action: () => alert('Lab Request Form'),
      color: 'orange'
    },
  ];

  const getStatusClass = (status) => {
    const classes = {
      'critical': 'dr-status-critical',
      'stable': 'dr-status-stable',
      'improving': 'dr-status-improving',
      'underweight': 'dr-status-underweight',
      'treatment': 'dr-status-treatment'
    };
    return classes[status] || 'dr-status-default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'critical': 'Critical',
      'stable': 'Stable',
      'improving': 'Improving',
      'underweight': 'Underweight',
      'treatment': 'On Treatment'
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
      // Simulate API call to fetch latest data
      // In production, this would fetch from your API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update last refreshed time
      setLastRefreshed(new Date());
      
      // In production, update stats and patients data here
      // For demo, we keep the existing data
      
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      isRefreshingRef.current = false;
      if (showSpinner) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Start background refresh
  const startBackgroundRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      refreshData(false);
    }, 30000); // Refresh every 30 seconds
  }, [refreshData]);

  // Stop background refresh
  const stopBackgroundRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Initial load and setup
  useEffect(() => {
    // Initial refresh with spinner
    refreshData(true);
    
    // Start background refresh
    startBackgroundRefresh();
    
    // Cleanup on unmount
    return () => {
      stopBackgroundRefresh();
    };
  }, [startBackgroundRefresh, stopBackgroundRefresh]);

  const displayName = getUserDisplayName();

  return (
    <div className="dr-dashboard">
      {/* Silent Refresh Indicator */}
      <div className="dr-refresh-indicator">
        {isRefreshing && (
          <span className="dr-refresh-spinner"></span>
        )}
        {lastRefreshed && (
          <span className="dr-refresh-time">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Welcome Section */}
      <div className="dr-welcome-section">
        <div className="dr-welcome-text">
          <h1>Welcome back, {displayName}!</h1>
          <p>Here's an overview of your patients and activities</p>
        </div>
        <div className="dr-welcome-date">
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dr-stats-grid">
        {stats.map((stat, index) => (
          <div className={`dr-stat-card dr-stat-${stat.color}`} key={index}>
            <div className="dr-stat-icon">{stat.icon}</div>
            <div className="dr-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span className={`dr-stat-trend ${stat.trendUp ? 'dr-trend-up' : 'dr-trend-down'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dr-section-header">
        <h2>Quick Actions</h2>
        <span className="dr-section-badge">4 actions</span>
      </div>
      <div className="dr-actions-grid">
        {quickActions.map((action, index) => (
          <div className={`dr-action-card dr-action-${action.color}`} key={index} onClick={action.action}>
            <div className="dr-action-icon">{action.icon}</div>
            <div className="dr-action-info">
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
            <span className="dr-action-arrow">→</span>
          </div>
        ))}
      </div>

      {/* Assigned Patients */}
      <div className="dr-section-header">
        <h2>Assigned Patients</h2>
        <span className="dr-section-badge dr-patient-count">{assignedPatients.length} patients</span>
      </div>
      <div className="dr-patients-table">
        <table>
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Age</th>
              <th>Condition</th>
              <th>Vital Signs</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignedPatients.length > 0 ? (
              assignedPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className="dr-patient-name">
                      <span className="dr-patient-avatar">{patient.name.charAt(0)}</span>
                      {patient.name}
                    </div>
                  </td>
                  <td>{patient.age} years</td>
                  <td>{patient.condition}</td>
                  <td>{patient.vitalSigns}</td>
                  <td>
                    <span className={`dr-status-badge ${getStatusClass(patient.status)}`}>
                      {getStatusLabel(patient.status)}
                    </span>
                  </td>
                  <td>
                    <button className="dr-view-btn">View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="dr-no-data">
                  No assigned patients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorDashboard;