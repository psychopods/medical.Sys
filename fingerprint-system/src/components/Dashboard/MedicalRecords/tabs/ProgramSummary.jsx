import React, { useState, useEffect } from "react";
import "./ProgramSummary.css";
import * as api from "../../../../services/api.js";

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

  // State for all vitals history
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all vitals history for the child
  const fetchVitalsHistory = async (childId) => {
    if (!childId) return;
    try {
      setLoading(true);
      const records = await api.apiFetchVitalsRecords(childId);
      setVitalsHistory(records || []);
    } catch (error) {
      console.error('Error fetching vitals history:', error);
      setVitalsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vitals history when child changes
  useEffect(() => {
    if (child && child.id) {
      fetchVitalsHistory(child.id);
    } else {
      setVitalsHistory([]);
    }
  }, [child]);

  useEffect(() => {
    if (child && child.id) {
      calculateChildSummary();
    }
  }, [child, medicalRecords, vitalsData, medicalServicesData, socialServicesData, othersData, vitalsHistory]);

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

    // Collect BMI history from ALL vitals records
    let bmiHistory = [];
    if (vitalsHistory && vitalsHistory.length > 0) {
      vitalsHistory.forEach(record => {
        if (record.bmi) {
          bmiHistory.push({
            date: record.date || new Date().toISOString().split('T')[0],
            bmi: record.bmi,
            bmiStatus: record.bmiStatus || '',
            weight: record.weight,
            height: record.height
          });
        }
      });
    } else if (vitalsData && vitalsData.bmi) {
      // Fallback to single vitals data if history is empty
      bmiHistory.push({
        date: vitalsData.date || new Date().toISOString().split('T')[0],
        bmi: vitalsData.bmi,
        bmiStatus: vitalsData.bmiStatus || '',
        weight: vitalsData.weight,
        height: vitalsData.height
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

  // Calculate BMI distribution for this child using ALL vitals history
  const getBMIDistribution = () => {
    const distribution = {
      "Severely Underweight": "",
      "Underweight": "",
      "Normal": "",
      "Overweight": "",
      "Obese": "",
    };

    // Use vitalsHistory if available, otherwise use vitalsData
    const recordsToUse = vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory : (vitalsData && vitalsData.bmi ? [vitalsData] : []);

    if (!recordsToUse || recordsToUse.length === 0) {
      return distribution;
    }

    recordsToUse.forEach(record => {
      const bmiValue = record.bmi ? parseFloat(record.bmi) : null;
      if (bmiValue === null || isNaN(bmiValue)) return;

      if (bmiValue < 16) distribution["Severely Underweight"]++;
      else if (bmiValue >= 16 && bmiValue < 18.5) distribution["Underweight"]++;
      else if (bmiValue >= 18.5 && bmiValue < 25) distribution["Normal"]++;
      else if (bmiValue >= 25 && bmiValue < 30) distribution["Overweight"]++;
      else if (bmiValue >= 30) distribution["Obese"]++;
    });

    return distribution;
  };

  const bmiDistribution = getBMIDistribution();
  const totalBMI = Object.values(bmiDistribution).reduce((a, b) => a + b, 0);

  // Get latest BMI info
  const getLatestBMI = () => {
    const recordsToUse = vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory : (vitalsData && vitalsData.bmi ? [vitalsData] : []);
    if (!recordsToUse || recordsToUse.length === 0) return null;
    
    // Sort by date (newest first)
    const sorted = [...recordsToUse].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB - dateA;
    });
    
    const latest = sorted[0];
    if (latest && latest.bmi) {
      return {
        bmi: parseFloat(latest.bmi),
        bmiStatus: latest.bmiStatus || '',
        date: latest.date || new Date().toISOString().split('T')[0],
        weight: latest.weight,
        height: latest.height
      };
    }
    return null;
  };

  const latestBMI = getLatestBMI();

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
        
        {/* Latest BMI Info */}
        {latestBMI && (
          <div className="mr-latest-bmi-info">
            <div className="mr-latest-bmi-value">
              <span className="mr-latest-bmi-number">{latestBMI.bmi.toFixed(1)}</span>
              <span className="mr-latest-bmi-label">Latest BMI</span>
            </div>
            <div className="mr-latest-bmi-details">
              <span className={`mr-latest-bmi-status mr-bmi-status-${latestBMI.bmiStatus?.toLowerCase().replace(/\s/g, "-") || 'unknown'}`}>
                {latestBMI.bmiStatus || 'Unknown'}
              </span>
              <span className="mr-latest-bmi-date">Recorded: {formatDate(latestBMI.date)}</span>
            </div>
          </div>
        )}

        <div className="mr-bmi-distribution">
          {totalBMI > 0 ? (
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

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default ProgramSummary;