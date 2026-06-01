import React, { useState } from 'react';
import './Partners.css';

const Partners = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const partners = [
    { id: 1, name: 'Teneo', logo: '/react.svg' },
    { id: 2, name: 'UWE Bristol', logo: '/react.svg' },
    { id: 3, name: 'VISA', logo: '/react.svg' },
    { id: 4, name: 'CITY ROAD', logo: '/react.svg' },
    { id: 5, name: 'Qatar Foundation', logo: '/react.svg' },
    { id: 6, name: 'BLACK TUSK', logo: '/react.svg' },
    { id: 7, name: 'EtonBridge', logo: '/react.svg' },
    { id: 8, name: 'iSP', logo: '/react.svg' }
  ];

  // Duplicate partners for seamless looping
  const duplicatedPartners = [...partners, ...partners, ...partners];

  return (
    <div className="partners-page">
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

      {/* Our Partners Title */}
      <div className="partners-title">
        <h2>Our Partners</h2>
      </div>

      {/* Partners Marquee Section - Single line moving slowly */}
      <div className="partners-marquee-section">
        <div className="partners-marquee-container">
          <div className="partners-marquee">
            <div className="marquee-content">
              {duplicatedPartners.map((partner, index) => (
                <div className="partner-logo-item" key={index}>
                  <div className="partner-logo">
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="partner-image"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partners;