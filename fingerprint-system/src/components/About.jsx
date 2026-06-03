import React, { useState } from 'react';
import './About.css';

const About = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  return (
    <div className="about-page">
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
      <div className="about-hero">
        <div className="about-hero-content">
          <h1>About TRHM</h1>
          <p>Tanzania Rural Health Movement - Healthcare for All</p>
        </div>
      </div>

      {/* Who We Are Section */}
      <div className="about-section">
        <div className="container">
          <h2 className="section-title">Who We Are</h2>
          <div className="about-content">
            <p className="about-text">
              Tanzania Rural Health Movement (TRHM) is a community-centered organization dedicated to improving access to healthcare and social support services among vulnerable and underserved populations across Tanzania. The organization works to bridge healthcare gaps through innovative outreach programs, community partnerships, health education, and digital health solutions.
            </p>
            <p className="about-text">
              TRHM believes that every individual deserves access to compassionate, equitable, and quality healthcare services regardless of their social or economic condition.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div className="about-section mission-vision">
        <div className="container">
          <div className="mission-vision-grid">
            <div className="mission-block">
              <div className="block-icon">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="#0066cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="block-title">Our Mission</h3>
              <p className="block-text">
                To improve the health and wellbeing of underserved communities in Tanzania through accessible healthcare services, community outreach, innovation, and sustainable partnerships.
              </p>
            </div>
            <div className="vision-block">
              <div className="block-icon">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 12H22" stroke="#0066cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2V22" stroke="#0066cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="block-title">Our Vision</h3>
              <p className="block-text">
                A healthy and empowered society where every vulnerable individual has access to quality healthcare, social support, and dignity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;