import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "./StreetMedicine.css";
import { executeQuery } from "../services/db.js";
import { API_ENDPOINTS } from '../config/endpoints.js';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom animated marker icon with REAL IMAGE
const createAnimatedIcon = (color = '#0a58ca', isActive = true) => {
  return L.divIcon({
    className: 'custom-marker animated-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <!-- Pulse rings -->
        <div style="
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(245, 179, 66, 0.25);
          animation: ${isActive ? 'pulse-ring 2s ease-out infinite' : 'none'};
          pointer-events: none;
        "></div>
        <div style="
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(245, 179, 66, 0.15);
          animation: ${isActive ? 'pulse-ring 2s ease-out infinite 1s' : 'none'};
          pointer-events: none;
        "></div>
        
        <!-- Real Image Marker -->
        <div style="
          position: relative;
          z-index: 2;
          animation: ${isActive ? 'bounce-marker 2s ease-in-out infinite' : 'none'};
          filter: drop-shadow(0 0 20px rgba(245, 179, 66, 0.4));
          cursor: pointer;
        ">
          <img 
            src="/image4.webp" 
            alt="Location marker" 
            style="
              width: 45px;
              height: 45px;
              border-radius: 50%;
              border: 3px solid #f5b342;
              object-fit: cover;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              transition: all 0.3s ease;
            "
            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2245%22 height=%2245%22%3E%3Ccircle cx=%2222.5%22 cy=%2222.5%22 r=%2222.5%22 fill=%22%230a58ca%22/%3E%3Ctext x=%2211%22 y=%2228%22 font-size=%2220%22 fill=%22white%22%3E📍%3C/text%3E%3C/svg%3E'"
          />
          <!-- Active indicator dot -->
          <div style="
            position: absolute;
            width: 14px;
            height: 14px;
            background: #f5b342;
            border-radius: 50%;
            bottom: -2px;
            right: -2px;
            border: 3px solid ${color};
            box-shadow: 0 0 20px rgba(245, 179, 66, 0.8);
            animation: ${isActive ? 'blink-dot 1.5s ease-in-out infinite' : 'none'};
            z-index: 3;
          "></div>
        </div>
        
        <!-- Glow effect for active marker -->
        ${isActive ? `
        <div style="
          position: absolute;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 179, 66, 0.2) 0%, transparent 70%);
          animation: glow-pulse 1.5s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        "></div>
        ` : ''}
      </div>
    `,
    iconSize: [50, 60],
    iconAnchor: [25, 55],
    popupAnchor: [0, -50],
  });
};

// ===== SVG ICON COMPONENTS =====

// Location Icon
const LocationIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21C12 21 20 15 20 9C20 4.58172 16.4183 1 12 1C7.58172 1 4 4.58172 4 9C4 15 12 21 12 21Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

// Check Icon
const CheckIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Close Icon
const CloseIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

// Arrow Right Icon
const ArrowRightIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Children Icon (for Who We Serve)
const ChildrenIcon = ({ className }) => (
  <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M5 20V19C5 16.8 6.8 15 9 15H15C17.2 15 19 16.8 19 19V20" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 12V15" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 15L7 18" stroke="currentColor" strokeWidth="2"/>
    <path d="M15 15L17 18" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Individual Icon
const IndividualIcon = ({ className }) => (
  <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M20 21V19C20 16.8 16.4 15 12 15C7.6 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 12V15" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Service Icons
const EmergencyIcon = ({ className }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const ScreeningIcon = ({ className }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const MentalIcon = ({ className }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ReferralIcon = ({ className }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8V11.1C6 12.4 6.5 13.6 7.4 14.5L8 15.1V22H16V15.1L16.6 14.5C17.5 13.6 18 12.3 18 11V8Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M9 15H15" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const EducationIcon = ({ className }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 6V4M12 6C10 6 8 7 8 9C8 11 10 12 12 12C14 12 16 11 16 9C16 7 14 6 12 6Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M4 16C4 14 6 12 9 12H15C18 12 20 14 20 16V20H4V16Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const SocialSupportIcon = ({ className }) => (
  <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M17 3.5L18.5 2L20 3.5L18.5 5L17 3.5Z" fill="currentColor"/>
  </svg>
);

// Heart Icon for CTA
const HeartIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69365 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69365 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57843 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57843 3.16 4.61C2.1283 5.64169 1.54858 7.04096 1.54858 8.5C1.54858 9.95904 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.9379 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12082 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Map Pin Icon
const MapPinIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 21C12 21 20 15 20 9C20 4.58172 16.4183 1 12 1C7.58172 1 4 4.58172 4 9C4 15 12 21 12 21Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

// User Icon (for children count)
const UserIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M5 20V19C5 16.8 6.8 15 9 15H15C17.2 15 19 16.8 19 19V20" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>
);

// Toast Icons
const SuccessToastIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2" fill="none"/>
    <path d="M8 12L11 15L16 9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const ErrorToastIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#dc3545" strokeWidth="2" fill="none"/>
    <path d="M8 8L16 16M16 8L8 16" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

// Camera/Image Icon (fallback for image overlay)
const ImageIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M2 15L7 10L12 15L17 10L22 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// ===== MAIN COMPONENT =====

const StreetMedicine = () => {
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([-2.5167, 32.9000]);
  const [mapZoom, setMapZoom] = useState(12);
  const [activeLocationId, setActiveLocationId] = useState(null);
  const [totalChildren, setTotalChildren] = useState(0);
  const [hasChildrenData, setHasChildrenData] = useState(false);
  
  // Modal state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const openLocationModal = (location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
    setActiveLocationId(location.id);
    document.body.style.overflow = 'hidden';
  };

  const closeLocationModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeLocationModal();
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isModalOpen]);

  const services = [
    {
      title: "Medical Treatment",
      description: "Immediate medical attention for injuries, illnesses, and emergencies on the streets.",
      icon: EmergencyIcon,
    },
    {
      title: "Health Screening",
      description: "Regular check-ups for blood pressure, diabetes, HIV, and other health conditions.",
      icon: ScreeningIcon,
    },
    {
      title: "Mental Health Support",
      description: "Offering psychosocial support and guidance to children and young people experiencing emotional, behavioral, or mental health challenges.",
      icon: MentalIcon,
    },
    {
      title: "Referral Services",
      description: "Connecting individuals to hospitals, shelters, and long-term care facilities.",
      icon: ReferralIcon,
    },
    {
      title: "Health Education & Hygiene",
      description: "Providing practical health education on personal hygiene, disease prevention, nutrition, and healthy living.",
      icon: EducationIcon,
    },
    {
      title: "Social Support",
      description: "Providing essential items such as clothes and shoes to promote dignity, protection, and wellbeing.",
      icon: SocialSupportIcon,
    },
  ];

  // ===== FETCH LOCATIONS =====
  const fetchLocations = async () => {
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

      let childrenCounts = {};
      let total = 0;
      let hasCounts = false;
      
      try {
        const tableCheck = await executeQuery(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='children_profiles'"
        );
        
        if (tableCheck.length > 0) {
          const rows = await executeQuery(
            "SELECT primary_location_id as locationId, COUNT(*) as count FROM children_profiles GROUP BY primary_location_id"
          );
          rows.forEach(row => {
            if (row.locationId) {
              childrenCounts[row.locationId] = (childrenCounts[row.locationId] || 0) + row.count;
              total += row.count;
            }
          });
          if (rows.length > 0) {
            hasCounts = true;
          }
        }
      } catch (dbError) {
        console.warn('Could not get children counts from SQLite:', dbError);
      }

      setHasChildrenData(hasCounts);
      setTotalChildren(total);

      if (locationsArray.length > 0) {
        let apiTotalChildren = 0;
        const mappedLocations = locationsArray.map((location, index) => {
          const locationId = location.id || index + 1;
          const count = location.childrenCount !== undefined && location.childrenCount !== null
            ? Number(location.childrenCount)
            : (childrenCounts[locationId] || 0);
          apiTotalChildren += count;
          return {
            id: locationId,
            name: location.name || location.area || "Unknown Location",
            description: location.description || "Outreach location providing medical services",
            lat: location.lat || location.latitude || 0,
            lng: location.lng || location.longitude || 0,
            address: location.address || location.name || "Mwanza, Tanzania",
            childrenCount: count,
            version: location.version,
            lastModifiedAt: location.lastModifiedAt,
            image: location.image || "/image4.webp",
          };
        });

        if (!hasCounts && apiTotalChildren > 0) {
          setTotalChildren(apiTotalChildren);
          setHasChildrenData(true);
        }

        const validLocations = mappedLocations.filter(
          loc => loc.lat !== 0 && loc.lng !== 0 && !isNaN(loc.lat) && !isNaN(loc.lng)
        );

        setLocations(validLocations);
        
        if (validLocations.length > 0) {
          setMapCenter([validLocations[0].lat, validLocations[0].lng]);
          setActiveLocationId(validLocations[0].id);
        } else {
          showToast("No valid locations found with coordinates", "error");
          setLocations([]);
        }
      } else {
        showToast("No locations data available", "error");
        setLocations([]);
        setHasChildrenData(false);
        setTotalChildren(0);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      showToast("Failed to load locations. Please try again later.", "error");
      setLocations([]);
      setTotalChildren(0);
      setHasChildrenData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Rotate active location every 3 seconds
  useEffect(() => {
    if (locations.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveLocationId((prevId) => {
        const currentIndex = locations.findIndex(loc => loc.id === prevId);
        const nextIndex = (currentIndex + 1) % locations.length;
        return locations[nextIndex]?.id || locations[0]?.id;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [locations]);

  return (
    <div className="street-medicine-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'error' ? (
              <ErrorToastIcon className="toast-icon" />
            ) : (
              <SuccessToastIcon className="toast-icon" />
            )}
            <span className="toast-message">{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: "", type: "" })}>
            ×
          </button>
        </div>
      )}

      {/* Location Detail Modal */}
      {isModalOpen && selectedLocation && (
        <div className="modal-overlay" onClick={closeLocationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeLocationModal}>×</button>
            
            <div className="modal-body">
              <div className="modal-image-container">
                <img 
                  src="/image4.webp" 
                  alt={selectedLocation.name}
                  className="modal-location-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/image4.webp";
                  }}
                />
                <div className="modal-image-overlay">
                  <h2 className="modal-location-name">{selectedLocation.name}</h2>
                  <span className="modal-location-status">
                    <span className="status-dot"></span>
                    Active Location
                  </span>
                </div>
              </div>
              
              <div className="modal-details">
                <div className="modal-section">
                  <h3>
                    <LocationIcon className="modal-section-icon" />
                    Location Details
                  </h3>
                  <p className="modal-description">{selectedLocation.description}</p>
                  <div className="modal-info-grid">
                    <div className="modal-info-item">
                      <span className="info-label">Address</span>
                      <span className="info-value">{selectedLocation.address}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Children Registered</span>
                      <span className="info-value highlight">{selectedLocation.childrenCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="street-medicine-hero">
        <div className="street-medicine-hero-content">
          <span className="badge">
            <CheckIcon className="badge-icon" />
            Since 2015
          </span>
          <h1>Street Medicine Project</h1>
          <p>Call to care. Committed to community.</p>
          <div className="hero-line"></div>
        </div>
      </div>

      {/* What is Street Medicine Section */}
      <div className="what-is-section">
        <div className="container">
          <div className="what-is-content">
            <div className="what-is-text">
              <h2><span>The Street Medicine Project</span></h2>
              <p>
                The Street Medicine Project was initiated in 2015, initially known as the Wound Care Project for Street Children.
                It provides medical and social support to vulnerable people living or spending significant time on the streets,
                particularly street-connected children and elderly people.
              </p>
              <p>
                The project brings healthcare services directly to people who may face difficulties accessing health facilities.
                Services include free medical consultations, wound care, treatment of common infections and neglected diseases,
                health education, hygiene support, food, clothing, and psychosocial support.
              </p>
              <p>
                The project aims to improve the health, dignity, and overall wellbeing of people living on the streets while helping them access continued care and support.
              </p>
            </div>
            <div className="what-is-image">
              <img src="/image4.webp" alt="Street Medicine in action" />
              <div className="image-overlay">
                <ImageIcon className="overlay-icon" />
                <span>Call to care. Committed to community.</span>
              </div>
              <div className="stat-badge">
                <span className="number">{totalChildren || 0}+</span>
                <span className="label">Children Served</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Map Section */}
      <div className="map-full-section">
        <div className="map-header">
          <h2><span>Our Outreach Locations</span></h2>
          {hasChildrenData && totalChildren > 0 && (
            <div className="map-total-children">
              <span className="total-count">{totalChildren}</span>
              children registered across all locations
            </div>
          )}
          <p className="map-subtitle">
            <MapPinIcon className="subtitle-icon" />
            Click on any marker to learn more about each location
          </p>
        </div>
        
        <div className="map-full-container">
          {!loading && locations.length > 0 && (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '550px', width: '100%' }}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {locations.map((location, index) => (
                location.lat && location.lng && (
                  <Marker
                    key={location.id || index}
                    position={[location.lat, location.lng]}
                    icon={createAnimatedIcon('#0a58ca', location.id === activeLocationId)}
                    eventHandlers={{
                      click: () => openLocationModal(location)
                    }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h4>{location.name}</h4>
                        <p className="popup-location">
                          <LocationIcon className="popup-location-icon" />
                          {location.address || "Mwanza, Tanzania"}
                        </p>
                        <p>{location.description}</p>
                        {hasChildrenData && (
                          <div className="popup-children-count">
                            <div className="count-icon">
                              <UserIcon />
                            </div>
                            <div className="count-info">
                              <span className="count-number">{location.childrenCount || 0}</span>
                              <span className="count-label">Children Registered</span>
                            </div>
                          </div>
                        )}
                        <button 
                          className="popup-view-details"
                          onClick={() => {
                            setTimeout(() => openLocationModal(location), 100);
                          }}
                        >
                          View Details
                          <ArrowRightIcon className="btn-arrow" />
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          )}
          {loading && (
            <div className="map-loading-full">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading map...</span>
            </div>
          )}
          {!loading && locations.length === 0 && (
            <div className="map-loading-full">
              <span className="loading-text">No locations available at the moment. Please try again later.</span>
            </div>
          )}
        </div>
      </div>

      {/* Who We Serve Section */}
      <div className="who-we-serve-section">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title"><span className="highlight">Who We Serve</span></h2>
            <p className="section-subtitle">
              We serve <strong>vulnerable children and individuals living on the streets</strong> at Mwanza, Tanzania.
              Our primary beneficiaries include:
            </p>
            <div className="section-underline"></div>
          </div>
          
          <div className="serve-grid">
            <div className="serve-item">
              <div className="serve-icon"><ChildrenIcon /></div>
              <h4>Street Connected Children</h4>
              <p>Children who live, work, and sleep on the streets without stable shelter or family support.</p>
            </div>
            <div className="serve-item">
              <div className="serve-icon"><IndividualIcon /></div>
              <h4>Elderly & Homeless Population</h4>
              <p>Adults who have experienced homelessness, displacement, or are living in temporary accommodations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="what-we-do-section">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title"><span className="highlight">What We Do</span></h2>
            <p className="section-subtitle">
              Our dedicated team of healthcare professionals, social workers, and volunteers meet vulnerable individuals where they are,
              bringing essential healthcare, support, and practical services directly to the communities where they live.
            </p>
            <div className="section-underline"></div>
          </div>
          
          <div className="services-grid">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div className="service-card" key={index}>
                  <div className="service-icon">
                    <IconComponent />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Objectives Section */}
      <div className="objectives-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title"><span className="highlight">Our Objectives</span></h2>
            <div className="section-underline"></div>
          </div>
          
          <div className="objectives-grid">
            <div className="objective-item">
              <div className="objective-number">01</div>
              <h3>Accessible Healthcare</h3>
              <p>Provide accessible, free, and compassionate healthcare to vulnerable children and individuals on the streets of Mwanza.</p>
            </div>
            <div className="objective-item">
              <div className="objective-number">02</div>
              <h3>Health Awareness</h3>
              <p>Increase health awareness and prevention through education on hygiene, nutrition, and disease prevention.</p>
            </div>
            <div className="objective-item">
              <div className="objective-number">03</div>
              <h3>Social Reintegration</h3>
              <p>Support social reintegration by connecting individuals to long-term care, shelter, and family reunification programs.</p>
            </div>
            <div className="objective-item">
              <div className="objective-number">04</div>
              <h3>Community Partnership</h3>
              <p>Build sustainable partnerships with local organizations, government bodies, and community leaders to strengthen healthcare delivery.</p>
            </div>
            <div className="objective-item">
              <div className="objective-number">05</div>
              <h3>Dignity &amp; Empowerment</h3>
              <p>Ensure every person served receives care with dignity, respect, and empowerment for a better future.</p>
            </div>
            <div className="objective-item">
              <div className="objective-number">06</div>
              <h3>Reach &amp; Impact</h3>
              <p>Expand our reach and impact to cover more locations and serve more individuals across Mwanza.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <span className="cta-badge">
              <HeartIcon className="cta-badge-icon" />
              Get Involved
            </span>
            <h2>Join Our <span>Movement</span></h2>
            <p>Together, we can reach more children and provide life-changing healthcare services.</p>
            <div className="cta-buttons">
              <a href="/support" className="cta-btn primary">
                <HeartIcon className="btn-icon" />
                Become a Volunteer
              </a>
              <a href="/contact" className="cta-btn secondary">
                Contact Us
                <ArrowRightIcon className="btn-icon" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreetMedicine;