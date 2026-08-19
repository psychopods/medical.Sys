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
const createAnimatedIcon = (color = '#0066cc', isActive = true) => {
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
          background: rgba(255, 215, 0, 0.25);
          animation: ${isActive ? 'pulse-ring 2s ease-out infinite' : 'none'};
          pointer-events: none;
        "></div>
        <div style="
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255, 215, 0, 0.15);
          animation: ${isActive ? 'pulse-ring 2s ease-out infinite 1s' : 'none'};
          pointer-events: none;
        "></div>
        
        <!-- Real Image Marker -->
        <div style="
          position: relative;
          z-index: 2;
          animation: ${isActive ? 'bounce-marker 2s ease-in-out infinite' : 'none'};
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.4));
          cursor: pointer;
        ">
          <img 
            src="/image4.webp" 
            alt="Location marker" 
            style="
              width: 45px;
              height: 45px;
              border-radius: 50%;
              border: 3px solid #ffd700;
              object-fit: cover;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
              transition: all 0.3s ease;
            "
            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2245%22 height=%2245%22%3E%3Ccircle cx=%2222.5%22 cy=%2222.5%22 r=%2222.5%22 fill=%22%230066cc%22/%3E%3Ctext x=%2211%22 y=%2228%22 font-size=%2220%22 fill=%22white%22%3E📍%3C/text%3E%3C/svg%3E'"
          />
          <!-- Active indicator dot -->
          <div style="
            position: absolute;
            width: 14px;
            height: 14px;
            background: #ffd700;
            border-radius: 50%;
            bottom: -2px;
            right: -2px;
            border: 3px solid ${color};
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
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
          background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
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

  // Open modal with location details
  const openLocationModal = (location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
    setActiveLocationId(location.id);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  const closeLocationModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
    // Restore body scroll
    document.body.style.overflow = 'auto';
  };

  // Close modal on Escape key
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
      title: "Emergency Medical Care",
      description:
        "Immediate medical attention for injuries, illnesses, and emergencies on the streets.",
      icon: "emergency",
    },
    {
      title: "Health Screenings",
      description:
        "Regular check-ups for blood pressure, diabetes, HIV, and other health conditions.",
      icon: "screening",
    },
    {
      title: "Mental Health Support",
      description:
        "Counseling and psychological support for trauma, depression, and anxiety.",
      icon: "mental",
    },
    {
      title: "Referral Services",
      description:
        "Connecting individuals to hospitals, shelters, and long-term care facilities.",
      icon: "referral",
    },
    {
      title: "Health Education",
      description:
        "Teaching hygiene, disease prevention, and healthy living practices.",
      icon: "education",
    },
    {
      title: "Social Reintegration",
      description:
        "Helping individuals reconnect with family and access social services.",
      icon: "reintegration",
    },
  ];

  // ===== FETCH LOCATIONS (PUBLIC) =====
  const fetchLocations = async () => {
    setLoading(true);
    try {
      // Fetch locations from public API
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

      // Try to get children counts from SQLite cache (if available)
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

        // Filter out locations with invalid coordinates
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

  const getServiceIcon = (serviceName) => {
    switch (serviceName) {
      case "emergency":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="#0066cc" strokeWidth="2" fill="none"/>
          </svg>
        );
      case "screening":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V16M8 12H16" stroke="#0066cc" strokeWidth="2"/>
            <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case "mental":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="2"/>
            <path d="M12 8V12L15 15" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case "referral":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8V11.1C6 12.4 6.5 13.6 7.4 14.5L8 15.1V22H16V15.1L16.6 14.5C17.5 13.6 18 12.3 18 11V8Z" stroke="#0066cc" strokeWidth="2" fill="none"/>
            <path d="M9 15H15" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case "education":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6V4M12 6C10 6 8 7 8 9C8 11 10 12 12 12C14 12 16 11 16 9C16 7 14 6 12 6Z" stroke="#0066cc" strokeWidth="2" fill="none"/>
            <path d="M4 16C4 14 6 12 9 12H15C18 12 20 14 20 16V20H4V16Z" stroke="#0066cc" strokeWidth="2" fill="none"/>
          </svg>
        );
      case "reintegration":
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#0066cc" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="7" r="4" stroke="#0066cc" strokeWidth="2" fill="none"/>
            <path d="M17 3.5L18.5 2L20 3.5L18.5 5L17 3.5Z" fill="#0066cc"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // SVG Icons for Who We Serve section
  const serveIcons = {
    children: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="4" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M5 20V19C5 16.8 6.8 15 9 15H15C17.2 15 19 16.8 19 19V20" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M12 12V15" stroke="#0066cc" strokeWidth="2"/>
        <path d="M9 15L7 18" stroke="#0066cc" strokeWidth="2"/>
        <path d="M15 15L17 18" stroke="#0066cc" strokeWidth="2"/>
      </svg>
    ),
    individual: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="4" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M20 21V19C20 16.8 16.4 15 12 15C7.6 15 4 16.8 4 19V21" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M12 12V15" stroke="#0066cc" strokeWidth="2"/>
      </svg>
    ),
    settlers: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 3L21 9V21H3V9Z" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M9 21V15H15V21" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M12 3V6" stroke="#0066cc" strokeWidth="2"/>
        <path d="M9 12H15" stroke="#0066cc" strokeWidth="2"/>
        <path d="M12 9V15" stroke="#0066cc" strokeWidth="2"/>
      </svg>
    ),
    families: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="6" r="3" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <circle cx="16" cy="6" r="3" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M2 18V16C2 13.8 3.8 12 6 12H10C12.2 12 14 13.8 14 16V18" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M12 18V16C12 13.8 13.8 12 16 12H20C22.2 12 24 13.8 24 16V18" stroke="#0066cc" strokeWidth="2" fill="none"/>
        <path d="M8 9V12" stroke="#0066cc" strokeWidth="2"/>
        <path d="M16 9V12" stroke="#0066cc" strokeWidth="2"/>
      </svg>
    )
  };

  return (
    <div className="street-medicine-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
          </div>
          <button
            className="toast-close"
            onClick={() => setToast({ show: false, message: "", type: "" })}
          >
            ×
          </button>
        </div>
      )}

      {/* Location Detail Modal - Simple No Overlay */}
      {isModalOpen && selectedLocation && (
        <div className="modal-overlay" onClick={closeLocationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeLocationModal}>
              ×
            </button>
            
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
                  <h3>📍 Location Details</h3>
                  <p className="modal-description">{selectedLocation.description}</p>
                  <div className="modal-info-grid">
                    <div className="modal-info-item">
                      <span className="info-label">Address:</span>
                      <span className="info-value">{selectedLocation.address}</span>
                    </div>
                    <div className="modal-info-item">
                      <span className="info-label">Children Registered:</span>
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
          <h1>Street Medicine Project</h1>
          <p>
            Bringing healthcare directly to vulnerable children and individuals
            living on the streets
          </p>
        </div>
      </div>

      {/* What is Street Medicine Section */}
      <div className="what-is-section">
        <div className="container">
          <div className="what-is-content">
            <h2>What is Street Medicine?</h2>
            <p>
              <strong>Street Medicine</strong> is a community-based healthcare approach that delivers 
              medical services directly to individuals living on the streets, in shelters, and other 
              temporary accommodations. It is founded on the principle that <strong>healthcare should be 
              accessible to everyone</strong>, regardless of their housing status or social circumstances.
            </p>
            <p>
              The Street Medicine Project was established in response to the growing number of 
              vulnerable children and individuals in Mwanza who lack access to traditional healthcare 
              systems. Many of these individuals face barriers such as poverty, stigma, lack of 
              documentation, and limited mobility — making it difficult to seek care at hospitals 
              or health centers.
            </p>
          </div>
        </div>
      </div>

      {/* Full Width Map Section */}
      <div className="map-full-section">
        <div className="map-header">
          <h2>Our Outreach Locations</h2>
          {hasChildrenData && totalChildren > 0 && (
            <p className="map-total-children">
              <span className="total-count">{totalChildren}</span> children registered across all locations
            </p>
          )}
          <p className="map-subtitle">Click on any marker to learn more about each location</p>
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
                    icon={createAnimatedIcon('#0066cc', location.id === activeLocationId)}
                    eventHandlers={{
                      click: () => openLocationModal(location)
                    }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h4>{location.name}</h4>
                        <p>{location.description}</p>
                        <p className="popup-address">{location.address || "Mwanza, Tanzania"}</p>
                        {hasChildrenData && (
                          <div className="popup-children-count">
                            <div className="count-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="8" r="4" stroke="#0066cc" strokeWidth="2" fill="none"/>
                                <path d="M5 20V19C5 16.8 6.8 15 9 15H15C17.2 15 19 16.8 19 19V20" stroke="#0066cc" strokeWidth="2" fill="none"/>
                                <circle cx="12" cy="20" r="1" fill="#0066cc"/>
                              </svg>
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
                          View Details →
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
              <p>Loading map...</p>
            </div>
          )}
          {!loading && locations.length === 0 && (
            <div className="map-loading-full">
              <p>No locations available at the moment. Please try again later.</p>
            </div>
          )}
        </div>
      </div>

      {/* Who We Serve Section */}
      <div className="who-we-serve-section">
        <div className="container">
          <div className="who-we-serve-content">
            <h2>Who We Serve</h2>
            <p>
              We serve <strong>vulnerable children and individuals living on the streets</strong> at 
              Mwanza, Tanzania. Our primary beneficiaries include:
            </p>
            <div className="serve-grid">
              <div className="serve-item">
                <div className="serve-icon">{serveIcons.children}</div>
                <h4>Street Children</h4>
                <p>Children who live, work, and sleep on the streets without stable shelter or family support.</p>
              </div>
              <div className="serve-item">
                <div className="serve-icon">{serveIcons.individual}</div>
                <h4>Street Individuals</h4>
                <p>Adults who have experienced homelessness, displacement, or are living in temporary accommodations.</p>
              </div>
              <div className="serve-item">
                <div className="serve-icon">{serveIcons.settlers}</div>
                <h4>Informal Settlers</h4>
                <p>People living in informal settlements who face barriers accessing healthcare services.</p>
              </div>
              <div className="serve-item">
                <div className="serve-icon">{serveIcons.families}</div>
                <h4>Families in Crisis</h4>
                <p>Families who are at risk of displacement or require immediate medical attention.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="what-we-do-section">
        <div className="container">
          <div className="what-we-do-content">
            <h2>What We Do</h2>
            <p>
              Our dedicated team of healthcare professionals, social workers, and volunteers 
              travel directly to areas where vulnerable individuals are located. We provide:
            </p>
            <div className="services-grid">
              {services.map((service, index) => (
                <div className="service-card" key={index}>
                  <div className="service-icon">
                    {getServiceIcon(service.icon)}
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Objectives Section */}
      <div className="objectives-section">
        <div className="container">
          <h2 className="section-title">Our Objectives</h2>
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
              <h3>Dignity & Empowerment</h3>
              <p>Ensure every person served receives care with dignity, respect, and empowerment for a better future.</p>
            </div>
            <div className="objective-item">
              <div className="objective-number">06</div>
              <h3>Reach & Impact</h3>
              <p>Expand our reach and impact to cover more locations and serve more individuals across Mwanza.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Join Our Mission</h2>
            <p>
              Together, we can reach more children and provide life-changing
              healthcare services.
            </p>
            <div className="cta-buttons">
              <a href="/support" className="cta-btn primary">
                Become a Volunteer
              </a>
              <a href="/contact" className="cta-btn secondary">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreetMedicine;