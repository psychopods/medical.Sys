import React, { useEffect, useState } from 'react';
import './HeroSection.css';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-overlay"></div>
      <div className="hero-particles"></div>
      <div className="hero-container">
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <h1 className="hero-title">
            Secure Fingerprint <span className="highlight">Authentication</span> System
          </h1>
          <p className="hero-subtitle">
            Advanced biometric security solution for modern enterprises. 
            Protect your data with cutting-edge fingerprint recognition technology.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">
              <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Get Started
            </button>
            <button className="btn-secondary">
              <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Learn More
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <h3>99.9%</h3>
              <p>Accuracy Rate</p>
            </div>
            <div className="stat">
              <h3>1M+</h3>
              <p>Users Protected</p>
            </div>
            <div className="stat">
              <h3>0.1s</h3>
              <p>Recognition Speed</p>
            </div>
          </div>
        </div>
        <div className={`hero-image ${isVisible ? 'slide-in' : ''}`}>
          <div className="fingerprint-animation">
            <svg className="fingerprint-svg" width="250" height="250" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 12C18 8.69 15.31 6 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 12C18 15.31 15.31 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 12C6 8.69 8.69 6 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 12C6 15.31 8.69 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 20V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="fingerprint-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>
      </div>
      <div className="hero-wave">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;