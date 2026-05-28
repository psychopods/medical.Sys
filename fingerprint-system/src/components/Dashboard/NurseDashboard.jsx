import React, { useState, useEffect } from 'react';
import './NurseDashboard.css';

const NurseDashboard = ({ user, onLogout }) => {
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showFingerprintCapture, setShowFingerprintCapture] = useState(false);
  const [showVerifyFingerprint, setShowVerifyFingerprint] = useState(false);
  const [fingerprintExists, setFingerprintExists] = useState(null);
  const [existingChild, setExistingChild] = useState(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [formData, setFormData] = useState({
    childName: '',
    dateOfBirth: '',
    gender: '',
    location: ''
  });

  // Sample data for statistics
  const [statsData, setStatsData] = useState({
    totalChildren: 156,
    todayRegistrations: 8,
    fingerprintsCaptured: 142,
    pendingFingerprints: 14,
    totalLocations: 34,
    activeUsers: 12
  });

  // Sample data for recent activities
  const recentActivities = [
    { id: 1, childName: 'John Doe', activity: 'New Registration', time: '10:30 AM', date: '2024-01-15', status: 'completed' },
    { id: 2, childName: 'Jane Smith', activity: 'Fingerprint Captured', time: '11:00 AM', date: '2024-01-15', status: 'completed' },
    { id: 3, childName: 'Mike Johnson', activity: 'Medical Checkup', time: '11:30 AM', date: '2024-01-15', status: 'pending' },
    { id: 4, childName: 'Sarah Williams', activity: 'Vaccination', time: '09:15 AM', date: '2024-01-14', status: 'completed' },
    { id: 5, childName: 'David Brown', activity: 'Growth Monitoring', time: '02:00 PM', date: '2024-01-14', status: 'completed' },
  ];

  // Sample data for location distribution
  const locationStats = [
    { location: 'Dar es Salaam', count: 45, percentage: 29 },
    { location: 'Arusha', count: 28, percentage: 18 },
    { location: 'Mwanza', count: 22, percentage: 14 },
    { location: 'Mbeya', count: 18, percentage: 12 },
    { location: 'Tanga', count: 15, percentage: 10 },
    { location: 'Other Locations', count: 28, percentage: 17 },
  ];

  // Sample data for monthly registrations
  const monthlyRegistrations = [
    { month: 'Jan', count: 24 },
    { month: 'Feb', count: 28 },
    { month: 'Mar', count: 32 },
    { month: 'Apr', count: 30 },
    { month: 'May', count: 35 },
    { month: 'Jun', count: 38 },
    { month: 'Jul', count: 42 },
    { month: 'Aug', count: 45 },
    { month: 'Sep', count: 40 },
    { month: 'Oct', count: 38 },
    { month: 'Nov', count: 35 },
    { month: 'Dec', count: 42 },
  ];

  // Stats cards data
  const stats = [
    { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      value: statsData.totalChildren, 
      label: 'Total Children Registered',
      trend: '+12%',
      trendUp: true
    },
    { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M18 12C18 8.69 15.31 6 12 6" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ), 
      value: statsData.fingerprintsCaptured, 
      label: 'Fingerprints Captured',
      trend: '+8%',
      trendUp: true
    },
    { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
          <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      value: statsData.pendingFingerprints, 
      label: 'Pending Fingerprints',
      trend: '-5%',
      trendUp: false
    },
    { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      value: statsData.todayRegistrations, 
      label: "Today's Registrations",
      trend: '+2',
      trendUp: true
    },
  ];

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFingerprintCapture = () => {
    const captured = Math.random() > 0.3;
    if (captured) {
      alert('Fingerprint captured successfully!');
      setShowFingerprintCapture(true);
      setFingerprintExists(false);
    } else {
      alert('Fingerprint capture failed. Please try again.');
    }
  };

  const handleVerifyFingerprint = () => {
    const exists = Math.random() > 0.5;
    setFingerprintExists(exists);
    if (exists) {
      setExistingChild({
        name: 'Sarah Williams',
        id: 'CH-2024-004',
        lastVisit: '2024-01-15',
        age: '1 year 6 months',
        gender: 'Female',
        location: 'Mbeya'
      });
    }
  };

  const handleContinueRegistration = () => {
    if (offlineMode) {
      alert('Saving to local offline database...');
    } else {
      alert('Saving to central online database...');
    }
    setShowRegistrationForm(false);
    setShowFingerprintCapture(false);
    setRegistrationStep(1);
    setFormData({
      childName: '',
      dateOfBirth: '',
      gender: '',
      location: ''
    });
  };

  const handleLoadExistingRecord = () => {
    alert(`Loading existing record for: ${existingChild?.name}`);
    setShowVerifyFingerprint(false);
    setFingerprintExists(null);
  };

  return (
    <div className="nurse-dashboard-wrapper">
      {/* Offline Banner */}
      {offlineMode && (
        <div className="nurse-dashboard-offline-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <circle cx="12" cy="12" r="10" stroke="#856404" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="#856404" strokeWidth="2"/>
            <circle cx="12" cy="16" r="1" fill="#856404"/>
          </svg>
          You are in Offline Mode. Data will sync when connection is restored.
        </div>
      )}

      {/* Welcome Section */}
      <div className="nurse-dashboard-welcome-section">
        <h1>Welcome back, {user?.name || user?.username || 'Nurse'}!</h1>
        <p>Here's what's happening with child registrations today.</p>
      </div>

      {/* Stats Cards */}
      <div className="nurse-dashboard-stats-grid">
        {stats.map((stat, index) => (
          <div className="nurse-dashboard-stat-card" key={index}>
            <div className="nurse-dashboard-stat-icon">{stat.icon}</div>
            <div className="nurse-dashboard-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span className={`nurse-dashboard-stat-trend ${stat.trendUp ? 'trend-up' : 'trend-down'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout for Charts */}
      <div className="nurse-dashboard-two-column-layout">
        {/* Location Distribution */}
        <div className="nurse-dashboard-data-card">
          <div className="nurse-dashboard-data-card-header">
            <h3>Registrations by Location</h3>
            <span className="nurse-dashboard-data-card-subtitle">All locations</span>
          </div>
          <div className="nurse-dashboard-location-list">
            {locationStats.map((loc, index) => (
              <div className="nurse-dashboard-location-item" key={index}>
                <div className="nurse-dashboard-location-info">
                  <span className="nurse-dashboard-location-name">{loc.location}</span>
                  <span className="nurse-dashboard-location-count">{loc.count} children</span>
                </div>
                <div className="nurse-dashboard-progress-bar">
                  <div className="nurse-dashboard-progress-fill" style={{ width: `${loc.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Registrations Chart */}
        <div className="nurse-dashboard-data-card">
          <div className="nurse-dashboard-data-card-header">
            <h3>Monthly Registrations</h3>
            <span className="nurse-dashboard-data-card-subtitle">2024 Overview</span>
          </div>
          <div className="nurse-dashboard-monthly-chart">
            {monthlyRegistrations.map((month, index) => (
              <div className="nurse-dashboard-chart-bar-container" key={index}>
                <div className="nurse-dashboard-chart-label">{month.month}</div>
                <div className="nurse-dashboard-chart-bar-wrapper">
                  <div 
                    className="nurse-dashboard-chart-bar" 
                    style={{ height: `${(month.count / 50) * 100}%` }}
                  >
                    <span className="nurse-dashboard-chart-value">{month.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="nurse-dashboard-section-title">Recent Activities</div>
      <div className="nurse-dashboard-recent-table">
        <table>
          <thead>
            <tr>
              <th>Child Name</th>
              <th>Activity</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentActivities.map((activity) => (
              <tr key={activity.id}>
                <td>{activity.childName}</td>
                <td>{activity.activity}</td>
                <td>{activity.date}</td>
                <td>{activity.time}</td>
                <td>
                  <span className={`nurse-dashboard-status-badge nurse-dashboard-status-${activity.status}`}>
                    {activity.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Registration Workflow */}
      <div className="nurse-dashboard-section-title">Registration Workflow</div>
      <div className="nurse-dashboard-workflow-steps">
        <div className="nurse-dashboard-workflow-step">
          <div className="nurse-dashboard-step-number">1</div>
          <div className="nurse-dashboard-step-content">
            <h4>Register New Child</h4>
            <p>Capture child information and details</p>
          </div>
        </div>
        <div className="nurse-dashboard-workflow-arrow">→</div>
        <div className="nurse-dashboard-workflow-step">
          <div className="nurse-dashboard-step-number">2</div>
          <div className="nurse-dashboard-step-content">
            <h4>Capture Fingerprint</h4>
            <p>Scan and store fingerprint data</p>
          </div>
        </div>
        <div className="nurse-dashboard-workflow-arrow">→</div>
        <div className="nurse-dashboard-workflow-step">
          <div className="nurse-dashboard-step-number">3</div>
          <div className="nurse-dashboard-step-content">
            <h4>Verify Fingerprint</h4>
            <p>Check if child already exists</p>
          </div>
        </div>
        <div className="nurse-dashboard-workflow-arrow">→</div>
        <div className="nurse-dashboard-workflow-step">
          <div className="nurse-dashboard-step-number">4</div>
          <div className="nurse-dashboard-step-content">
            <h4>Save Record</h4>
            <p>Save to {offlineMode ? 'Offline' : 'Online'} Database</p>
          </div>
        </div>
      </div>

      {/* Child Registration Form Modal */}
      {showRegistrationForm && (
        <div className="nurse-dashboard-modal-overlay">
          <div className="nurse-dashboard-modal-content">
            <div className="nurse-dashboard-modal-header">
              <h2>Register New Child</h2>
              <button className="nurse-dashboard-modal-close" onClick={() => setShowRegistrationForm(false)}>×</button>
            </div>
            
            {registrationStep === 1 && (
              <div className="nurse-dashboard-registration-form">
                <h3>Step 1: Child Information</h3>
                <div className="nurse-dashboard-form-grid">
                  <div className="nurse-dashboard-form-group">
                    <label>Child's Full Name *</label>
                    <input type="text" name="childName" value={formData.childName} onChange={handleFormChange} placeholder="Enter child's name" />
                  </div>
                  <div className="nurse-dashboard-form-group">
                    <label>Date of Birth *</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange} />
                  </div>
                  <div className="nurse-dashboard-form-group">
                    <label>Gender *</label>
                    <select name="gender" value={formData.gender} onChange={handleFormChange}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="nurse-dashboard-form-group">
                    <label>Location *</label>
                    <input type="text" name="location" value={formData.location} onChange={handleFormChange} placeholder="Enter location" />
                  </div>
                </div>
                <div className="nurse-dashboard-modal-actions">
                  <button className="nurse-dashboard-btn-secondary" onClick={() => setShowRegistrationForm(false)}>Cancel</button>
                  <button className="nurse-dashboard-btn-primary" onClick={() => setRegistrationStep(2)}>Next: Capture Fingerprint</button>
                </div>
              </div>
            )}

            {registrationStep === 2 && (
              <div className="nurse-dashboard-fingerprint-section">
                <h3>Step 2: Capture Fingerprint</h3>
                <div className="nurse-dashboard-fingerprint-area">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="#667eea" strokeWidth="1.5"/>
                    <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="#667eea" strokeWidth="1.5"/>
                    <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="#667eea" strokeWidth="1.5"/>
                    <path d="M18 12C18 8.69 15.31 6 12 6" stroke="#667eea" strokeWidth="1.5"/>
                  </svg>
                  <p>Place finger on the scanner</p>
                  <button className="nurse-dashboard-btn-primary" onClick={handleFingerprintCapture}>Capture Fingerprint</button>
                </div>
                <div className="nurse-dashboard-modal-actions">
                  <button className="nurse-dashboard-btn-secondary" onClick={() => setRegistrationStep(1)}>Back</button>
                  <button className="nurse-dashboard-btn-secondary" onClick={() => setShowRegistrationForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {showFingerprintCapture && registrationStep === 2 && (
              <div className="nurse-dashboard-success-message">
                <h3>✓ Fingerprint Captured Successfully!</h3>
                <div className="nurse-dashboard-modal-actions">
                  <button className="nurse-dashboard-btn-primary" onClick={handleContinueRegistration}>Complete Registration</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verify Fingerprint Modal */}
      {showVerifyFingerprint && (
        <div className="nurse-dashboard-modal-overlay">
          <div className="nurse-dashboard-modal-content">
            <div className="nurse-dashboard-modal-header">
              <h2>Verify Fingerprint</h2>
              <button className="nurse-dashboard-modal-close" onClick={() => setShowVerifyFingerprint(false)}>×</button>
            </div>
            <div className="nurse-dashboard-fingerprint-area">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="#667eea" strokeWidth="1.5"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="#667eea" strokeWidth="1.5"/>
              </svg>
              <p>Place finger on the scanner to verify</p>
              <button className="nurse-dashboard-btn-primary" onClick={handleVerifyFingerprint}>Verify Fingerprint</button>
            </div>
            
            {fingerprintExists === true && (
              <div className="nurse-dashboard-verification-result">
                <div className="nurse-dashboard-success-message">
                  <h3>✓ Fingerprint Found!</h3>
                  <p>Child already registered in the system.</p>
                  <div className="nurse-dashboard-child-info">
                    <p><strong>Name:</strong> {existingChild?.name}</p>
                    <p><strong>ID:</strong> {existingChild?.id}</p>
                    <p><strong>Age:</strong> {existingChild?.age}</p>
                    <p><strong>Gender:</strong> {existingChild?.gender}</p>
                    <p><strong>Location:</strong> {existingChild?.location}</p>
                    <p><strong>Last Visit:</strong> {existingChild?.lastVisit}</p>
                  </div>
                  <div className="nurse-dashboard-modal-actions">
                    <button className="nurse-dashboard-btn-primary" onClick={handleLoadExistingRecord}>Load Existing Record</button>
                    <button className="nurse-dashboard-btn-secondary" onClick={() => {
                      setShowVerifyFingerprint(false);
                      setFingerprintExists(null);
                    }}>Close</button>
                  </div>
                </div>
              </div>
            )}
            
            {fingerprintExists === false && (
              <div className="nurse-dashboard-verification-result">
                <div className="nurse-dashboard-info-message">
                  <h3>ℹ Fingerprint Not Found</h3>
                  <p>This child is not registered. Would you like to register them?</p>
                  <div className="nurse-dashboard-modal-actions">
                    <button className="nurse-dashboard-btn-primary" onClick={() => {
                      setShowVerifyFingerprint(false);
                      setShowRegistrationForm(true);
                      setFingerprintExists(null);
                    }}>Register New Child</button>
                    <button className="nurse-dashboard-btn-secondary" onClick={() => {
                      setShowVerifyFingerprint(false);
                      setFingerprintExists(null);
                    }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseDashboard;