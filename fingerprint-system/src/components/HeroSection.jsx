import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';
import { API_ENDPOINTS } from '../config/endpoints.js';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [transformY, setTransformY] = useState(0);
  const [currentDate, setCurrentDate] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalLocations: 0,
    yearFounded: 2015
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Array of background images
  const backgroundImages = [
    '/image3.webp',
    '/image4.webp',
    '/image5.webp',
    '/image6.jpg',
    '/image7.jpg',
    '/image8.jpg',
    '/image9.webp',
    '/image10.webp'
  ];

  // ===== FETCH STATS FROM API =====
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.locations);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let locationsArray = [];

      if (Array.isArray(data)) {
        locationsArray = data;
      } else if (data.locations && Array.isArray(data.locations)) {
        locationsArray = data.locations;
      }

      let totalChildren = 0;
      let validLocations = 0;

      locationsArray.forEach(location => {
        if (location.childrenCount !== undefined && location.childrenCount !== null) {
          totalChildren += Number(location.childrenCount);
        }
        const lat = location.lat || location.latitude || 0;
        const lng = location.lng || location.longitude || 0;
        if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
          validLocations++;
        }
      });

      setStats({
        totalChildren: totalChildren || 0,
        totalLocations: validLocations || locationsArray.length || 0,
        yearFounded: 2015
      });

    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats({
        totalChildren: 0,
        totalLocations: 0,
        yearFounded: 2015
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setIsVisible(true);
    
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

  // Image rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const handleFingerprintClick = () => {
    navigate('/support');
  };

  // Navigate to street medicine page
  const handleStatClick = () => {
    navigate('/street-medicine');
  };

  // Format number with + sign for display
  const formatStatNumber = (num) => {
    if (num === 0) return '0';
    return `${num}+`;
  };

  return (
    <section 
      className="hero-section"
      style={{
        backgroundImage: `url(${backgroundImages[currentImageIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        transform: `translateY(${transformY}px)`,
        transition: 'background-image 1.5s ease-in-out'
      }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-particles"></div>
      
      {/* Image counter/indicator */}
      <div className="hero-image-indicators">
        {backgroundImages.map((_, index) => (
          <span 
            key={index}
            className={`indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
            onClick={() => setCurrentImageIndex(index)}
          />
        ))}
      </div>
      
      <div className="hero-container">
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <h1 className="hero-title">
             <span className="highlight">Street Medicine Project</span>
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
          
          {/* Stats Section - Fetched from API */}
          <div className="hero-stats">
            {loading ? (
              <>
                <div className="stat stat-loading">
                  <div className="stat-skeleton"></div>
                  <div className="stat-skeleton-label"></div>
                </div>
                <div className="stat stat-loading">
                  <div className="stat-skeleton"></div>
                  <div className="stat-skeleton-label"></div>
                </div>
                <div className="stat stat-loading">
                  <div className="stat-skeleton"></div>
                  <div className="stat-skeleton-label"></div>
                </div>
              </>
            ) : (
              <>
                <div 
                  className="stat stat-clickable"
                  onClick={handleStatClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStatClick();
                    }
                  }}
                  aria-label="View children served statistics"
                >
                  <h3>{formatStatNumber(stats.totalChildren)}</h3>
                  <p>Children Served</p>
                  <span className="stat-arrow">→</span>
                </div>
                <div 
                  className="stat stat-clickable"
                  onClick={handleStatClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStatClick();
                    }
                  }}
                  aria-label="View outreach locations"
                >
                  <h3>{formatStatNumber(stats.totalLocations)}</h3>
                  <p>Outreach Locations</p>
                  <span className="stat-arrow">→</span>
                </div>
                <div 
                  className="stat stat-clickable"
                  onClick={handleStatClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStatClick();
                    }
                  }}
                  aria-label="View year founded"
                >
                  <h3>{stats.yearFounded}</h3>
                  <p>Year Initiated</p>
                  <span className="stat-arrow">→</span>
                </div>
              </>
            )}
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
            <div className="circular-text-wrapper">
              <svg className="circular-text-svg" viewBox="0 0 200 200" width="200" height="200">
                <defs>
                  <path id="circlePath" d="M 100, 100 m -88, 0 a 88, 88 0 1, 1 176, 0 a 88, 88 0 1, 1 -176, 0" />
                </defs>
                <text className="circular-text">
                  <textPath href="#circlePath" startOffset="0%">
                    CLICK HERE TO JOIN OUR MOVEMENT TODAY <tspan fill="white" style={{ fontWeight: 900, textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,215,0,0.6)' }}>{currentDate}</tspan> • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • 
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