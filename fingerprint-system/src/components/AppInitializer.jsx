import React, { useState, useEffect } from 'react';
import './AppInitializer.css';

const AppInitializer = ({ onLoadingComplete }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Show loading screen immediately
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showContent || isInitialized) return;

    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsInitialized(true);
          sessionStorage.setItem('app_initialized', 'true');
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [showContent, isInitialized]);

  // This effect runs when loading completes - HIDE the loading screen
  useEffect(() => {
    if (loadingProgress === 100 && showContent) {
      // Add a small delay before hiding the loading screen
      const hideTimer = setTimeout(() => {
        // Call the callback to notify parent that loading is complete
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }, 500);
      return () => clearTimeout(hideTimer);
    }
  }, [loadingProgress, showContent, onLoadingComplete]);

  if (!showContent) {
    return null;
  }

  return (
    <div className="app-initializer">
      {/* Animated Background */}
      <div className="init-bg">
        <div className="init-bg-gradient"></div>
        <div className="init-bg-pattern"></div>
      </div>

      {/* Main Content - Only Logo */}
      <div className="init-container">
        {/* Logo Section - Styled like Login page */}
        <div className="init-logo-section">
          <div className="init-logo-animation">
            <img 
              src="/trhm.jpg" 
              alt="TRHM - Street Medicine System" 
              className="init-logo-image"
            />
          </div>
        </div>

        {/* Loading Section - Shows Percentage */}
        <div className="init-loading-section">
          <div className="init-loading-card">
            <div className="init-progress-bar-container">
              <div 
                className="init-progress-bar" 
                style={{ width: `${loadingProgress}%` }}
              >
                <div className="init-progress-glow"></div>
              </div>
            </div>
            {/* Percentage Text */}
            <div className="init-progress-text">
              {loadingProgress}% Complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppInitializer;