import React, { useState } from "react";
import "./MedicalServices.css";

const MedicalServices = ({ 
  medicalServicesData, 
  setMedicalServicesData, 
  medicationOptions,
  testTypesOptions,
  testResultOptions,
  procedureOptions,
  saveMedicalServices,
  showToast
}) => {
  // State for custom inputs
  const [customMedication, setCustomMedication] = useState("");
  const [customProcedure, setCustomProcedure] = useState("");

  // Handle Medication Toggle (NTDs Meds)
  const handleNtdsMedsToggle = (medication) => {
    const currentMeds = medicalServicesData.medications.ntdsMeds || [];
    if (currentMeds.includes(medication)) {
      setMedicalServicesData({
        ...medicalServicesData,
        medications: {
          ...medicalServicesData.medications,
          ntdsMeds: currentMeds.filter((m) => m !== medication),
        },
      });
    } else {
      setMedicalServicesData({
        ...medicalServicesData,
        medications: {
          ...medicalServicesData.medications,
          ntdsMeds: [...currentMeds, medication],
        },
      });
    }
  };

  // Handle Medication Toggle (Antibiotics)
  const handleAntibioticsToggle = (medication) => {
    const currentMeds = medicalServicesData.medications.antibiotics || [];
    if (currentMeds.includes(medication)) {
      setMedicalServicesData({
        ...medicalServicesData,
        medications: {
          ...medicalServicesData.medications,
          antibiotics: currentMeds.filter((m) => m !== medication),
        },
      });
    } else {
      setMedicalServicesData({
        ...medicalServicesData,
        medications: {
          ...medicalServicesData.medications,
          antibiotics: [...currentMeds, medication],
        },
      });
    }
  };

  // Handle Medication Toggle (Other Meds)
  const handleOtherMedsToggle = (medication) => {
    const currentMeds = medicalServicesData.medications.otherMeds || [];
    if (currentMeds.includes(medication)) {
      setMedicalServicesData({
        ...medicalServicesData,
        medications: {
          ...medicalServicesData.medications,
          otherMeds: currentMeds.filter((m) => m !== medication),
        },
      });
    } else {
      setMedicalServicesData({
        ...medicalServicesData,
        medications: {
          ...medicalServicesData.medications,
          otherMeds: [...currentMeds, medication],
        },
      });
    }
  };

  // Handle Test Type Toggle
  const handleTestTypeToggle = (testType) => {
    const currentTests = medicalServicesData.tests.testTypes || [];
    if (currentTests.includes(testType)) {
      setMedicalServicesData({
        ...medicalServicesData,
        tests: {
          ...medicalServicesData.tests,
          testTypes: currentTests.filter((t) => t !== testType),
        },
      });
    } else {
      setMedicalServicesData({
        ...medicalServicesData,
        tests: {
          ...medicalServicesData.tests,
          testTypes: [...currentTests, testType],
        },
      });
    }
  };

  // Handle Result Toggle
  const handleResultToggle = (result) => {
    const currentResults = medicalServicesData.tests.results || [];
    if (currentResults.includes(result)) {
      setMedicalServicesData({
        ...medicalServicesData,
        tests: {
          ...medicalServicesData.tests,
          results: currentResults.filter((r) => r !== result),
        },
      });
    } else {
      setMedicalServicesData({
        ...medicalServicesData,
        tests: {
          ...medicalServicesData.tests,
          results: [...currentResults, result],
        },
      });
    }
  };

  // Handle Procedure Toggle
  const handleProcedureToggle = (procedure) => {
    const procedures = medicalServicesData.procedures || [];
    if (procedures.includes(procedure)) {
      setMedicalServicesData({
        ...medicalServicesData,
        procedures: procedures.filter((p) => p !== procedure),
      });
    } else {
      setMedicalServicesData({
        ...medicalServicesData,
        procedures: [...procedures, procedure],
      });
    }
  };

  // Handle Add Custom Medication
  const handleAddCustomMedication = () => {
    if (!customMedication.trim()) {
      showToast("Please enter a medication name", "error");
      return;
    }
    
    const currentMeds = medicalServicesData.medications.otherMeds || [];
    if (currentMeds.includes(customMedication.trim())) {
      showToast("This medication is already in the list", "warning");
      setCustomMedication("");
      return;
    }
    
    setMedicalServicesData({
      ...medicalServicesData,
      medications: {
        ...medicalServicesData.medications,
        otherMeds: [...currentMeds, customMedication.trim()],
      },
    });
    setCustomMedication("");
    showToast("Custom medication added successfully!", "success");
  };

  // Handle Add Custom Procedure
  const handleAddCustomProcedure = () => {
    if (!customProcedure.trim()) {
      showToast("Please enter a procedure name", "error");
      return;
    }
    
    const currentProcedures = medicalServicesData.procedures || [];
    if (currentProcedures.includes(customProcedure.trim())) {
      showToast("This procedure is already in the list", "warning");
      setCustomProcedure("");
      return;
    }
    
    setMedicalServicesData({
      ...medicalServicesData,
      procedures: [...currentProcedures, customProcedure.trim()],
    });
    setCustomProcedure("");
    showToast("Custom procedure added successfully!", "success");
  };

  // Handle Remove Custom Medication
  const handleRemoveCustomMedication = (medication) => {
    setMedicalServicesData({
      ...medicalServicesData,
      medications: {
        ...medicalServicesData.medications,
        otherMeds: (medicalServicesData.medications.otherMeds || []).filter(
          (m) => m !== medication
        ),
      },
    });
    showToast(`Removed: ${medication}`, "info");
  };

  // Handle Remove Custom Procedure
  const handleRemoveCustomProcedure = (procedure) => {
    setMedicalServicesData({
      ...medicalServicesData,
      procedures: (medicalServicesData.procedures || []).filter(
        (p) => p !== procedure
      ),
    });
    showToast(`Removed: ${procedure}`, "info");
  };

  return (
    <div className="mr-medical-services-form">
      <h3>Medical Services</h3>
      
      {/* Medications Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Medications</h4>
        
        {/* NTDs Meds */}
        <div className="mr-sub-section">
          <label className="mr-sub-section-label">NTDs Meds</label>
          <div className="mr-checkbox-grid">
            {medicationOptions.ntdsMeds.map((med) => (
              <label key={med} className="mr-checkbox-label">
                <input
                  type="checkbox"
                  checked={(medicalServicesData.medications.ntdsMeds || []).includes(med)}
                  onChange={() => handleNtdsMedsToggle(med)}
                />
                <span>{med}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Antibiotics */}
        <div className="mr-sub-section">
          <label className="mr-sub-section-label">Antibiotics</label>
          <div className="mr-checkbox-grid">
            {medicationOptions.antibiotics.map((med) => (
              <label key={med} className="mr-checkbox-label">
                <input
                  type="checkbox"
                  checked={(medicalServicesData.medications.antibiotics || []).includes(med)}
                  onChange={() => handleAntibioticsToggle(med)}
                />
                <span>{med}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Other Medications */}
        <div className="mr-sub-section">
          <label className="mr-sub-section-label">Other Medications</label>
          <div className="mr-checkbox-grid">
            {medicationOptions.otherMeds.map((med) => (
              <label key={med} className="mr-checkbox-label">
                <input
                  type="checkbox"
                  checked={(medicalServicesData.medications.otherMeds || []).includes(med)}
                  onChange={() => handleOtherMedsToggle(med)}
                />
                <span>{med}</span>
              </label>
            ))}
          </div>
          
          {/* Custom Medications List */}
          {(medicalServicesData.medications.otherMeds || []).filter(
            (med) => !medicationOptions.otherMeds.includes(med)
          ).length > 0 && (
            <div className="mr-custom-list">
              <label className="mr-custom-list-label">Custom Medications:</label>
              <div className="mr-custom-tags">
                {(medicalServicesData.medications.otherMeds || [])
                  .filter((med) => !medicationOptions.otherMeds.includes(med))
                  .map((med) => (
                    <span key={med} className="mr-custom-tag">
                      {med}
                      <button
                        type="button"
                        className="mr-custom-tag-remove"
                        onClick={() => handleRemoveCustomMedication(med)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom Medication Input */}
        <div className="mr-form-row">
          <div className="mr-form-group mr-custom-input-group">
            <label>Custom Medication</label>
            <div className="mr-custom-input-wrapper">
              <input
                type="text"
                placeholder="Enter custom medication name"
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomMedication();
                  }
                }}
              />
              <button
                type="button"
                className="mr-btn mr-btn-add"
                onClick={handleAddCustomMedication}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tests Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Tests / Results</h4>
        
        {/* Test Types */}
        <div className="mr-sub-section">
          <label className="mr-sub-section-label">Test Types</label>
          <div className="mr-checkbox-grid">
            {testTypesOptions.map((test) => (
              <label key={test} className="mr-checkbox-label">
                <input
                  type="checkbox"
                  checked={(medicalServicesData.tests.testTypes || []).includes(test)}
                  onChange={() => handleTestTypeToggle(test)}
                />
                <span>{test}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mr-sub-section">
          <label className="mr-sub-section-label">Results</label>
          <div className="mr-checkbox-grid">
            {testResultOptions.map((result) => (
              <label key={result} className="mr-checkbox-label">
                <input
                  type="checkbox"
                  checked={(medicalServicesData.tests.results || []).includes(result)}
                  onChange={() => handleResultToggle(result)}
                />
                <span>{result}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Test Notes - Updated to Textarea */}
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Test Notes</label>
            <textarea
              placeholder="Additional test notes"
              value={medicalServicesData.tests.notes || ""}
              onChange={(e) =>
                setMedicalServicesData({
                  ...medicalServicesData,
                  tests: {
                    ...medicalServicesData.tests,
                    notes: e.target.value,
                  },
                })
              }
              rows="4"
              className="mr-textarea"
            />
          </div>
        </div>
      </div>

      {/* Procedures Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Procedures</h4>
        <div className="mr-checkbox-grid">
          {procedureOptions.map((procedure) => (
            <label key={procedure} className="mr-checkbox-label">
              <input
                type="checkbox"
                checked={(medicalServicesData.procedures || []).includes(procedure)}
                onChange={() => handleProcedureToggle(procedure)}
              />
              <span>{procedure}</span>
            </label>
          ))}
        </div>
        
        {/* Custom Procedures List */}
        {(medicalServicesData.procedures || []).filter(
          (proc) => !procedureOptions.includes(proc)
        ).length > 0 && (
          <div className="mr-custom-list">
            <label className="mr-custom-list-label">Custom Procedures:</label>
            <div className="mr-custom-tags">
              {(medicalServicesData.procedures || [])
                .filter((proc) => !procedureOptions.includes(proc))
                .map((proc) => (
                  <span key={proc} className="mr-custom-tag">
                    {proc}
                    <button
                      type="button"
                      className="mr-custom-tag-remove"
                      onClick={() => handleRemoveCustomProcedure(proc)}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Custom Procedure Input */}
        <div className="mr-form-row">
          <div className="mr-form-group mr-custom-input-group">
            <label>Custom Procedure</label>
            <div className="mr-custom-input-wrapper">
              <input
                type="text"
                placeholder="Enter custom procedure"
                value={customProcedure}
                onChange={(e) => setCustomProcedure(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomProcedure();
                  }
                }}
              />
              <button
                type="button"
                className="mr-btn mr-btn-add"
                onClick={handleAddCustomProcedure}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Section */}
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Date of Service</label>
          <input
            type="date"
            value={medicalServicesData.date}
            onChange={(e) =>
              setMedicalServicesData({
                ...medicalServicesData,
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
          onClick={saveMedicalServices}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MedicalServices;