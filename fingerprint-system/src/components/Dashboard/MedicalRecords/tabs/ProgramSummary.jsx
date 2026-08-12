import React, { useState, useEffect } from "react";
import "./ProgramSummary.css";

const ProgramSummary = ({ 
  child, 
  medicalRecords, 
  vitalsData, 
  medicalServicesData, 
  socialServicesData, 
  othersData 
}) => {
  // State for calculated child-specific data
  const [childSummary, setChildSummary] = useState({
    totalVisits: 0,
    averageVisits: 0,
    medications: [],
    services: [],
    diagnoses: [],
    symptoms: [],
    bmiHistory: [],
    hospitalizations: 0,
    lastVisit: null,
  });

  useEffect(() => {
    if (child && child.id) {
      calculateChildSummary();
    }
  }, [child, medicalRecords, vitalsData, medicalServicesData, socialServicesData, othersData]);

  const calculateChildSummary = () => {
    // Collect all records
    const allRecords = [...medicalRecords];
    
    // Count total visits
    const totalVisits = allRecords.length;
    
    // Collect medications from medical services
    let medications = [];
    if (medicalServicesData && medicalServicesData.medications) {
      const meds = [
        ...(medicalServicesData.medications.ntdsMeds || []),
        ...(medicalServicesData.medications.antibiotics || []),
        ...(medicalServicesData.medications.otherMeds || [])
      ];
      medications = [...new Set(meds)]; // Remove duplicates
    }

    // Collect services
    let services = [];
    if (medicalServicesData && medicalServicesData.procedures) {
      services = [...services, ...medicalServicesData.procedures];
    }
    if (socialServicesData && socialServicesData.education) {
      services = [...services, ...socialServicesData.education];
    }
    services = [...new Set(services)];

    // Collect diagnoses from others data
    let diagnoses = [];
    if (othersData && othersData.diagnosis) {
      diagnoses = othersData.diagnosis.split(',').map(d => d.trim());
    }

    // Collect symptoms
    let symptoms = [];
    if (othersData && othersData.symptoms) {
      symptoms = othersData.symptoms.split(',').map(s => s.trim());
    }

    // Collect BMI history from vitals
    let bmiHistory = [];
    if (vitalsData && vitalsData.bmi) {
      bmiHistory.push({
        date: vitalsData.date || new Date().toISOString().split('T')[0],
        bmi: vitalsData.bmi
      });
    }

    // Check if hospitalized
    const hospitalizations = othersData && othersData.hospitalized ? 1 : 0;

    // Get last visit date
    const lastVisit = child.createdAt || null;

    setChildSummary({
      totalVisits,
      averageVisits: totalVisits > 0 ? (totalVisits / 1).toFixed(1) : 0,
      medications,
      services,
      diagnoses,
      symptoms,
      bmiHistory,
      hospitalizations,
      lastVisit,
    });
  };

  // Calculate BMI distribution for this child
  const getBMIDistribution = () => {
    const bmiValue = vitalsData && vitalsData.bmi ? parseFloat(vitalsData.bmi) : null;
    if (!bmiValue) return {};

    const distribution = {
      "Severely Underweight": 0,
      "Underweight": 0,
      "Normal": 0,
      "Overweight": 0,
      "Obese": 0,
    };

    if (bmiValue < 16) distribution["Severely Underweight"] = 1;
    else if (bmiValue >= 16 && bmiValue < 18.5) distribution["Underweight"] = 1;
    else if (bmiValue >= 18.5 && bmiValue < 25) distribution["Normal"] = 1;
    else if (bmiValue >= 25 && bmiValue < 30) distribution["Overweight"] = 1;
    else if (bmiValue >= 30) distribution["Obese"] = 1;

    return distribution;
  };

  const bmiDistribution = getBMIDistribution();
  const totalBMI = Object.values(bmiDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="mr-program-summary">
      {/* Patient Overview Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Patient Overview</h3>
          <span className="mr-section-badge">{child?.fullName || 'Patient'}</span>
        </div>
        <div className="mr-overview-list">
          <div className="mr-overview-item">
            <span className="mr-overview-label">Total Visits</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-blue"
                style={{ width: `${Math.min((childSummary.totalVisits / 10) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {childSummary.totalVisits}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Last Visit</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-green"
                style={{ width: `${childSummary.lastVisit ? 100 : 10}%` }}
              >
                <span className="mr-overview-value">
                  {childSummary.lastVisit ? new Date(childSummary.lastVisit).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Medications</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-purple"
                style={{ width: `${Math.min((childSummary.medications.length / 10) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {childSummary.medications.length}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Services Received</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-orange"
                style={{ width: `${Math.min((childSummary.services.length / 10) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {childSummary.services.length}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Hospitalizations</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-red"
                style={{ width: `${Math.min((childSummary.hospitalizations / 5) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {childSummary.hospitalizations}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BMI Distribution Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>BMI Status</h3>
          <span className="mr-section-badge mr-badge-bmi">Health Status</span>
        </div>
        <div className="mr-bmi-distribution">
          {Object.entries(bmiDistribution).length > 0 && totalBMI > 0 ? (
            Object.entries(bmiDistribution).map(([status, count]) => {
              const percentage = totalBMI > 0 ? (count / totalBMI) * 100 : 0;
              const barClass = `mr-bmi-bar mr-bmi-bar-${status.toLowerCase().replace(/\s/g, "-")}`;
              
              return (
                <div key={status} className="mr-bmi-bar-item">
                  <div className="mr-bmi-bar-label">
                    <span className="mr-bmi-status-dot"></span>
                    {status}
                  </div>
                  <div className="mr-bmi-bar-container">
                    <div
                      className={barClass}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    >
                      <span className="mr-bmi-bar-percentage">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <span className="mr-bmi-bar-count">{count}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mr-empty-state">
              <p>No BMI data recorded for this patient</p>
            </div>
          )}
        </div>
      </div>

      {/* Health Issues Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Patient Health Issues</h3>
          <span className="mr-section-badge mr-badge-health">Recorded</span>
        </div>
        <div className="mr-two-columns">
          <div className="mr-health-column">
            <h4>Symptoms</h4>
            {childSummary.symptoms.length > 0 ? (
              <ul className="mr-bullet-list">
                {childSummary.symptoms.map((symptom, i) => (
                  <li key={i}>
                    <span className="mr-bullet-dot"></span>
                    {symptom}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mr-no-data">No symptoms recorded</p>
            )}
          </div>
          <div className="mr-health-column">
            <h4>Diagnoses</h4>
            {childSummary.diagnoses.length > 0 ? (
              <ul className="mr-bullet-list">
                {childSummary.diagnoses.map((diagnosis, i) => (
                  <li key={i}>
                    <span className="mr-bullet-dot"></span>
                    {diagnosis}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mr-no-data">No diagnoses recorded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramSummary;