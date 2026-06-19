import React, { useState, useEffect } from 'react';
import './MessageBar.css';

const MessageBar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const messages = [
    {
      text: "Helping street children find hope and healthcare",
      icon: "heart"
    },
    {
      text: "One fingerprint, one identity, continuous care",
      icon: "fingerprint"
    },
    {
      text: "Providing nutritious meals during each visit",
      icon: "meal"
    },
    {
      text: "Free clothing and shoes for every child",
      icon: "clothing"
    },
    {
      text: "24/7 medical care for vulnerable children",
      icon: "medical"
    },
    {
      text: "Track medical history with fingerprint system",
      icon: "history"
    },
    {
      text: "Join us in making a difference today",
      icon: "handshake"
    }
  ];
  
  useEffect(() => {
    // Check if top header is hidden
    const checkTopHeader = () => {
      const topHeader = document.querySelector('.top-header');
      if (topHeader && topHeader.classList.contains('hidden')) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    // Initial check
    checkTopHeader();
    
    // Watch for top header class changes
    const observer = new MutationObserver(checkTopHeader);
    const topHeader = document.querySelector('.top-header');
    if (topHeader) {
      observer.observe(topHeader, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Also check on scroll
    window.addEventListener('scroll', checkTopHeader);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkTopHeader);
    };
  }, []);
  
  // Rotate messages
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isVisible, messages.length]);
  
  const getMessageIcon = (iconName) => {
    switch(iconName) {
      case 'heart':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.388 3.14052 17.6726 2.99817 16.95 2.99817C16.2274 2.99817 15.512 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59097 2.99871 4.1917 3.57831 3.16 4.61C2.1283 5.6417 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.938 22.4518 9.2226 22.4518 8.5C22.4518 7.7774 22.3095 7.062 22.0329 6.3946C21.7563 5.7272 21.351 5.1208 20.84 4.61Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'fingerprint':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 12C18 8.69 15.31 6 12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 12C6 8.69 8.69 6 12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'meal':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 2V8M18 2H15M18 2H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 2V6M8 2H6.5M8 2H9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 22L21 22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 22V11C6 9.89543 6.89543 9 8 9H16C17.1046 9 18 9.89543 18 11V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 9V22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'clothing':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C10.5 2 9 3.5 9 5C9 6.5 10.5 8 12 8C13.5 8 15 6.5 15 5C15 3.5 13.5 2 12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 3.5L18.5 4.5C17.5 6.5 15 8 12 8C9 8 6.5 6.5 5.5 4.5L5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 9L5 22H19L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'medical':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'history':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'handshake':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 13L19 15L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 13L5 15L2 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 4L8 8L12 12L16 8L12 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 8L5 11L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 8L19 11L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 15L12 18L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7433C15.6251 19.5874 14.0782 20.0562 12.5 20.1C11.1801 20.1034 9.87812 19.7951 8.7 19.2L3 21L4.8 15.3C4.20493 14.1219 3.89663 12.8199 3.9 11.5C3.9438 9.92178 4.41262 8.37486 5.25673 7.03256C6.10083 5.69025 7.28821 4.60563 8.7 3.9C9.87812 3.30493 11.1801 2.99663 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94695 20.885 8.91568 21 11V11.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="message-bar">
      <div className="message-bar-container">
        <div className="message-icon">
          {getMessageIcon(messages[currentMessageIndex].icon)}
        </div>
        <div className="message-content">
          <span className="message-text">{messages[currentMessageIndex].text}</span>
        </div>
        <div className="message-dots">
          {messages.map((_, idx) => (
            <span 
              key={idx} 
              className={`dot ${idx === currentMessageIndex ? 'active' : ''}`}
              onClick={() => setCurrentMessageIndex(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageBar;