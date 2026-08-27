import React from "react";
import "./Others.css";

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

const Others = ({ 
  othersData, 
  setOthersData, 
  saveOthers,
  showToast,
  savingOthers = false
}) => {
  // Handle Hospitalization Toggle
  const handleHospitalizationToggle = () => {
    setOthersData({
      ...othersData,
      hospitalized: !othersData.hospitalized,
      // Reset time hospitalized if unchecked
      timeHospitalized: !othersData.hospitalized ? othersData.timeHospitalized : ""
    });
  };

  // Handle Time Hospitalized Change
  const handleTimeHospitalizedChange = (value) => {
    setOthersData({
      ...othersData,
      timeHospitalized: value
    });
  };

  return (
    <div className="mr-others-form">
      <h3>Patient Assessment</h3>
      
      {/* Symptoms Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Symptoms</h4>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Symptoms</label>
            <textarea
              value={othersData.symptoms}
              onChange={(e) =>
                setOthersData({
                  ...othersData,
                  symptoms: e.target.value,
                })
              }
              rows="4"
              placeholder="Describe symptoms (e.g., Fever for 3 days, cough, abdominal pain, headache)"
              className="mr-textarea"
            />
          </div>
        </div>
      </div>

      {/* Visit Notes Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Visit Notes</h4>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Clinical / Visit Notes</label>
            <textarea
              value={othersData.visitNotes}
              onChange={(e) =>
                setOthersData({
                  ...othersData,
                  visitNotes: e.target.value,
                })
              }
              rows="4"
              placeholder="Additional clinical observations, physical examination findings, and visit notes"
              className="mr-textarea"
            />
          </div>
        </div>
      </div>

      {/* Diagnosis Section - Updated to textarea */}
      <div className="mr-section">
        <h4 className="mr-section-title">Diagnosis</h4>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Diagnosis</label>
            <textarea
              value={othersData.diagnosis}
              onChange={(e) =>
                setOthersData({
                  ...othersData,
                  diagnosis: e.target.value,
                })
              }
              rows="3"
              placeholder="Enter diagnosis (e.g., Malaria, URTI, Intestinal worms)"
              className="mr-textarea"
            />
          </div>
        </div>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Diagnosis Notes</label>
            <textarea
              value={othersData.diagnosisNotes}
              onChange={(e) =>
                setOthersData({
                  ...othersData,
                  diagnosisNotes: e.target.value,
                })
              }
              rows="3"
              placeholder="Additional diagnosis notes or details"
              className="mr-textarea"
            />
          </div>
        </div>
      </div>

      {/* Hospitalization Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Hospitalization Status</h4>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label className="mr-checkbox-label-inline">
              <input
                type="checkbox"
                checked={othersData.hospitalized}
                onChange={handleHospitalizationToggle}
              />
              <span>Patient Hospitalized</span>
            </label>
          </div>
        </div>
        
        {othersData.hospitalized && (
          <div className="mr-form-row">
            <div className="mr-form-group">
              <label>Time Hospitalized</label>
              <input
                type="text"
                value={othersData.timeHospitalized}
                onChange={(e) => handleTimeHospitalizedChange(e.target.value)}
                placeholder="e.g., 3 days, 2 weeks, 1 month"
              />
            </div>
          </div>
        )}
      </div>

      {/* Date Section */}
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Date of Assessment</label>
          <input
            type="date"
            value={othersData.date}
            onChange={(e) =>
              setOthersData({
                ...othersData,
                date: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="mr-form-actions">
        <button
          className="mr-btn mr-btn-primary"
          onClick={saveOthers}
          disabled={savingOthers}
        >
          {savingOthers ? (
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

export default Others;