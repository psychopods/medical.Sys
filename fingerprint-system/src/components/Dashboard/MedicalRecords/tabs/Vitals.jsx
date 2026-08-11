import React from "react";
import "./Vitals.css";

const Vitals = ({ 
  vitalsData, 
  setVitalsData, 
  calculateBMI, 
  getBMIStatus, 
  saveVitals 
}) => {
  return (
    <div className="mr-vitals-form">
      <h3>Vitals Measurements</h3>
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={vitalsData.weight}
            onChange={(e) =>
              setVitalsData({ ...vitalsData, weight: e.target.value })
            }
            placeholder="e.g., 55"
          />
        </div>
        <div className="mr-form-group">
          <label>Height (cm)</label>
          <input
            type="number"
            step="0.1"
            value={vitalsData.height}
            onChange={(e) =>
              setVitalsData({ ...vitalsData, height: e.target.value })
            }
            placeholder="e.g., 165"
          />
        </div>
      </div>
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>BMI</label>
          <input
            type="text"
            value={calculateBMI(vitalsData.weight, vitalsData.height)}
            disabled
            placeholder="Auto-calculated"
          />
        </div>
        <div className="mr-form-group">
          <label>BMI Status</label>
          <input
            type="text"
            value={getBMIStatus(
              calculateBMI(vitalsData.weight, vitalsData.height),
            )}
            disabled
          />
        </div>
      </div>
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Measurement Date</label>
          <input
            type="date"
            value={vitalsData.date}
            onChange={(e) =>
              setVitalsData({ ...vitalsData, date: e.target.value })
            }
          />
        </div>
      </div>
      <div className="mr-form-actions">
        <button className="mr-btn mr-btn-primary" onClick={saveVitals}>
          Save Vitals
        </button>
      </div>
    </div>
  );
};

export default Vitals;