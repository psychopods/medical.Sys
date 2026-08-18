import React, { useState } from 'react';
import './Services.css';

const Services = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [imageErrors, setImageErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleImageError = (serviceId) => {
    setImageErrors(prev => ({ ...prev, [serviceId]: true }));
  };

  const services = [
    {
      id: 1,
      title: 'Medical Care',
      description: 'Free health checkups, emergency treatment, and regular medical support. Each visit is tracked via fingerprint for continuous care.',
      image: '/image6.jpg',
    },
    {
      id: 2,
      title: 'Food Supply',
      description: 'Nutritious meals provided during visits. Fingerprint registration ensures each child receives proper food support.',
      image: '/image7.jpg',
    },
    {
      id: 3,
      title: 'Clothing & Shoes',
      description: 'Clean, weather-appropriate clothing and durable footwear based on size recorded via fingerprint.',
      image: '/image8.jpg',
    },
    {
      id: 4,
      title: 'Fingerprint Registration',
      description: 'Secure biometric registration to track service distribution and maintain health records.',
      image: '/image5.png',
    },
    {
      id: 5,
      title: 'Health Education',
      description: 'Basic health education and hygiene awareness programs during each visit.',
      image: '/image10.webp',
    },
    {
      id: 6,
      title: 'Emotional Support',
      description: 'Counseling and emotional support services during visits to ensure wellbeing.',
      image: '/image9.webp',
    },
    {
      id: 7,
      title: 'Admission Support',
      description: 'Assistance with school enrollment, documentation, and access to educational programs for vulnerable children.',
      image: '/image5.webp',
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
          <h1>Our Services</h1>
          <p>TRHM provides comprehensive healthcare and support for vulnerable communities</p>
        </div>
      </div>

      {/* Services Section */}
      <div className="services-container">
        <div className="services-intro">
          <h2>How Fingerprint Registration Helps</h2>
          <p>Every child gets a unique digital identity, ensuring they receive consistent care across all services during each visit.</p>
        </div>

        {services.map((service, index) => (
          <div className={`service-item ${index % 2 === 0 ? 'service-item-left' : 'service-item-right'}`} key={service.id}>
            <div className="service-item-image">
              {imageErrors[service.id] ? (
                <div className="service-image-placeholder">
                  <span className="placeholder-text">{service.title.charAt(0)}</span>
                </div>
              ) : (
                <img 
                  src={service.image} 
                  alt={service.title}
                  onError={() => handleImageError(service.id)}
                />
              )}
            </div>
            <div className="service-item-content">
              <div className="service-item-number">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;