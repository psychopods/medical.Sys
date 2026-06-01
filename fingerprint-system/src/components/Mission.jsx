import React, { useState } from 'react';
import './Mission.css';

const Mission = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  return (
    <div className="mission-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Mission Section with Background Image */}
      <div 
        className="mission-container"
        style={{
          backgroundImage: `url('/image1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="mission-overlay"></div>
        <div className="mission-content">
          <h1 className="mission-title">OUR MISSION</h1>
          
          <p className="mission-text">
            Bringing hope and dignity to every child in need.
          </p>
          
          <p className="mission-description">
            To restore dignity, health, and hope to street-connected children by providing continuous, compassionate care—supported by a secure fingerprint identification system that ensures every child is recognized, tracked, and consistently provided with essential needs such as medical care, food, clothing, and footwear.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Mission;