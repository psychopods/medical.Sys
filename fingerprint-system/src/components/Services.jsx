import React, { useState } from 'react';
import './Services.css';

const Services = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleGetStarted = (serviceName) => {
    showToast(`Getting started with ${serviceName}!`, 'success');
  };

  const services = [
    {
      id: 1,
      title: 'Fingerprint Scanner',
      description: 'High-precision fingerprint scanning technology for accurate identification and authentication.',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 12C18 8.69 15.31 6 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: ['99.9% Accuracy', 'Instant Recognition', 'Anti-spoofing Technology']
    },
    {
      id: 2,
      title: 'Biometric Access Control',
      description: 'Secure door access systems using fingerprint recognition for enhanced security.',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 12H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: ['Real-time Monitoring', 'Multi-factor Authentication', 'Remote Access Control']
    },
    {
      id: 3,
      title: 'Time & Attendance System',
      description: 'Automated employee time tracking with fingerprint verification to prevent time theft.',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: ['Automated Reports', 'Payroll Integration', 'Mobile Check-in/out']
    },
    {
      id: 4,
      title: 'Security Solutions',
      description: 'Comprehensive security packages combining fingerprint access with surveillance systems.',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: ['24/7 Monitoring', 'Instant Alerts', 'Cloud Backup']
    },
    {
      id: 5,
      title: 'Integration API',
      description: 'Easy-to-integrate API solutions for adding fingerprint authentication to your applications.',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      features: ['RESTful API', 'Comprehensive Documentation', 'Developer Support']
    },
    {
      id: 6,
      title: 'Mobile Biometrics',
      description: 'Mobile-ready fingerprint authentication solutions for smartphones and tablets.',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      features: ['Cross-platform', 'Offline Mode', 'Face & Fingerprint Combo']
    }
  ];

  return (
    <div className="services-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

      {/* Hero Section */}
      <div className="services-hero">
        <div className="services-hero-content">
          <h1>Our Services</h1>
          <p>Comprehensive biometric security solutions tailored to your needs</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-container">
        <div className="services-grid">
          {services.map((service) => (
            <div className="service-card" key={service.id}>
              <div className="service-icon">
                {service.icon}
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="service-features">
                {service.features.map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
              </div>
              <button 
                className="service-btn"
                onClick={() => handleGetStarted(service.title)}
              >
                Get Started
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="services-cta">
        <div className="services-cta-content">
          <h2>Need a Custom Solution?</h2>
          <p>Contact us for personalized biometric security solutions</p>
          <button 
            className="cta-btn"
            onClick={() => showToast('Contacting sales team...', 'success')}
          >
            Contact Sales
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.352 21.4019C21.1467 21.5901 20.9044 21.7335 20.6407 21.8227C20.377 21.9119 20.0975 21.945 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.17 18.85C8.77339 17.3147 6.72533 15.2666 5.19 12.87C3.49911 10.2412 2.44847 7.27147 2.12 4.18C2.09508 3.90353 2.12791 3.62496 2.21673 3.36212C2.30555 3.09928 2.44838 2.85766 2.63595 2.65273C2.82353 2.4478 3.05183 2.2843 3.30629 2.17243C3.56075 2.06056 3.8358 2.00295 4.114 2.003H7.114C7.59512 1.99831 8.06584 2.14076 8.46248 2.41041C8.85911 2.68005 9.15998 3.06252 9.322 3.51C9.58123 4.24178 9.76598 4.99767 9.874 5.767C9.94477 6.26118 9.89305 6.76492 9.72364 7.2335C9.55424 7.70209 9.27246 8.12003 8.905 8.447L8.015 9.272C9.42636 11.6562 11.3869 13.6186 13.77 15.032L14.596 14.142C14.9225 13.7749 15.3401 13.4935 15.8083 13.3243C16.2766 13.1551 16.7799 13.1034 17.274 13.174C18.0467 13.2825 18.806 13.4689 19.541 13.73C19.992 13.8927 20.3771 14.1962 20.6479 14.5967C20.9186 14.9972 21.0604 15.4723 21.053 15.957L21 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;