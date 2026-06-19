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
        <div className={`mv-toast-notification ${toast.type}`}>
          <div className="mv-toast-content">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{toast.message}</span>
          </div>
          <button className="mv-toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Mission & Vision Section */}
      <div 
        className="mission-vision-section"
        style={{
          backgroundImage: `url('/image1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="mv-section-overlay"></div>
        <div className="mv-section-container">
          
          {/* Mission */}
          <div className="mv-mission-wrapper">
            <div className="mv-mission-content">
              <h2 className="mv-section-title">Our Mission</h2>
              <p className="mv-section-text">
                To improve the health and wellbeing of underserved communities in Tanzania through accessible healthcare services, community outreach, innovation, and sustainable partnerships.
              </p>
            </div>
            <div className="mv-mission-image">
              <img src="/image2.png" alt="Mission" />
            </div>
          </div>

          {/* Vision */}
          <div className="mv-vision-wrapper">
            <div className="mv-vision-image">
              <img src="/image1.png" alt="Vision" />
            </div>
            <div className="mv-vision-content">
              <h2 className="mv-section-title">Our Vision</h2>
              <p className="mv-section-text">
                A healthy and empowered society where every vulnerable individual has access to quality healthcare, social support, and dignity.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Mission;