import React from "react";
import "./Vitals.css";

const LoadingSpinner = () => (
  <svg className="mr-btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

const Vitals = ({ 
  vitalsData, 
  setVitalsData, 
  calculateBMI, 
  getBMIStatus, 
  saveVitals,
  savingVitals = false
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
        <button 
          className="mr-btn mr-btn-primary" 
          onClick={saveVitals}
          disabled={savingVitals}
        >
          {savingVitals ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  );
};

export default Vitals;