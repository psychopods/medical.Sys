import React, { useState, useEffect } from 'react';
import './Footer.css';

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>
              <svg className="footer-logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 12C18 8.69 15.31 6 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Fingerprint System
            </h3>
            <p>Advanced biometric security solutions for modern enterprises. Protecting what matters most with cutting-edge technology.</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">
                <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.9572 14.8821 3.28445C14.0247 3.61171 13.2884 4.1944 12.773 4.95372C12.2575 5.71303 11.9877 6.61234 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39545C5.36074 6.60508 4.01032 5.43864 3 4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.0989 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 11.37C16.1234 12.2022 15.9812 13.0522 15.5937 13.799C15.2062 14.5458 14.5931 15.1514 13.8416 15.5297C13.0901 15.908 12.2384 16.0396 11.4077 15.9059C10.5771 15.7723 9.80971 15.3801 9.21479 14.7851C8.61987 14.1902 8.22766 13.4228 8.09402 12.5922C7.96039 11.7615 8.09198 10.9098 8.47026 10.1583C8.84855 9.40678 9.45414 8.7937 10.2009 8.40621C10.9477 8.01871 11.7977 7.87655 12.63 8C13.4789 8.12588 14.2648 8.52146 14.8716 9.1283C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 6.5H17.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 11V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 8H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 16V13C16 12.4696 15.7893 11.9609 15.4142 11.5858C15.0391 11.2107 14.5304 11 14 11C13.4696 11 12.9609 11.2107 12.5858 11.5858C12.2107 11.9609 12 12.4696 12 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><a href="#">Fingerprint Scanner</a></li>
              <li><a href="#">Biometric Access</a></li>
              <li><a href="#">Time Tracking</a></li>
              <li><a href="#">Security Solutions</a></li>
              <li><a href="#">Integration API</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact Info</h4>
            <ul className="contact-info">
              <li>
                <svg className="contact-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                123 Security Street, Tech City, TC 12345
              </li>
              <li>
                <svg className="contact-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.352 21.4019C21.1467 21.5901 20.9044 21.7335 20.6407 21.8227C20.377 21.9119 20.0975 21.945 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.17 18.85C8.77339 17.3147 6.72533 15.2666 5.19 12.87C3.49911 10.2412 2.44847 7.27147 2.12 4.18C2.09508 3.90353 2.12791 3.62496 2.21673 3.36212C2.30555 3.09928 2.44838 2.85766 2.63595 2.65273C2.82353 2.4478 3.05183 2.2843 3.30629 2.17243C3.56075 2.06056 3.8358 2.00295 4.114 2.003H7.114C7.59512 1.99831 8.06584 2.14076 8.46248 2.41041C8.85911 2.68005 9.15998 3.06252 9.322 3.51C9.58123 4.24178 9.76598 4.99767 9.874 5.767C9.94477 6.26118 9.89305 6.76492 9.72364 7.2335C9.55424 7.70209 9.27246 8.12003 8.905 8.447L8.015 9.272C9.42636 11.6562 11.3869 13.6186 13.77 15.032L14.596 14.142C14.9225 13.7749 15.3401 13.4935 15.8083 13.3243C16.2766 13.1551 16.7799 13.1034 17.274 13.174C18.0467 13.2825 18.806 13.4689 19.541 13.73C19.992 13.8927 20.3771 14.1962 20.6479 14.5967C20.9186 14.9972 21.0604 15.4723 21.053 15.957L21 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                +1 234 567 890
              </li>
              <li>
                <svg className="contact-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                info@fingerprintsystem.com
              </li>
              <li>
                <svg className="contact-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Mon-Fri: 9:00 AM - 6:00 PM
              </li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Fingerprint System. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </footer>
  );
};

export default Footer;