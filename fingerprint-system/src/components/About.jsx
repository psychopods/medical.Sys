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

  const teamMembers = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      position: 'CEO & Founder',
      bio: 'Cybersecurity expert with 15+ years of experience in biometric authentication.',
      icon: (
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 2,
      name: 'Michael Chen',
      position: 'CTO',
      bio: 'Leading innovation in fingerprint recognition algorithms and AI integration.',
      icon: (
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      position: 'Head of Product',
      bio: 'Passionate about creating user-friendly security solutions that protect businesses.',
      icon: (
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  const values = [
    {
      title: 'Innovation',
      description: 'Constantly pushing boundaries in biometric technology',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Security',
      description: 'Bank-grade encryption and data protection',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Reliability',
      description: '99.9% uptime and 24/7 customer support',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'Excellence',
      description: 'Committed to delivering the best solutions',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  const milestones = [
    { year: '2020', title: 'Company Founded', description: 'Started with a vision to revolutionize biometric security' },
    { year: '2021', title: 'First Product Launch', description: 'Released our flagship fingerprint scanner' },
    { year: '2022', title: '1000+ Customers', description: 'Reached milestone of serving over 1000 businesses' },
    { year: '2023', title: 'Global Expansion', description: 'Expanded operations to 15 countries worldwide' },
    { year: '2024', title: 'AI Integration', description: 'Launched AI-powered fingerprint recognition' }
  ];

  return (
    <div className="about-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="about-hero">
        <div className="about-hero-content">
          <h1>About Us</h1>
          <p>Pioneering the future of biometric security since 2020</p>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="about-story">
        <div className="about-story-container">
          <div className="about-story-content">
            <h2>Our Story</h2>
            <p>Founded in 2020, Fingerprint System emerged from a simple yet powerful idea: to make advanced biometric security accessible to businesses of all sizes. What started as a small team of cybersecurity enthusiasts has grown into a global leader in fingerprint recognition technology.</p>
            <p>Today, we serve over 1,000+ businesses across 15 countries, protecting millions of users with our cutting-edge biometric solutions. Our commitment to innovation and security has made us the trusted choice for enterprises worldwide.</p>
            <div className="stats-container">
              <div className="stat-item">
                <h3>1,000+</h3>
                <p>Businesses Protected</p>
              </div>
              <div className="stat-item">
                <h3>15+</h3>
                <p>Countries Served</p>
              </div>
              <div className="stat-item">
                <h3>99.9%</h3>
                <p>Accuracy Rate</p>
              </div>
              <div className="stat-item">
                <h3>24/7</h3>
                <p>Customer Support</p>
              </div>
            </div>
          </div>
          <div className="about-story-image">
            <svg width="100%" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="50" y="50" width="300" height="200" rx="10" fill="rgba(102,126,234,0.1)" stroke="#667eea" strokeWidth="2"/>
              <circle cx="200" cy="150" r="40" stroke="#667eea" strokeWidth="2" fill="none"/>
              <path d="M200 110V150L225 175" stroke="#667eea" strokeWidth="2" strokeLinecap="round"/>
              <path d="M160 150H240" stroke="#667eea" strokeWidth="2" strokeLinecap="round"/>
              <path d="M200 110V150" stroke="#667eea" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="about-mission-vision">
        <div className="mission-card">
          <div className="mission-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Our Mission</h3>
          <p>To provide cutting-edge biometric security solutions that protect what matters most, making advanced technology accessible and reliable for businesses worldwide.</p>
        </div>
        <div className="vision-card">
          <div className="vision-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Our Vision</h3>
          <p>To become the world's leading provider of biometric authentication, creating a safer digital ecosystem through innovation and excellence.</p>
        </div>
      </div>

      {/* Our Values */}
      <div className="about-values">
        <h2>Our Core Values</h2>
        <div className="values-grid">
          {values.map((value, index) => (
            <div className="value-card" key={index}>
              <div className="value-icon">
                {value.icon}
              </div>
              <h4>{value.title}</h4>
              <p>{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="about-timeline">
        <h2>Our Journey</h2>
        <div className="timeline-container">
          {milestones.map((milestone, index) => (
            <div className="timeline-item" key={index}>
              <div className="timeline-year">{milestone.year}</div>
              <div className="timeline-content">
                <h4>{milestone.title}</h4>
                <p>{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="about-team">
        <h2>Leadership Team</h2>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div className="team-card" key={member.id}>
              <div className="team-icon">
                {member.icon}
              </div>
              <h3>{member.name}</h3>
              <p className="team-position">{member.position}</p>
              <p className="team-bio">{member.bio}</p>
              <button 
                className="connect-btn"
                onClick={() => showToast(`Connect with ${member.name}`, 'success')}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="about-cta">
        <div className="about-cta-content">
          <h2>Ready to Secure Your Business?</h2>
          <p>Join thousands of businesses that trust Fingerprint System</p>
          <button 
            className="cta-btn"
            onClick={() => showToast('Contacting sales team...', 'success')}
          >
            Get Started Today
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;