import React, { useState, useEffect } from 'react';
import './Partners.css';

const Partners = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [imageErrors, setImageErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const partners = [
    { 
      id: 1, 
      name: 'TRHM', 
      logo: '/trhm.jpg',
      website: 'https://tanzaniaruralhealth.or.tz/'
    },
    { 
      id: 2, 
      name: 'Mwanza EV', 
      logo: '/mwanza_ev.jpg',
      website: 'https://mwanza.de/wps/'
    },
    { 
      id: 3, 
      name: 'MITzKITS', 
      logo: '/mitz-logo.png',
      website: 'https://www.mitzkits.co.tz/'
    }
  ];

  // Handle image error - show placeholder with first letter
  const handleImageError = (partnerId, partnerName) => {
    setImageErrors(prev => ({ ...prev, [partnerId]: true }));
  };

  // Handle logo click - open website in new tab
  const handleLogoClick = (website, partnerName) => {
    if (website) {
      window.open(website, '_blank', 'noopener,noreferrer');
      showToast(`Opening ${partnerName} website...`, 'success');
    } else {
      showToast(`Website for ${partnerName} not available`, 'error');
    }
  };

  // Duplicate partners for seamless looping
  const duplicatedPartners = [...partners, ...partners, ...partners, ...partners, ...partners];

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
                <div className="partner-logo-item" key={`${partner.id}-${index}`}>
                  <div 
                    className="partner-logo"
                    onClick={() => handleLogoClick(partner.website, partner.name)}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleLogoClick(partner.website, partner.name);
                      }
                    }}
                  >
                    {imageErrors[partner.id] ? (
                      <div className="partner-logo-placeholder">
                        <span className="placeholder-text">{partner.name.charAt(0)}</span>
                      </div>
                    ) : (
                      <img 
                        src={partner.logo} 
                        alt={partner.name}
                        className="partner-image"
                        onError={() => handleImageError(partner.id, partner.name)}
                      />
                    )}
                    <div className="partner-name-tooltip">
                      <span>{partner.name}</span>
                      <span className="tooltip-sub">Click to visit</span>
                    </div>
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