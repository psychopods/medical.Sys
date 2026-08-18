import React, { useState } from 'react';
import './Partners.css';

const Partners = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [imageErrors, setImageErrors] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const partners = [
    { id: 1, name: 'TRHM', logo: '/trhm.jpg', website: 'https://tanzaniaruralhealth.or.tz/', isNew: false },
    { id: 2, name: 'Mwanza EV', logo: '/mwanza_ev.jpg', website: 'https://mwanza.de/wps/', isNew: false },
    { id: 3, name: 'MITzKITS', logo: '/mitz-logo.png', website: 'https://www.mitzkits.co.tz/', isNew: false },
    { id: 4, name: 'Bisou Bailey Foundation', logo: '/BISOU BAILEY FOUNDATION.png', website: '#', isNew: true },
    { id: 5, name: 'Bisou Bailey Medical Dispensary', logo: '/BISOU BAILEY MEDICAL DISPESNARY LOGO.jpeg', website: '#', isNew: true },
    { id: 6, name: 'KOKOM', logo: '/KOKOM LOGO.jpeg', website: '#', isNew: true },
    { id: 7, name: 'LUENA', logo: '/LUENA LOGO.jpeg', website: '#', isNew: true },
    { id: 8, name: 'Segal Family Foundation', logo: '/SEGAL FAMILY FOUNDATION LOGO.png', website: 'https://segalfamilyfoundation.org/', isNew: true }
  ];

  const handleImageError = (partnerId) => {
    setImageErrors(prev => ({ ...prev, [partnerId]: true }));
  };

  const handleLogoClick = (website, partnerName) => {
    if (website && website !== '#') {
      window.open(website, '_blank', 'noopener,noreferrer');
      showToast(`Opening ${partnerName} website...`, 'success');
    } else {
      showToast(`Website for ${partnerName} not available`, 'error');
    }
  };

  // Duplicate for seamless looping
  const duplicatedPartners = [...partners, ...partners, ...partners, ...partners, ...partners];

  return (
    <div className="partners-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Hero Section with Background Image */}
      <div className="partners-hero-section">
        <div className="partners-hero-overlay"></div>
        <div className="partners-hero-container">
          {/* Centered Title */}
          <div className="partners-hero-header">
            <h1 className="partners-hero-title">
              OUR <span className="partners-highlight">PARTNERS</span>
            </h1>
            <h2 className="partners-hero-subtitle">PARTNER WITH US</h2>
          </div>
          
          {/* Centered Description - Clean single paragraph */}
          <div className="partners-hero-description">
            <p>
              We work with organizations, foundations, and companies to address complex challenges and deliver healthcare to vulnerable children. Our partners contribute more than resources.
            </p>
          </div>
        </div>
      </div>

      {/* Partners Marquee Section */}
      <div className="partners-marquee-section">
        <div className="partners-marquee-container">
          <div 
            className="partners-marquee"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={`marquee-content ${isHovered ? 'paused' : ''}`}>
              {duplicatedPartners.map((partner, index) => (
                <div className="partner-logo-item" key={`${partner.id}-${index}`}>
                  <div 
                    className="partner-logo"
                    onClick={() => handleLogoClick(partner.website, partner.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
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
                        onError={() => handleImageError(partner.id)}
                      />
                    )}
                    {partner.isNew && (
                      <span className="new-badge">New</span>
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