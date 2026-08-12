import React from "react";
import "./BaselineInfo.css";

const BaselineInfo = ({ 
  child, 
  baselineData, 
  setBaselineData, 
  saveBaselineInfo 
}) => {
  return (
    <div className="mr-baseline-form">
      <h3>Baseline Information</h3>
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Kid ID</label>
          <input type="text" value={baselineData.kidId} disabled />
        </div>
        <div className="mr-form-group">
          <label>Full Name</label>
          <input type="text" value={baselineData.fullName} disabled />
        </div>
      </div>
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Gender</label>
          <input type="text" value={baselineData.gender} disabled />
        </div>
        <div className="mr-form-group">
          <label>Age</label>
          <input type="text" value={baselineData.age} disabled />
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
          <input type="text" value={baselineData.location} disabled />
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