import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './BottomHeader.css';

const BottomHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [topHeaderHeight, setTopHeaderHeight] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Get top header height
  useEffect(() => {
    const handleTopHeaderHeight = (event) => {
      setTopHeaderHeight(event.detail.height);
    };

    // Get initial top header height
    const topHeader = document.querySelector('.bb-top-header');
    if (topHeader) {
      setTopHeaderHeight(topHeader.offsetHeight);
    }

    window.addEventListener('topHeaderHeight', handleTopHeaderHeight);
    return () => window.removeEventListener('topHeaderHeight', handleTopHeaderHeight);
  }, []);

  // Handle sticky on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        const stickyPoint = topHeaderHeight;
        
        if (rect.top <= stickyPoint) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [topHeaderHeight]);

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
    showToast('Redirecting to login page...', 'info');
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', name: 'Home' },
    { path: '/mission', name: 'Mission' },
    { path: '/services', name: 'Services' },
    { path: '/about', name: 'About' },
    { path: '/contact', name: 'Contact' }
  ];

  return (
    <>
      {/* Placeholder to prevent content jump */}
      {isSticky && <div style={{ height: '70px' }}></div>}
      
      <nav 
        ref={headerRef}
        className={`bb-nav-main ${isSticky ? 'bb-sticky' : ''}`}
        style={{ top: isSticky ? `${topHeaderHeight}px` : 'auto' }}
      >
        {/* Toast Notification */}
        {toast.show && (
          <div className={`bb-toast-notification ${toast.type}`}>
            <div className="bb-toast-content">
              {toast.type === 'success' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : toast.type === 'error' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              <span>{toast.message}</span>
            </div>
            <button className="bb-toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        <div className="bb-nav-container">
          <div className="bb-logo" onClick={handleLogoClick}>
            <div className="bb-logo-icon-wrapper">
              <svg className="bb-logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="bb-logo-text">
              <span className="bb-logo-title">BB Medical</span>
              <span className="bb-logo-subtitle">Center</span>
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