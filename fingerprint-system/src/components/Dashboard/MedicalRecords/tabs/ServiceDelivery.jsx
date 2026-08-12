import React, { useState, useEffect } from "react";
import "./ServiceDelivery.css";

const ServiceDelivery = ({ 
  child, 
  medicalServicesData, 
  socialServicesData, 
  vitalsData,
  medicalRecords
}) => {
  // State for calculated child-specific service data
  const [childServiceData, setChildServiceData] = useState({
    totalVisits: 0,
    totalServices: 0,
    averageBMI: 0,
    totalClothes: 0,
    totalShoes: 0,
    totalEducation: 0,
    totalFood: 0,
    totalTests: 0,
    medications: {},
    procedures: [],
  });

  useEffect(() => {
    if (child && child.id) {
      calculateChildServiceData();
    }
  }, [child, medicalServicesData, socialServicesData, vitalsData, medicalRecords]);

  const calculateChildServiceData = () => {
    // Count total visits (medical records)
    const totalVisits = medicalRecords ? medicalRecords.length : 0;

    // Count total services from medical services
    let totalServices = 0;
    let medications = {};
    let procedures = [];

    // Process medical services
    if (medicalServicesData) {
      // Count medications
      if (medicalServicesData.medications) {
        const meds = [
          ...(medicalServicesData.medications.ntdsMeds || []),
          ...(medicalServicesData.medications.antibiotics || []),
          ...(medicalServicesData.medications.otherMeds || [])
        ];
        meds.forEach(med => {
          if (med) {
            medications[med] = (medications[med] || 0) + 1;
            totalServices++;
          }
        });
      }

      // Count tests
      if (medicalServicesData.tests) {
        const testTypes = medicalServicesData.tests.testTypes || [];
        testTypes.forEach(test => {
          if (test) {
            totalServices++;
          }
        });
        
        // Count test results
        const results = medicalServicesData.tests.results || [];
        results.forEach(result => {
          if (result) {
            totalServices++;
          }
        });
      }

      // Count procedures
      if (medicalServicesData.procedures) {
        procedures = [...medicalServicesData.procedures];
        totalServices += medicalServicesData.procedures.length;
      }
    }

    // Process social services
    let totalClothes = 0;
    let totalShoes = 0;
    let totalEducation = 0;
    let totalFood = 0;

    if (socialServicesData) {
      // Clothing
      if (socialServicesData.clothing) {
        totalClothes = parseInt(socialServicesData.clothing.clothes) || 0;
        totalShoes = parseInt(socialServicesData.clothing.shoes) || 0;
      }

      // Education
      if (socialServicesData.education) {
        totalEducation = socialServicesData.education.length;
      }

      // Food
      if (socialServicesData.foodRefreshment) {
        totalFood = 1; // Count as 1 if provided
      }
    }

    // Get BMI from vitals
    let averageBMI = 0;
    if (vitalsData && vitalsData.bmi) {
      averageBMI = parseFloat(vitalsData.bmi);
    }

    // Count total tests from medical services
    let totalTests = 0;
    if (medicalServicesData && medicalServicesData.tests) {
      totalTests = (medicalServicesData.tests.testTypes || []).length;
    }

    setChildServiceData({
      totalVisits,
      totalServices,
      averageBMI,
      totalClothes,
      totalShoes,
      totalEducation,
      totalFood,
      totalTests,
      medications,
      procedures,
    });
  };

  // Find max value for medication bars
  const maxMedCount = Math.max(...Object.values(childServiceData.medications), 0);

  return (
    <div className="mr-service-delivery">
      {/* Service Delivery Summary Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Service Delivery Summary</h3>
          <span className="mr-section-badge">Patient</span>
        </div>
        <div className="mr-metric-grid">
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Visits</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-blue"
                style={{ width: `${Math.min((childServiceData.totalVisits / 20) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {childServiceData.totalVisits}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Services</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-green"
                style={{ width: `${Math.min((childServiceData.totalServices / 30) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {childServiceData.totalServices}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Current BMI</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-purple"
                style={{ width: `${Math.min((childServiceData.averageBMI / 30) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {childServiceData.averageBMI > 0 ? childServiceData.averageBMI.toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Support Provided Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Material Support Provided</h3>
          <span className="mr-section-badge mr-badge-material">Support</span>
        </div>
        <div className="mr-metric-grid">
          <div className="mr-metric-item">
            <span className="mr-metric-label">Clothes Given</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-orange"
                style={{ width: `${Math.min((childServiceData.totalClothes / 10) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {childServiceData.totalClothes}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Shoes Given</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-teal"
                style={{ width: `${Math.min((childServiceData.totalShoes / 10) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {childServiceData.totalShoes}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Education Sessions</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-yellow"
                style={{ width: `${Math.min((childServiceData.totalEducation / 10) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {childServiceData.totalEducation}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Food Provided</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-pink"
                style={{ width: `${childServiceData.totalFood > 0 ? 50 : 10}%` }}
              >
                <span className="mr-metric-value">
                  {childServiceData.totalFood > 0 ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Tests Done</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-indigo"
                style={{ width: `${Math.min((childServiceData.totalTests / 10) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {childServiceData.totalTests}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medications Given Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Medications Given</h3>
          <span className="mr-section-badge mr-badge-medication">
            {Object.keys(childServiceData.medications).length} medications
          </span>
        </div>
        {Object.keys(childServiceData.medications).length > 0 ? (
          <div className="mr-medication-list">
            {Object.entries(childServiceData.medications).map(
              ([med, count]) => {
                const percentage = maxMedCount > 0 ? (count / maxMedCount) * 100 : 0;
                return (
                  <div key={med} className="mr-med-item">
                    <span className="mr-med-name">{med}</span>
                    <div className="mr-med-bar-container">
                      <div
                        className="mr-med-bar"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      >
                        <span className="mr-med-count-inner">{count}</span>
                      </div>
                      <span className="mr-med-count">{count}</span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="mr-empty-state">
            <p>No medications recorded for this patient</p>
          </div>
        )}
      </div>

      {/* Procedures Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Procedures Performed</h3>
          <span className="mr-section-badge mr-badge-procedure">
            {childServiceData.procedures.length} procedures
          </span>
        </div>
        {childServiceData.procedures.length > 0 ? (
          <div className="mr-procedure-list">
            {childServiceData.procedures.map((procedure, index) => (
              <div key={index} className="mr-procedure-item">
                <span className="mr-procedure-dot"></span>
                <span className="mr-procedure-name">{procedure}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mr-empty-state">
            <p>No procedures recorded for this patient</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDelivery;