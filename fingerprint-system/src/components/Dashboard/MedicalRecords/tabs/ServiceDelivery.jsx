import React, { useState, useEffect } from "react";
import "./ServiceDelivery.css";
import * as api from "../../../../services/api.js";

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

  // State for clinical history logs from database
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medicationsHistory, setMedicationsHistory] = useState([]);
  const [testsHistory, setTestsHistory] = useState([]);
  const [servicesHistory, setServicesHistory] = useState([]);
  const [clothingHistory, setClothingHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch full clinical history for the child from database
  const fetchFullHistory = async (childId) => {
    if (!childId) return;
    try {
      setLoading(true);
      const [vitals, meds, tests, srvs, clothing] = await Promise.all([
        api.apiFetchVitalsRecords(childId),
        api.apiFetchMedicationRecords(childId),
        api.apiFetchTestsRecords(childId),
        api.apiFetchServicesRecords(childId),
        api.apiFetchClothingRecords(childId)
      ]);
      setVitalsHistory(vitals || []);
      setMedicationsHistory(meds || []);
      setTestsHistory(tests || []);
      setServicesHistory(srvs || []);
      setClothingHistory(clothing || []);
    } catch (error) {
      console.error('Error fetching full history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch history when child changes
  useEffect(() => {
    if (child && child.id) {
      fetchFullHistory(child.id);
    } else {
      setVitalsHistory([]);
      setMedicationsHistory([]);
      setTestsHistory([]);
      setServicesHistory([]);
      setClothingHistory([]);
    }
  }, [child]);

  useEffect(() => {
    if (child && child.id) {
      calculateChildServiceData();
    }
  }, [child, medicalRecords, vitalsHistory, medicationsHistory, testsHistory, servicesHistory, clothingHistory]);

  const calculateChildServiceData = () => {
    // Count total visits (medical records)
    const totalVisits = medicalRecords ? medicalRecords.length : 0;

    let totalServices = 0;
    let medications = {};
    let procedures = [];

    // 1. Process medication history
    if (medicationsHistory && medicationsHistory.length > 0) {
      medicationsHistory.forEach(record => {
        const meds = [];
        if (record.ntdsMeds || record.ntds_meds) {
          (record.ntdsMeds || record.ntds_meds).split(',').forEach(m => meds.push(m.trim()));
        }
        if (record.antibiotics) {
          record.antibiotics.split(',').forEach(m => meds.push(m.trim()));
        }
        if (record.otherMeds || record.other_meds) {
          (record.otherMeds || record.other_meds).split(',').forEach(m => meds.push(m.trim()));
        }
        meds.forEach(med => {
          if (med) {
            medications[med] = (medications[med] || 0) + 1;
            totalServices++;
          }
        });
      });
    }

    // 2. Process laboratory tests history
    let totalTests = 0;
    if (testsHistory && testsHistory.length > 0) {
      totalTests = testsHistory.length;
      totalServices += totalTests;
    }

    // 3. Process services rendered history (procedures, education, food refreshment)
    let totalEducation = 0;
    let totalFood = 0;
    if (servicesHistory && servicesHistory.length > 0) {
      servicesHistory.forEach(record => {
        const type = record.serviceType || record.service_type || '';
        const list = record.servicesList || record.services_list || '';
        
        if (type === 'education') {
          totalEducation++;
          totalServices++;
        } else if (type === 'social') {
          if (list.includes('Food/Refreshment')) {
            totalFood++;
            totalServices++;
          }
        } else if (type === 'medical') {
          if (list.includes('Procedures:')) {
            const procPart = list.split('Procedures:')[1];
            if (procPart) {
              procPart.split(',').forEach(p => {
                const proc = p.trim();
                if (proc) {
                  procedures.push(proc);
                  totalServices++;
                }
              });
            }
          }
        }
      });
    }
    procedures = [...new Set(procedures)];

    // 4. Process clothing provisions history
    let totalClothes = 0;
    let totalShoes = 0;
    if (clothingHistory && clothingHistory.length > 0) {
      clothingHistory.forEach(record => {
        if (record.clothes) {
          totalClothes += parseInt(record.clothes) || 1; // Fallback to 1 if size is a string size like "M"
        }
        if (record.shoes) {
          totalShoes += parseInt(record.shoes) || 1; // Fallback to 1 if size is a string size like "35"
        }
        totalServices++;
      });
    }

    // Get average BMI from ALL vitals history
    let averageBMI = 0;
    let bmiCount = 0;
    
    // Use vitalsHistory
    const recordsToUse = vitalsHistory || [];
    
    if (recordsToUse && recordsToUse.length > 0) {
      recordsToUse.forEach(record => {
        if (record.bmi) {
          const bmiVal = parseFloat(record.bmi);
          if (!isNaN(bmiVal)) {
            averageBMI += bmiVal;
            bmiCount++;
          }
        }
      });
      if (bmiCount > 0) {
        averageBMI = averageBMI / bmiCount;
      }
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

  // Get latest BMI for display
  const getLatestBMI = () => {
    const recordsToUse = vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory : (vitalsData && vitalsData.bmi ? [vitalsData] : []);
    if (!recordsToUse || recordsToUse.length === 0) return null;
    
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
        date: latest.date || new Date().toISOString().split('T')[0]
      };
    }
    return null;
  };

  const latestBMI = getLatestBMI();

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="mr-service-delivery">
        <div className="mr-loading-state">
          <div className="mr-spinner-small"></div>
          <p>Loading service data...</p>
        </div>
      </div>
    );
  }

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
            <span className="mr-metric-label">Average BMI</span>
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
        {latestBMI && (
          <div className="mr-latest-bmi-mini">
            <span className="mr-latest-bmi-mini-label">Latest BMI: </span>
            <span className="mr-latest-bmi-mini-value">{latestBMI.bmi.toFixed(1)}</span>
            <span className={`mr-latest-bmi-mini-status mr-bmi-status-${latestBMI.bmiStatus?.toLowerCase().replace(/\s/g, "-") || 'unknown'}`}>
              {latestBMI.bmiStatus || 'Unknown'}
            </span>
            <span className="mr-latest-bmi-mini-date">({formatDate(latestBMI.date)})</span>
          </div>
        )}
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