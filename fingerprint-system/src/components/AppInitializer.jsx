import React, { useState, useEffect } from 'react';
import './AppInitializer.css';

const AppInitializer = ({ onLoadingComplete }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    if (loadingProgress === 100 && showContent) {
      const hideTimer = setTimeout(() => {
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
      {/* Simple White Background */}
      <div className="init-bg"></div>

      {/* Main Content - Only Logo */}
      <div className="init-container">
        {/* Logo Section */}
        <div className="init-logo-section">
          <div className="init-logo-wrapper">
            <div className="init-logo-ring">
              <div className="init-logo-ring-inner"></div>
            </div>
            <img 
              src="/trhm.jpg" 
              alt="Street Medicine System" 
              className="init-logo-image"
            />
            <div className="init-logo-glow"></div>
          </div>
          <h1 className="init-title">Street Medicine Project </h1>
          <p className="init-subtitle">Loading your experience</p>
        </div>
      </div>
    </div>
  );
};

export default AppInitializer;