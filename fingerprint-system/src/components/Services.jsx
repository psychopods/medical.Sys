import React, { useState, useEffect } from 'react';
import './Services.css';
import { API_ENDPOINTS } from '../config/endpoints.js';

const Services = () => {
  const [services, setServices] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [imageErrors, setImageErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const handleImageError = (serviceId) => {
    setImageErrors(prev => ({ ...prev, [serviceId]: true }));
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    const fetchPublicServices = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.publicServices);
        if (response.ok) {
          const data = await response.json();
          if (data.services && data.services.length > 0) {
            setServices(data.services);
          } else {
            showToast('No services available', 'error');
          }
        } else {
          showToast('Failed to load services', 'error');
        }
      } catch (error) {
        console.warn('Failed to fetch services:', error);
        showToast('Could not load services. Please try again later.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicServices();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="services-page">
        <div className="services-hero">
          <div className="services-hero-content">
            <h1>Our Services</h1>
            <p>TRHM provides comprehensive healthcare and support for vulnerable communities</p>
          </div>
        </div>
        <div className="services-container">
          <div className="services-loading">
            <div className="loading-spinner"></div>
            <p>Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no services
  if (services.length === 0 && !loading) {
    return (
      <div className="services-page">
        <div className="services-hero">
          <div className="services-hero-content">
            <h1>Our Services</h1>
            <p>TRHM provides comprehensive healthcare and support for vulnerable communities</p>
          </div>
        </div>
        <div className="services-container">
          <div className="services-empty">
            <p>No services available at the moment. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

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
          <p>We provides comprehensive healthcare and support for vulnerable communities</p>
        </div>
      </div>

      {/* Services Section */}
      <div className="services-container">
        <div className="services-intro">
          <h2>Our Approach to Care</h2>
          <p>We provide a range of healthcare, social, and wellbeing services designed to meet the immediate and long-term needs of vulnerable children and individuals. Through community outreach, we bring essential care, support, and health education closer to those who face barriers to accessing traditional health services.</p>
        </div>

        {services.map((service, index) => (
          <div className={`service-item ${index % 2 === 0 ? 'service-item-left' : 'service-item-right'}`} key={service.id || index}>
            <div className="service-item-image">
              {imageErrors[service.id] ? (
                <div className="service-image-placeholder">
                  <span className="placeholder-text">{service.title?.charAt(0) || 'S'}</span>
                </div>
              ) : (
                <img 
                  src={service.imageUrl || service.image || '/image6.jpg'} 
                  alt={service.title || 'Service'}
                  onError={() => handleImageError(service.id)}
                  loading="lazy"
                />
              )}
            </div>
            <div className="service-item-content">
              <div className="service-item-number">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3>{service.title || 'Service'}</h3>
              <p>{service.description || 'Service description'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;