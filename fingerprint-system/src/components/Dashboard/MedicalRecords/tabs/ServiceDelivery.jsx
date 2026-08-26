import React, { useState, useEffect, useCallback } from "react";
import "./ServiceDelivery.css";
import * as api from "../../../../services/api.js";

const ServiceDelivery = ({ 
  child, 
  medicalServicesData, 
  socialServicesData, 
  vitalsData,
  medicalRecords
}) => {
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
    symptoms: [],
    diagnoses: [],
  });

  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medicationsHistory, setMedicationsHistory] = useState([]);
  const [testsHistory, setTestsHistory] = useState([]);
  const [servicesHistory, setServicesHistory] = useState([]);
  const [clothingHistory, setClothingHistory] = useState([]);
  const [symptomsHistory, setSymptomsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFullHistory = useCallback(async (childId) => {
    if (!childId) return;
    try {
      setLoading(true);
      setError(null);
      
      
      // Fetch data from API - each call handles its own errors
      const [vitals, meds, tests, srvs, clothing, symptoms] = await Promise.all([
        api.apiFetchVitalsRecords(childId).catch(err => {
          console.warn('⚠️ Failed to fetch vitals:', err);
          return [];
        }),
        api.apiFetchMedicationRecords(childId).catch(err => {
          console.warn('⚠️ Failed to fetch medications:', err);
          return [];
        }),
        api.apiFetchTestsRecords(childId).catch(err => {
          console.warn('⚠️ Failed to fetch tests:', err);
          return [];
        }),
        api.apiFetchServicesRecords(childId).catch(err => {
          console.warn('⚠️ Failed to fetch services:', err);
          return [];
        }),
        api.apiFetchClothingRecords(childId).catch(err => {
          console.warn('⚠️ Failed to fetch clothing:', err);
          return [];
        }),
        api.apiFetchSymptomsRecords(childId).catch(err => {
          console.warn('⚠️ Failed to fetch symptoms:', err);
          return [];
        })
      ]);
      
      
      // Log service type breakdown
      const socialServices = (srvs || []).filter(r => (r.serviceType || r.service_type) === 'social');
      const educationServices = (srvs || []).filter(r => (r.serviceType || r.service_type) === 'education');
      const procedureServices = (srvs || []).filter(r => (r.serviceType || r.service_type) === 'procedure');
      const medicalServices = (srvs || []).filter(r => (r.serviceType || r.service_type) === 'medical');
      
      
      setVitalsHistory(vitals || []);
      setMedicationsHistory(meds || []);
      setTestsHistory(tests || []);
      setServicesHistory(srvs || []);
      setClothingHistory(clothing || []);
      setSymptomsHistory(symptoms || []);
    } catch (error) {
      console.error('❌ Error fetching full history:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (child && child.id) {
      fetchFullHistory(child.id);
    } else {
      setVitalsHistory([]);
      setMedicationsHistory([]);
      setTestsHistory([]);
      setServicesHistory([]);
      setClothingHistory([]);
      setSymptomsHistory([]);
    }
  }, [child, fetchFullHistory]);

  useEffect(() => {
    if (child && child.id) {
      calculateChildServiceData();
    }
  }, [child, medicalRecords, vitalsHistory, medicationsHistory, testsHistory, servicesHistory, clothingHistory, symptomsHistory]);

  const calculateChildServiceData = useCallback(() => {
    
    // Count total unique visits from all record types
    const allRecords = [
      ...(vitalsHistory || []),
      ...(medicationsHistory || []),
      ...(testsHistory || []),
      ...(servicesHistory || []),
      ...(clothingHistory || []),
      ...(symptomsHistory || [])
    ];
    
    const uniqueDates = new Set();
    allRecords.forEach(record => {
      const date = record.date || record.visitDate || record.createdAt || record.dateGiven || record.date_given;
      if (date) {
        const dateKey = new Date(date).toISOString().split('T')[0];
        uniqueDates.add(dateKey);
      }
    });
    
    if (medicalRecords && medicalRecords.length > 0) {
      medicalRecords.forEach(record => {
        if (record.visitDate) {
          const dateKey = new Date(record.visitDate).toISOString().split('T')[0];
          uniqueDates.add(dateKey);
        }
      });
    }
    
    const totalVisits = uniqueDates.size;

    let totalServices = 0;
    let medications = {};
    let procedures = [];
    let totalClothes = 0;
    let totalShoes = 0;
    let totalEducation = 0;
    let totalFood = 0;
    let totalTests = 0;
    let symptomsList = [];
    let diagnosesList = [];

    // 1. Process medication history
    if (medicationsHistory && medicationsHistory.length > 0) {
      medicationsHistory.forEach(record => {
        const meds = [];
        if (record.ntdsMeds || record.ntds_meds) {
          const medStr = record.ntdsMeds || record.ntds_meds;
          medStr.split(',').forEach(m => {
            const trimmed = m.trim();
            if (trimmed) meds.push(trimmed);
          });
        }
        if (record.antibiotics) {
          record.antibiotics.split(',').forEach(m => {
            const trimmed = m.trim();
            if (trimmed) meds.push(trimmed);
          });
        }
        if (record.otherMeds || record.other_meds) {
          const medStr = record.otherMeds || record.other_meds;
          medStr.split(',').forEach(m => {
            const trimmed = m.trim();
            if (trimmed) meds.push(trimmed);
          });
        }
        meds.forEach(med => {
          if (med) {
            medications[med] = (medications[med] || 0) + 1;
            totalServices++;
          }
        });
      });
    }

    // 2. Process laboratory tests
    if (testsHistory && testsHistory.length > 0) {
      totalTests = testsHistory.length;
      totalServices += totalTests;
    } else {
      console.log('⚠️ No tests found in testsHistory');
    }

    // 3. Process services rendered - PROCEDURES ONLY from service_type = 'procedure'
    if (servicesHistory && servicesHistory.length > 0) {
      
      servicesHistory.forEach(record => {
        const type = record.serviceType || record.service_type || '';
        const list = record.servicesList || record.services_list || '';
        
        // EDUCATION SERVICES
        if (type === 'education') {
          totalEducation++;
          totalServices++;
        } 
        // SOCIAL SERVICES
        else if (type === 'social') {
          totalServices++;
          
          if (list) {
            const items = list.split(',').map(s => s.trim()).filter(Boolean);
            
            items.forEach(item => {
              const lowerItem = item.toLowerCase();
              
              if (lowerItem.includes('clothes') || lowerItem.includes('clothing')) {
                const numMatch = item.match(/(\d+)/);
                if (numMatch) {
                  totalClothes += parseInt(numMatch[1]);
                } else {
                  totalClothes += 1;
                }
              }
              
              if (lowerItem.includes('shoe')) {
                const numMatch = item.match(/(\d+)/);
                if (numMatch) {
                  totalShoes += parseInt(numMatch[1]);
                } else {
                  totalShoes += 1;
                }
              }
              
              if (lowerItem.includes('food') || lowerItem.includes('meal') || lowerItem.includes('refreshment')) {
                totalFood++;
              }
            });
          }
        } 
        // PROCEDURE SERVICES - ONLY from service_type = 'procedure'
        else if (type === 'procedure') {
          // console.log('🔧 Procedure service found from API:', list);
          if (list) {
            const procItems = list.split(',').map(s => s.trim()).filter(Boolean);
            procItems.forEach(proc => {
              if (proc && !procedures.includes(proc)) {
                procedures.push(proc);
                totalServices++;
                // console.log('🔧 Procedure added from API:', proc);
              }
            });
          }
        }
        // MEDICAL SERVICES - DO NOT extract procedures from here
        else if (type === 'medical') {
          totalServices++;
          // console.log('💉 Medical service found (counted as service, no procedure extraction)');
        }
      });
    }

    // 4. Process clothing provisions
    if (clothingHistory && clothingHistory.length > 0) {
      // console.log('📊 Processing clothing provisions:', clothingHistory.length);
      
      clothingHistory.forEach(record => {
        if (record.clothes) {
          const clothesNum = parseInt(record.clothes);
          totalClothes += isNaN(clothesNum) ? 1 : clothesNum;
        }
        if (record.shoes) {
          const shoesNum = parseInt(record.shoes);
          totalShoes += isNaN(shoesNum) ? 1 : shoesNum;
        }
        totalServices++;
      });
      // console.log('👕 Total clothes:', totalClothes, 'Total shoes:', totalShoes);
    }

    // 5. Process symptoms and diagnoses
    if (symptomsHistory && symptomsHistory.length > 0) {
      // console.log('📊 Processing symptoms:', symptomsHistory.length);
      symptomsHistory.forEach(record => {
        if (record.symptoms) {
          const symps = record.symptoms.split(',').map(s => s.trim()).filter(Boolean);
          symps.forEach(s => {
            if (s && !symptomsList.includes(s)) {
              symptomsList.push(s);
            }
          });
        }
        
        let diagnosis = record.diagnosis || '';
        if (record.visitNotes) {
          try {
            const parsed = JSON.parse(record.visitNotes);
            if (parsed && parsed.diagnosis) {
              diagnosis = parsed.diagnosis;
            }
          } catch (e) {
            const notes = record.visitNotes || '';
            const diagMatch = notes.match(/[Dd]iagnosis:?\s*([^\n]+)/);
            if (diagMatch && diagMatch[1]) {
              diagnosis = diagMatch[1];
            }
          }
        }
        if (diagnosis) {
          const diags = diagnosis.split(',').map(d => d.trim()).filter(Boolean);
          diags.forEach(d => {
            if (d && !diagnosesList.includes(d)) {
              diagnosesList.push(d);
            }
          });
        }
      });
    }

    // Remove duplicates
    procedures = [...new Set(procedures)];
    symptomsList = [...new Set(symptomsList)];
    diagnosesList = [...new Set(diagnosesList)];

    // Calculate average BMI from all vitals
    let averageBMI = 0;
    let bmiCount = 0;
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

    const finalData = {
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
      symptoms: symptomsList,
      diagnoses: diagnosesList,
    };


    setChildServiceData(finalData);
  }, [vitalsHistory, medicationsHistory, testsHistory, servicesHistory, clothingHistory, symptomsHistory, medicalRecords]);

  const getLatestBMI = useCallback(() => {
    const recordsToUse = vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory : [];
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
  }, [vitalsHistory]);

  const latestBMI = getLatestBMI();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Sort medications by count (descending)
  const sortedMedications = Object.entries(childServiceData.medications)
    .sort((a, b) => b[1] - a[1]);

  const maxMedCount = Math.max(...Object.values(childServiceData.medications), 1);


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

  if (error) {
    return (
      <div className="mr-service-delivery">
        <div className="mr-error-state">
          <p>Error loading data: {error}</p>
          <button onClick={() => child && child.id && fetchFullHistory(child.id)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-service-delivery">
      {/* Service Delivery Summary */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Service Delivery Summary</h3>
          <span className="mr-section-badge">{child?.fullName || 'Patient'}</span>
        </div>
        <div className="mr-overview-grid">
          <div className="mr-overview-item">
            <span className="mr-overview-label">Total Visits</span>
            <span className="mr-overview-value-large">{childServiceData.totalVisits}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Total Services</span>
            <span className="mr-overview-value-large">{childServiceData.totalServices}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Average BMI</span>
            <span className="mr-overview-value-large">
              {childServiceData.averageBMI > 0 ? childServiceData.averageBMI.toFixed(1) : 'N/A'}
            </span>
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

      {/* Material Support */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Material Support Provided</h3>
          <span className="mr-section-badge mr-badge-material">Support</span>
        </div>
        <div className="mr-overview-grid">
          <div className="mr-overview-item">
            <span className="mr-overview-label">Clothes Given</span>
            <span className="mr-overview-value-large">{childServiceData.totalClothes}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Shoes Given</span>
            <span className="mr-overview-value-large">{childServiceData.totalShoes}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Education Sessions</span>
            <span className="mr-overview-value-large">{childServiceData.totalEducation}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Food Provided</span>
            <span className="mr-overview-value-large">{childServiceData.totalFood > 0 ? 'Yes' : 'No'}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Tests Done</span>
            <span className="mr-overview-value-large">{childServiceData.totalTests}</span>
          </div>
        </div>
      </div>

      {/* Medications Given */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Medications Given</h3>
          <span className="mr-section-badge mr-badge-medication">
            {Object.keys(childServiceData.medications).length} medications
          </span>
        </div>
        {sortedMedications.length > 0 ? (
          <div className="mr-medication-list">
            {sortedMedications.map(([med, count]) => {
              const percentage = (count / maxMedCount) * 100;
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
            })}
          </div>
        ) : (
          <div className="mr-empty-state">
            <p>No medications recorded for this patient</p>
          </div>
        )}
      </div>

      {/* Procedures Performed */}
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

      {/* Symptoms */}
      {childServiceData.symptoms.length > 0 && (
        <div className="mr-section-block">
          <div className="mr-section-header">
            <h3>Symptoms Recorded</h3>
            <span className="mr-section-badge mr-badge-symptom">
              {childServiceData.symptoms.length} symptoms
            </span>
          </div>
          <div className="mr-symptom-list">
            {childServiceData.symptoms.map((symptom, index) => (
              <span key={index} className="mr-symptom-tag">{symptom}</span>
            ))}
          </div>
        </div>
      )}

      {/* Diagnoses */}
      {childServiceData.diagnoses.length > 0 && (
        <div className="mr-section-block">
          <div className="mr-section-header">
            <h3>Diagnoses</h3>
            <span className="mr-section-badge mr-badge-diagnosis">
              {childServiceData.diagnoses.length} diagnoses
            </span>
          </div>
          <div className="mr-diagnosis-list">
            {childServiceData.diagnoses.map((diagnosis, index) => (
              <span key={index} className="mr-diagnosis-tag">{diagnosis}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDelivery;