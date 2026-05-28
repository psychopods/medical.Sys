import React, { useState } from 'react';
import './Dashboard.css';

const DoctorDashboard = ({ user, onLogout }) => {
  const stats = [
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '12', 
      label: 'Pending Patients' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '45', 
      label: 'Today\'s Consultations' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '28', 
      label: 'Prescriptions Written' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '3', 
      label: 'Hospitalized Children' 
    },
  ];

  const quickActions = [
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Review Patients', 
      desc: 'View assigned children', 
      action: () => alert('Patient List') 
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
      desc: 'Enter medical diagnosis', 
      action: () => alert('Diagnosis Form') 
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
      desc: 'Prescribe medication', 
      action: () => alert('Prescription Form') 
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
      desc: 'Order laboratory tests', 
      action: () => alert('Lab Request Form') 
    },
  ];

  const assignedPatients = [
    { name: 'John Doe', age: '2 years', condition: 'Fever', vitalSigns: 'Normal', status: 'pending' },
    { name: 'Jane Smith', age: '1.5 years', condition: 'Cough', vitalSigns: 'Checked', status: 'inprogress' },
    { name: 'Mike Johnson', age: '3 years', condition: 'Rash', vitalSigns: 'Abnormal', status: 'pending' },
  ];

  return (
    <div className="dashboard-content-wrapper">
      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span className="trend">+8%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
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

      {/* Assigned Patients */}
      <div className="section-title">Assigned Patients</div>
      <div className="recent-table">
        <table>
          <thead>
            <tr>
              <th>Child Name</th>
              <th>Age</th>
              <th>Condition</th>
              <th>Vital Signs</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignedPatients.map((patient, index) => (
              <tr key={index}>
                <td>{patient.name}</td>
                <td>{patient.age}</td>
                <td>{patient.condition}</td>
                <td>{patient.vitalSigns}</td>
                <td><span className={`status-badge status-${patient.status}`}>{patient.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorDashboard;