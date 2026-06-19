import React, { useState } from 'react';
import './Staff.css';

const Staff = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const leadershipTeam = [
    {
      name: 'Dr. Marko Hingi',
      position: 'Medical Doctor',
      description: 'Leading medical services and healthcare delivery for vulnerable populations.'
    },
    {
      name: 'Augustino Mhanga',
      position: 'Programs Manager',
      description: 'Overseeing all outreach programs and community engagement initiatives.'
    },
    {
      name: 'Dr. Adamu Kondo Bashiru',
      position: 'Medical Officer Incharge',
      description: 'Managing medical operations and ensuring quality healthcare services.'
    }
  ];

  const medicalTeam = [
    {
      name: 'Diana Mnazi',
      position: 'Nurse',
      description: 'Providing compassionate nursing care and health education to patients.'
    },
    {
      name: 'Dorica Makelemo',
      position: 'Laboratory Technologist & Mental Health Lead',
      description: 'Leading laboratory services and mental health support programs.'
    },
    {
      name: 'Martha Mussa',
      position: 'Nurse and Project Officer – Street Medicine',
      description: 'Coordinating street medicine outreach and providing nursing care.'
    },
    {
      name: 'Ayubu Mkungu',
      position: 'Clinical Officer',
      description: 'Providing clinical assessments and treatment to patients.'
    }
  ];

  // Single people icon for all staff
  const PeopleIcon = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21V19C22.9 16.8 21.1 15 19 15" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13C17.2 3.72 18 5.01 18 6.5C18 7.99 17.2 9.28 16 9.87" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="staff-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
        </div>
      )}

      {/* Hero Section */}
      <div className="staff-hero">
        <div className="staff-hero-content">
          <h1>Our Team</h1>
          <p>Dedicated professionals committed to improving healthcare access for vulnerable communities</p>
        </div>
      </div>

      {/* Leadership Team */}
      <div className="leadership-section">
        <div className="container">
          <h2 className="section-title">Leadership Team</h2>
          <div className="leadership-grid">
            {leadershipTeam.map((member, index) => (
              <div className="staff-card" key={index}>
                <div className="staff-icon"><PeopleIcon /></div>
                <h3>{member.name}</h3>
                <p className="staff-position">{member.position}</p>
                <p className="staff-description">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medical Team */}
      <div className="medical-team-section">
        <div className="container">
          <h2 className="section-title">Medical & Support Team</h2>
          <div className="medical-grid">
            {medicalTeam.map((member, index) => (
              <div className="staff-card" key={index}>
                <div className="staff-icon"><PeopleIcon /></div>
                <h3>{member.name}</h3>
                <p className="staff-position">{member.position}</p>
                <p className="staff-description">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staff;