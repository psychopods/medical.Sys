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

  const services = [
    {
      id: 1,
      title: 'Medical Care',
      description: 'Free health checkups, emergency treatment, and regular medical support for street children. Each visit is tracked via fingerprint for continuous care.',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    },
    {
      id: 2,
      title: 'Food Supply',
      description: 'Nutritious meals provided to street children during their visit to the center. Fingerprint registration ensures each child receives proper food support when they come for assistance.',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8V11.1C6 12.4 6.5 13.6 7.4 14.5L8 15.1V22H16V15.1L16.6 14.5C17.5 13.6 18 12.3 18 11V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 2L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14 2L14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 15H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 3,
      title: 'Clothing & Shoes',
      description: 'Clean, weather-appropriate clothing and durable footwear provided during visits. Every child receives proper attire based on their size recorded via fingerprint.',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C10 2 8 3 8 5C8 6 9 7 10 8C9 9 8 10 8 12C8 14 9 15 10 16C8 17 8 19 8 21H16C16 19 16 17 14 16C15 15 16 14 16 12C16 10 15 9 14 8C15 7 16 6 16 5C16 3 14 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 16H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 4,
      title: 'Fingerprint Registration',
      description: 'Secure biometric registration system to track service distribution, maintain health records, and ensure every child receives consistent support during each visit.',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M18 12C18 8.69 15.31 6 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M18 12C18 15.31 15.31 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 5,
      title: 'Education Support',
      description: 'Basic education materials and school enrollment assistance provided during visits. Tracked through our biometric system for continued support.',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V4M12 6C10 6 8 7 8 9C8 11 10 12 12 12C14 12 16 11 16 9C16 7 14 6 12 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M4 16C4 14 6 12 9 12H15C18 12 20 14 20 16V20H4V16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    },
    {
      id: 6,
      title: 'Shelter & Care',
      description: 'Safe overnight shelter, hygiene facilities, and emotional support counseling during visits. Fingerprint check-in ensures safety and accountability.',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="services-page">
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

      {/* Hero Section */}
      <div className="services-hero">
        <div className="services-hero-content">
          <h1>Our Care Services</h1>
          <p>BB Medical Center provides comprehensive support for street children through secure fingerprint registration</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-container">
        <div className="services-intro">
          <h2>How Fingerprint Registration Helps</h2>
          <p>Every child gets a unique digital identity, ensuring they receive consistent care across all services during each visit — from medicine to meals, clothing to shelter.</p>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <div className="service-card" key={service.id}>
              <div className="service-icon">
                {service.icon}
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;