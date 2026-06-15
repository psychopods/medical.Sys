import React, { useState, useEffect } from "react";
import "./StreetMedicine.css";
import { executeQuery } from "../services/db.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const StreetMedicine = () => {
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

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

  // Fetch locations from API - Public endpoint (no authentication)
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle both response formats
      let locationsArray = [];

      if (Array.isArray(data)) {
        locationsArray = data;
      } else if (data.locations && Array.isArray(data.locations)) {
        locationsArray = data.locations;
      }

      if (locationsArray.length > 0) {
        const mappedLocations = locationsArray.map((location) => ({
          id: location.id,
          area: location.name,
          description:
            location.description ||
            "Outreach location providing medical services",
          version: location.version,
          lastModifiedAt: location.lastModifiedAt,
        }));
        setLocations(mappedLocations);
      } else {
        throw new Error("Non-ok response from locations API");
      }
    } catch (error) {
      console.warn(
        "API: Failed to fetch locations, falling back to local SQLite...",
        error,
      );
      try {
        const localRows = await executeQuery(
          "SELECT * FROM child_locations ORDER BY name ASC",
        );
        if (localRows.length > 0) {
          const mapped = localRows.map((location) => ({
            area: location.name,
            days: "Monday - Friday",
            time: "9:00 AM - 5:00 PM",
            team: "Medical Team Available",
            locationId: location.id,
            description: location.description || "",
          }));
          setLocations(mapped);
          return;
        }
      } catch (dbError) {
        console.error("API: Local SQLite fallback failed:", dbError);
      }

      // Hardcoded fallback if both API and SQLite are empty
      setLocations([
        {
          area: "Mwanza City Center",
          days: "Monday & Thursday",
          time: "9:00 AM - 4:00 PM",
          team: "Medical Team",
        },
        {
          area: "Nyasaka District",
          days: "Tuesday & Friday",
          time: "10:00 AM - 5:00 PM",
          team: "Medical Team",
        },
        {
          area: "Ilemela",
          days: "Wednesday & Saturday",
          time: "8:00 AM - 3:00 PM",
          team: "Medical Team",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const getServiceIcon = (serviceName) => {
    switch (serviceName) {
      case "emergency":
        return (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z"
              stroke="#0066cc"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        );
      case "screening":
        return (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 8V16M8 12H16" stroke="#0066cc" strokeWidth="2" />
            <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="2" />
          </svg>
        );
      case "mental":
        return (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="2" />
            <path d="M12 8V12L15 15" stroke="#0066cc" strokeWidth="2" />
          </svg>
        );
      case "referral":
        return (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8V11.1C6 12.4 6.5 13.6 7.4 14.5L8 15.1V22H16V15.1L16.6 14.5C17.5 13.6 18 12.3 18 11V8Z"
              stroke="#0066cc"
              strokeWidth="2"
              fill="none"
            />
            <path d="M9 15H15" stroke="#0066cc" strokeWidth="2" />
          </svg>
        );
      case "education":
        return (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 6V4M12 6C10 6 8 7 8 9C8 11 10 12 12 12C14 12 16 11 16 9C16 7 14 6 12 6Z"
              stroke="#0066cc"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M4 16C4 14 6 12 9 12H15C18 12 20 14 20 16V20H4V16Z"
              stroke="#0066cc"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        );
      case "reintegration":
        return (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"
              stroke="#0066cc"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="12"
              cy="7"
              r="4"
              stroke="#0066cc"
              strokeWidth="2"
              fill="none"
            />
            <path d="M17 3.5L18.5 2L20 3.5L18.5 5L17 3.5Z" fill="#0066cc" />
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
          <button
            className="toast-close"
            onClick={() => setToast({ show: false, message: "", type: "" })}
          >
            ×
          </button>
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

      {/* Introduction Section */}
      <div className="introduction-section">
        <div className="container">
          <div className="intro-content">
            <h2>About the Project</h2>
            <p>
              The Street Medicine Project is a community outreach initiative
              focused on delivering healthcare, housing, and social support
              services directly to vulnerable children and individuals living in
              street situations. Through direct community engagement, we ensure
              that healthcare reaches those who may not easily access hospitals
              or health facilities.
            </p>
            <p>
              Our mobile medical teams go where help is needed most, providing
              compassionate, non-judgmental care to some of the most underserved
              members of our community.
            </p>
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
              {locations.map((location) => (
                <div className="location-card" key={location.id}>
                  <div className="location-icon">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
                        stroke="#0066cc"
                        strokeWidth="2"
                        fill="none"
                      />
                      <circle
                        cx="12"
                        cy="10"
                        r="3"
                        stroke="#0066cc"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <h3>{location.area}</h3>
                  {location.description && (
                    <p className="location-description">
                      {location.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-container">
              <div className="no-data-icon">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#0066cc"
                    strokeWidth="2"
                    fill="none"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                    stroke="#0066cc"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="16" r="1" fill="#0066cc" />
                </svg>
              </div>
              <h3>No Locations Available</h3>
              <p>Outreach location information will be updated soon.</p>
              <button onClick={fetchLocations} className="retry-btn">
                Retry
              </button>
            </div>
          )}
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
