import React from 'react';
import './Dashboard.css';

const LabTechnicianDashboard = ({ user, onLogout }) => {
  const stats = [
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3H16L18 9L12 21L6 9L8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '0', 
      label: 'Pending Tests' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '0', 
      label: 'Completed Today' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '0', 
      label: 'In Progress' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '0', 
      label: 'Results Sent' 
    },
  ];

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
      action: () => alert('Lab Requests') 
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
      action: () => alert('Results Form') 
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
      action: () => alert('Send Results') 
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
      action: () => alert('Test Catalog') 
    },
  ];

  const labRequests = [];

  return (
    <div className="dashboard-content-wrapper">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Quick Actions</div>
      <div className="actions-grid">
        {quickActions.map((action, index) => (
          <div className="action-card" key={index} onClick={action.action}>
            <div className="action-icon">{action.icon}</div>
            <div className="action-info">
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Laboratory Requests</div>
      <div className="recent-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Test Type</th>
              <th>Requested By</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {labRequests.length > 0 ? (
              labRequests.map((request, index) => (
                <tr key={index}>
                  <td>{request.patient}</td>
                  <td>{request.test}</td>
                  <td>{request.requestedBy}</td>
                  <td><span className={`priority-badge priority-${request.priority}`}>{request.priority}</span></td>
                  <td><span className={`status-badge status-${request.status}`}>{request.status}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
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