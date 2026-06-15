import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './BottomHeader.css';

const BottomHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [topHeaderHeight, setTopHeaderHeight] = useState(0);
  const [topHeaderVisible, setTopHeaderVisible] = useState(true);
  const [showJoinIndicators, setShowJoinIndicators] = useState(false);
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get top header height and visibility
  useEffect(() => {
    const getTopHeaderInfo = () => {
      const topHeader = document.querySelector('.top-header');
      if (topHeader) {
        const height = topHeader.offsetHeight;
        const isVisible = !topHeader.classList.contains('hidden');
        setTopHeaderHeight(height);
        setTopHeaderVisible(isVisible);
      }
    };

    getTopHeaderInfo();
    
    const observer = new MutationObserver(() => {
      getTopHeaderInfo();
    });
    
    const topHeader = document.querySelector('.top-header');
    if (topHeader) {
      observer.observe(topHeader, { attributes: true, attributeFilter: ['class'] });
    }
    
    window.addEventListener('resize', getTopHeaderInfo);
    window.addEventListener('scroll', getTopHeaderInfo);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', getTopHeaderInfo);
      window.removeEventListener('scroll', getTopHeaderInfo);
    };
  }, []);

  // Handle sticky on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        const currentTopHeaderHeight = topHeaderVisible ? topHeaderHeight : 0;
        
        if (rect.top <= currentTopHeaderHeight) {
          if (!isSticky) setIsSticky(true);
        } else {
          if (isSticky) setIsSticky(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [topHeaderHeight, topHeaderVisible, isSticky]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.bb-nav-main')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLoginClick = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleJoinNowClick = () => {
    setShowJoinIndicators(true);
    
    // Show indicators for 2 seconds
    setTimeout(() => {
      setShowJoinIndicators(false);
    }, 2000);
    
    // Navigate to support page after a short delay
    setTimeout(() => {
      navigate('/support');
      setIsMenuOpen(false);
    }, 500);
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', name: 'Home' },
    { path: '/street-medicine', name: 'Street Medicine' },
    { path: '/services', name: 'Services' },
    { path: '/about', name: 'About' },
    { path: '/gallery', name: 'Gallery' },
    { path: '/reports', name: 'Reports' },
    // { path: '/support', name: 'Support' },
    { path: '/contact', name: 'Contact' }
  ];

  const getStickyTop = () => {
    return topHeaderVisible ? `${topHeaderHeight}px` : '0';
  };

  return (
    <>
      {isSticky && <div style={{ height: headerRef.current?.offsetHeight || '70px' }}></div>}
      
      <nav 
        ref={headerRef}
        className={`bb-nav-main ${isSticky ? 'bb-sticky' : ''}`}
        style={{ 
          top: isSticky ? getStickyTop() : 'auto',
          position: isSticky ? 'fixed' : 'relative'
        }}
      >
        <div className="bb-nav-container">
          <div className="bb-logo" onClick={handleLogoClick}>
            <div className="bb-logo-icon-wrapper">
              <img 
                src="/trhm.jpg" 
                alt="TRHM Logo" 
                className="bb-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="bb-logo-text">
              <span className="bb-logo-title">TRHM</span>
              <span className="bb-logo-subtitle">Tanzania Rural Health Movement</span>
            </div>
          </div>
          
          <div className={`bb-nav-links ${isMenuOpen ? 'bb-active' : ''}`}>
            {menuItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`bb-nav-link ${isActive(item.path) ? 'bb-active' : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="bb-auth-buttons">
            {/* Join Now Button - Eye-catching with fire effects */}
            <div className="bb-join-wrapper">
              <button 
                className={`bb-join-btn ${showJoinIndicators ? 'bb-pulse-active' : ''}`}
                onClick={handleJoinNowClick}
              >
                <svg className="bb-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Join Now
                <span className="bb-fire-emoji">🔥</span>
              </button>
              {showJoinIndicators && (
                <div className="bb-join-indicators">
                  <span className="bb-indicator bb-indicator-1">✨</span>
                  <span className="bb-indicator bb-indicator-2">💫</span>
                  <span className="bb-indicator bb-indicator-3">⭐</span>
                  <span className="bb-indicator bb-indicator-4">🌟</span>
                  <span className="bb-indicator bb-indicator-5">⚡</span>
                  <span className="bb-indicator bb-indicator-fire">🔥</span>
                  <span className="bb-indicator bb-indicator-fire2">🔥</span>
                </div>
              )}
            </div>
            <button className="bb-login-btn" onClick={handleLoginClick}>
              <svg className="bb-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Login
            </button>
          </div>
          
          <div 
            className={`bb-menu-icon ${isMenuOpen ? 'bb-active' : ''}`} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <div className={`bb-mobile-menu ${isMenuOpen ? 'bb-active' : ''}`}>
          {/* Close Button - White */}
          <button className="bb-mobile-close" onClick={closeMobileMenu}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <div className="bb-mobile-menu-links">
            {menuItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`bb-mobile-nav-link ${isActive(item.path) ? 'bb-active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="bb-mobile-auth-buttons">
            <button className="bb-mobile-join-btn" onClick={handleJoinNowClick}>
              <svg className="bb-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Join Now 🔥
            </button>
            <button className="bb-mobile-login-btn" onClick={handleLoginClick}>
              <svg className="bb-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Login
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomHeader;