import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [transformY, setTransformY] = useState(0);
  const [currentDate, setCurrentDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    
    // Set current date
    const now = new Date();
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('en-US', options).toUpperCase());
    
    const handleScroll = () => {
      const topHeader = document.querySelector('.top-header');
      const bottomHeader = document.querySelector('.bb-nav-main');
      
      if (!topHeader || !bottomHeader) return;
      
      const bottomHeaderRect = bottomHeader.getBoundingClientRect();
      const topHeaderHeight = topHeader.offsetHeight;
      const isTopHeaderHidden = topHeader.classList.contains('hidden');
      
      let yOffset = 0;
      
      if (isTopHeaderHidden && bottomHeaderRect.top <= 0) {
        yOffset = -topHeaderHeight;
      } else if (bottomHeaderRect.top <= topHeaderHeight) {
        const scrollAmount = Math.min(topHeaderHeight, Math.abs(bottomHeaderRect.top));
        yOffset = -scrollAmount;
      }
      
      setTransformY(yOffset);
    };
    
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    const observer = new MutationObserver(handleScroll);
    const topHeader = document.querySelector('.top-header');
    if (topHeader) {
      observer.observe(topHeader, { attributes: true, attributeFilter: ['class'] });
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleFingerprintClick = () => {
    navigate('/support');
  };

  return (
    <section 
      className="hero-section"
      style={{
        backgroundImage: `url('/image2.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transform: `translateY(${transformY}px)`
      }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-particles"></div>
      <div className="hero-container">
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <h1 className="hero-title">
            Tanzania Rural Health Movement <span className="highlight">(TRHM)</span>
          </h1>
          <p className="hero-subtitle">
            Delivering healthcare and support directly to vulnerable children living on the streets.
          </p>
          <div className="hero-description">
            <p className="description-text">
              We bring medical care, health screening, mental health support, and social services to children who cannot easily access hospitals.
            </p>
            <p className="description-text">
              Our outreach team provides emergency care, health education, and helps children reintegrate into society with dignity and proper support.
            </p>
          </div>
        </div>
        <div className={`hero-image ${isVisible ? 'slide-in' : ''}`}>
          <div 
            className="fingerprint-wrapper"
            onClick={handleFingerprintClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFingerprintClick();
              }
            }}
            aria-label="Click to join our movement"
          >
            <div className="fingerprint-animation">
              <svg className="fingerprint-svg" width="250" height="250" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 12C18 8.69 15.31 6 12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 12C18 15.31 15.31 18 12 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 12C6 8.69 8.69 6 12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 12C6 15.31 8.69 18 12 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2V4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 20V22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 12H22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12H4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="fingerprint-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
            {/* Circular rotating text with date in white */}
            <div className="circular-text-wrapper">
              <svg className="circular-text-svg" viewBox="0 0 200 200" width="200" height="200">
                <defs>
                  <path id="circlePath" d="M 100, 100 m -88, 0 a 88, 88 0 1, 1 176, 0 a 88, 88 0 1, 1 -176, 0" />
                </defs>
                <text className="circular-text">
                  <textPath href="#circlePath" startOffset="0%">
                    CLICK HERE TO JOIN OUR MOVEMENT TODAY <tspan fill="white" fontWeight="900" textShadow="0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,215,0,0.6)">{currentDate}</tspan> • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • 
                  </textPath>
                </text>
              </svg>
            </div>
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