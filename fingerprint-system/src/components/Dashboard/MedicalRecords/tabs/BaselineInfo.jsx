// src/components/Dashboard/MedicalRecords/tabs/BaselineInfo.jsx
import React, { useState, useEffect } from "react";
import "./BaselineInfo.css";
import * as api from "../../../../services/api.js";

const BaselineInfo = ({ 
  child, 
  baselineData, 
  setBaselineData, 
  saveBaselineInfo,
  showToast 
}) => {
  const [locationNames, setLocationNames] = useState({});

  // Fetch location names
  const fetchLocationNames = async () => {
    try {
      const locations = await api.getLocations();
      const locationMap = {};
      locations.forEach(loc => {
        locationMap[loc.id] = loc.name;
      });
      setLocationNames(locationMap);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    fetchLocationNames();
  }, []);

  // Get location name from ID
  const getLocationName = (locationId) => {
    if (!locationId) return 'N/A';
    return locationNames[locationId] || locationId;
  };

  // Get display location name
  const getDisplayLocation = () => {
    const locationId = baselineData.location || child?.primaryLocationId || '';
    return getLocationName(locationId);
  };

  return (
    <div className="mr-baseline-form">
      <h3>Baseline Information</h3>
      
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Kid ID</label>
          <input type="text" value={baselineData.kidId || child?.customSerialId || 'N/A'} disabled />
        </div>
        <div className="mr-form-group">
          <label>Full Name</label>
          <input type="text" value={baselineData.fullName || child?.fullName || 'N/A'} disabled />
        </div>
      </div>
      
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Gender</label>
          <input type="text" value={baselineData.gender || child?.gender || 'N/A'} disabled />
        </div>
        <div className="mr-form-group">
          <label>Age</label>
          <input type="text" value={baselineData.age || child?.age || 'N/A'} disabled />
        </div>
      </div>
      
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Visit Date</label>
          <input
            type="date"
            value={baselineData.visitDate}
            onChange={(e) =>
              setBaselineData({
                ...baselineData,
                visitDate: e.target.value,
              })
            }
          />
        </div>
        <div className="mr-form-group">
          <label>Location</label>
          <input type="text" value={getDisplayLocation()} disabled />
        </div>
      </div>
      
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label className="mr-checkbox-label-inline">
            <input
              type="checkbox"
              checked={baselineData.firstVisit}
              onChange={(e) =>
                setBaselineData({
                  ...baselineData,
                  firstVisit: e.target.checked,
                })
              }
            />
            First Visit
          </label>
        </div>
      </div>
      
      <div className="mr-form-actions">
        <button
          className="mr-btn mr-btn-primary"
          onClick={saveBaselineInfo}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BaselineInfo;