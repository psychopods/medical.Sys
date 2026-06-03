import React, { useState, useEffect } from 'react';
import './StreetMedicine.css';

const API_BASE_URL = 'http://localhost:9865';

const StreetMedicine = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const services = [
    {
      title: 'Emergency Medical Care',
      description: 'Immediate medical attention for injuries, illnesses, and emergencies on the streets.',
      icon: 'emergency'
    },
    {
      title: 'Health Screenings',
      description: 'Regular check-ups for blood pressure, diabetes, HIV, and other health conditions.',
      icon: 'screening'
    },
    {
      title: 'Mental Health Support',
      description: 'Counseling and psychological support for trauma, depression, and anxiety.',
      icon: 'mental'
    },
    {
      title: 'Referral Services',
      description: 'Connecting individuals to hospitals, shelters, and long-term care facilities.',
      icon: 'referral'
    },
    {
      title: 'Health Education',
      description: 'Teaching hygiene, disease prevention, and healthy living practices.',
      icon: 'education'
    },
    {
      title: 'Social Reintegration',
      description: 'Helping individuals reconnect with family and access social services.',
      icon: 'reintegration'
    }
  ];

  // Fetch locations from API - Public endpoint (no authentication)
  const fetchLocations = async () => {
    setLoading(true);
    try {
      // Try public endpoint first
      let response = await fetch(`${API_BASE_URL}/api/locations/public`);
      
      // If public endpoint doesn't exist, try without auth headers
      if (!response.ok) {
        response = await fetch(`${API_BASE_URL}/api/locations`);
      }
      
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        const mappedLocations = data.map(location => ({
          area: location.name,
          days: location.outreach_days || 'Monday - Friday',
          time: location.outreach_time || '9:00 AM - 5:00 PM',
          team: location.team_info || 'Medical Team Available',
          locationId: location.id,
          description: location.description || ''
        }));
        setLocations(mappedLocations);
      } else if (response.ok && data.locations && Array.isArray(data.locations)) {
        const mappedLocations = data.locations.map(location => ({
          area: location.name,
          days: location.outreach_days || 'Monday - Friday',
          time: location.outreach_time || '9:00 AM - 5:00 PM',
          team: location.team_info || 'Medical Team Available',
          locationId: location.id,
          description: location.description || ''
        }));
        setLocations(mappedLocations);
      } else {
        // Fallback to default locations when API returns error
        console.log('Using default locations');
        setLocations([
          {
            area: 'Mwanza City Center',
            days: 'Monday & Thursday',
            time: '9:00 AM - 4:00 PM',
            team: 'Medical Team'
          },
          {
            area: 'Nyasaka District',
            days: 'Tuesday & Friday',
            time: '10:00 AM - 5:00 PM',
            team: 'Medical Team'
          },
          {
            area: 'Ilemela',
            days: 'Wednesday & Saturday',
            time: '8:00 AM - 3:00 PM',
            team: 'Medical Team'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fallback to default locations on network error
      setLocations([
        {
          area: 'Mwanza City Center',
          days: 'Monday & Thursday',
          time: '9:00 AM - 4:00 PM',
          team: 'Medical Team'
        },
        {
          area: 'Nyasaka District',
          days: 'Tuesday & Friday',
          time: '10:00 AM - 5:00 PM',
          team: 'Medical Team'
        },
        {
          area: 'Ilemela',
          days: 'Wednesday & Saturday',
          time: '8:00 AM - 3:00 PM',
          team: 'Medical Team'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const getServiceIcon = (serviceName) => {
    switch(serviceName) {
      case 'emergency':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case 'screening':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V16M8 12H16" stroke="#0066cc" strokeWidth="2"/>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case 'mental':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="#0066cc" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case 'referral':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8V11.1C6 12.4 6.5 13.6 7.4 14.5L8 15.1V22H16V15.1L16.6 14.5C17.5 13.6 18 12.3 18 11V8Z" stroke="#0066cc" strokeWidth="2"/>
            <path d="M9 15H15" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case 'education':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6V4M12 6C10 6 8 7 8 9C8 11 10 12 12 12C14 12 16 11 16 9C16 7 14 6 12 6Z" stroke="#0066cc" strokeWidth="2"/>
            <path d="M4 16C4 14 6 12 9 12H15C18 12 20 14 20 16V20H4V16Z" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case 'reintegration':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#0066cc" strokeWidth="2"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#0066cc" strokeWidth="2"/>
            <path d="M17 3.5L18.5 2L20 3.5L18.5 5L17 3.5Z" fill="#0066cc"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="street-medicine-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
        </div>
      )}

      {/* Hero Section */}
      <div className="street-medicine-hero">
        <div className="street-medicine-hero-content">
          <h1>Street Medicine Project</h1>
          <p>Bringing healthcare directly to vulnerable children and individuals living on the streets</p>
        </div>
      </div>

      {/* Introduction Section */}
      <div className="introduction-section">
        <div className="container">
          <div className="intro-content">
            <h2>About the Project</h2>
            <p>The Street Medicine Project is a community outreach initiative focused on delivering healthcare, housing, and social support services directly to vulnerable children and individuals living in street situations. Through direct community engagement, we ensure that healthcare reaches those who may not easily access hospitals or health facilities.</p>
            <p>Our mobile medical teams go where help is needed most, providing compassionate, non-judgmental care to some of the most underserved members of our community.</p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="services-section">
        <div className="container">
          <h2 className="section-title">What We Offer</h2>
          <div className="services-grid">
            {services.map((service, index) => (
              <div className="service-card" key={index}>
                <div className="service-icon">{getServiceIcon(service.icon)}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Outreach Locations */}
      <div className="locations-section">
        <div className="container">
          <h2 className="section-title">Outreach Locations</h2>
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading locations...</p>
            </div>
          ) : locations.length > 0 ? (
            <div className="locations-grid">
              {locations.map((location, index) => (
                <div className="location-card" key={index}>
                  <div className="location-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#0066cc" strokeWidth="2"/>
                      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#0066cc" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3>{location.area}</h3>
                  <div className="location-detail">
                    <span className="detail-label">Days:</span>
                    <span>{location.days}</span>
                  </div>
                  <div className="location-detail">
                    <span className="detail-label">Time:</span>
                    <span>{location.time}</span>
                  </div>
                  <div className="location-detail">
                    <span className="detail-label">Team:</span>
                    <span>{location.team}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-container">
              <div className="no-data-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="#0066cc" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" fill="#0066cc"/>
                </svg>
              </div>
              <h3>No Locations Available</h3>
              <p>Outreach location information will be updated soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action with Background Image */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Join Our Mission</h2>
            <p>Together, we can reach more children and provide life-changing healthcare services.</p>
            <div className="cta-buttons">
              <a href="/support" className="cta-btn primary">Become a Volunteer</a>
              <a href="/contact" className="cta-btn secondary">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreetMedicine;