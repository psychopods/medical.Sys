import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PharmacistDashboard.css';

const PharmacistDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState([
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '15', 
      label: 'Pending Prescriptions',
      trend: '+10%',
      trendUp: true,
      color: 'blue'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '23', 
      label: 'Dispensed Today',
      trend: '+6%',
      trendUp: true,
      color: 'green'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
      ), 
      value: '4', 
      label: 'Low Stock Alerts',
      trend: '+2%',
      trendUp: false,
      color: 'red'
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '$1,247', 
      label: "Today's Expenses",
      trend: '+5%',
      trendUp: true,
      color: 'purple'
    },
  ]);

  const [prescriptions, setPrescriptions] = useState([
    { id: 1, patient: 'James Mwangi', medicine: 'Amoxicillin 500mg', quantity: '2 tablets', stock: 'Available', status: 'pending' },
    { id: 2, patient: 'Sarah Akinyi', medicine: 'Paracetamol 500mg', quantity: '4 tablets', stock: 'Low', status: 'pending' },
    { id: 3, patient: 'David Ochieng', medicine: 'ALU tabs', quantity: '6 tablets', stock: 'Available', status: 'in-progress' },
    { id: 4, patient: 'Mary Atieno', medicine: 'Vitamin B Complex', quantity: '30 tablets', stock: 'Available', status: 'pending' },
    { id: 5, patient: 'Joseph Odhiambo', medicine: 'Ciprofloxacin 500mg', quantity: '10 tablets', stock: 'Low', status: 'pending' },
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
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Review Prescriptions', 
      desc: 'View pending prescriptions', 
      action: () => alert('Prescriptions List'),
      color: 'blue'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Dispense Medicine', 
      desc: 'Dispense medication', 
      action: () => alert('Dispense Form'),
      color: 'green'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 3L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Update Inventory', 
      desc: 'Manage medicine stock', 
      action: () => alert('Inventory Management'),
      color: 'orange'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Record Expenses', 
      desc: 'Log medicine costs', 
      action: () => alert('Expense Form'),
      color: 'purple'
    },
  ];

  const getStockClass = (stock) => {
    if (stock === 'Low') return 'ph-stock-low';
    if (stock === 'Available') return 'ph-stock-available';
    return 'ph-stock-default';
  };

  const getStatusClass = (status) => {
    const classes = {
      'pending': 'ph-status-pending',
      'in-progress': 'ph-status-progress',
      'dispensed': 'ph-status-dispensed'
    };
    return classes[status] || 'ph-status-default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'in-progress': 'In Progress',
      'dispensed': 'Dispensed'
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
    <div className="ph-dashboard">
      {/* Silent Refresh Indicator */}
      <div className="ph-refresh-indicator">
        {isRefreshing && (
          <span className="ph-refresh-spinner"></span>
        )}
        {lastRefreshed && (
          <span className="ph-refresh-time">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Welcome Section */}
      <div className="ph-welcome-section">
        <div className="ph-welcome-text">
          <h1>Welcome back, {displayName}!</h1>
          <p>Here's an overview of your pharmacy activities</p>
        </div>
        <div className="ph-welcome-date">
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="ph-stats-grid">
        {stats.map((stat, index) => (
          <div className={`ph-stat-card ph-stat-${stat.color}`} key={index}>
            <div className="ph-stat-icon">{stat.icon}</div>
            <div className="ph-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span className={`ph-stat-trend ${stat.trendUp ? 'ph-trend-up' : 'ph-trend-down'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="ph-section-header">
        <h2>Quick Actions</h2>
        <span className="ph-section-badge">4 actions</span>
      </div>
      <div className="ph-actions-grid">
        {quickActions.map((action, index) => (
          <div className={`ph-action-card ph-action-${action.color}`} key={index} onClick={action.action}>
            <div className="ph-action-icon">{action.icon}</div>
            <div className="ph-action-info">
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
            <span className="ph-action-arrow">→</span>
          </div>
        ))}
      </div>

      {/* Pending Prescriptions */}
      <div className="ph-section-header">
        <h2>Pending Prescriptions</h2>
        <span className="ph-section-badge ph-prescription-count">{prescriptions.length} prescriptions</span>
      </div>
      <div className="ph-prescriptions-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Medicine</th>
              <th>Quantity</th>
              <th>Stock Status</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <tr key={prescription.id}>
                  <td>
                    <div className="ph-patient-name">
                      <span className="ph-patient-avatar">{prescription.patient.charAt(0)}</span>
                      {prescription.patient}
                    </div>
                  </td>
                  <td>{prescription.medicine}</td>
                  <td>{prescription.quantity}</td>
                  <td>
                    <span className={`ph-stock-badge ${getStockClass(prescription.stock)}`}>
                      {prescription.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`ph-status-badge ${getStatusClass(prescription.status)}`}>
                      {getStatusLabel(prescription.status)}
                    </span>
                  </td>
                  <td>
                    <button className="ph-view-btn">View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="ph-no-data">
                  No pending prescriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacistDashboard;