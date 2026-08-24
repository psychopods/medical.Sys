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

  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medicationsHistory, setMedicationsHistory] = useState([]);
  const [testsHistory, setTestsHistory] = useState([]);
  const [servicesHistory, setServicesHistory] = useState([]);
  const [symptomsHistory, setSymptomsHistory] = useState([]);
  const [clothingHistory, setClothingHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFullHistory = async (childId) => {
    if (!childId) return;
    try {
      setLoading(true);
      
      const [vitals, meds, tests, srvs, symptoms, clothing] = await Promise.all([
        api.apiFetchVitalsRecords(childId),
        api.apiFetchMedicationRecords(childId),
        api.apiFetchTestsRecords(childId),
        api.apiFetchServicesRecords(childId),
        api.apiFetchSymptomsRecords(childId),
        api.apiFetchClothingRecords(childId)
      ]);
      
      
      setVitalsHistory(vitals || []);
      setMedicationsHistory(meds || []);
      setTestsHistory(tests || []);
      setServicesHistory(srvs || []);
      setSymptomsHistory(symptoms || []);
      setClothingHistory(clothing || []);
    } catch (error) {
      console.error('Error fetching full history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (child && child.id) {
      fetchFullHistory(child.id);
    } else {
      setVitalsHistory([]);
      setMedicationsHistory([]);
      setTestsHistory([]);
      setServicesHistory([]);
      setSymptomsHistory([]);
      setClothingHistory([]);
    }
  }, [child]);

  useEffect(() => {
    if (child && child.id) {
      calculateChildSummary();
    }
  }, [child, medicalRecords, vitalsHistory, medicationsHistory, testsHistory, servicesHistory, symptomsHistory, clothingHistory]);

  const calculateChildSummary = () => {
    
    // Count total unique visits
    const allRecords = [
      ...(vitalsHistory || []),
      ...(medicationsHistory || []),
      ...(testsHistory || []),
      ...(servicesHistory || []),
      ...(symptomsHistory || []),
      ...(clothingHistory || [])
    ];
    
    const uniqueDates = new Set();
    allRecords.forEach(record => {
      const date = record.date || record.visitDate || record.createdAt || record.dateGiven || record.date_given;
      if (date) {
        const dateKey = new Date(date).toISOString().split('T')[0];
        uniqueDates.add(dateKey);
      }
    });
    const totalVisits = uniqueDates.size;

    // Collect medications
    const medsSet = new Set();
    if (medicationsHistory && medicationsHistory.length > 0) {
      medicationsHistory.forEach(record => {
        const meds = [];
        if (record.ntdsMeds || record.ntds_meds) {
          (record.ntdsMeds || record.ntds_meds).split(',').forEach(m => {
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
          (record.otherMeds || record.other_meds).split(',').forEach(m => {
            const trimmed = m.trim();
            if (trimmed) meds.push(trimmed);
          });
        }
        meds.forEach(m => medsSet.add(m));
      });
    }

    // Collect services
    const servicesSet = new Set();
    if (servicesHistory && servicesHistory.length > 0) {
      servicesHistory.forEach(record => {
        const list = record.servicesList || record.services_list || '';
        if (list) {
          list.split(',').forEach(s => {
            const trimmed = s.trim();
            if (trimmed) servicesSet.add(trimmed);
          });
        }
        const type = record.serviceType || record.service_type || '';
        if (type) servicesSet.add(type.charAt(0).toUpperCase() + type.slice(1));
      });
    }

    // Collect clothing as services
    if (clothingHistory && clothingHistory.length > 0) {
      clothingHistory.forEach(record => {
        if (record.clothes) servicesSet.add(`Clothes: ${record.clothes}`);
        if (record.shoes) servicesSet.add(`Shoes: ${record.shoes}`);
      });
    }

    // ============================================
    // FIXED: Collect DIAGNOSES from symptoms/assessment history
    // ============================================
    const diagnosesSet = new Set();
    let hospitalizationCount = 0;
    
    if (symptomsHistory && symptomsHistory.length > 0) {
      symptomsHistory.forEach(record => {
        
        // Check for diagnosis in the record directly
        let diagnosis = record.diagnosis || '';
        let isHospitalized = false;
        let symptomsList = record.symptoms || '';
        
        // Parse visitNotes if it contains JSON
        if (record.visitNotes || record.visit_notes) {
          try {
            const rawNotes = record.visitNotes || record.visit_notes || '';
            
            if (rawNotes.trim().startsWith('{') && rawNotes.trim().endsWith('}')) {
              const parsed = JSON.parse(rawNotes);
              if (parsed && typeof parsed === 'object') {
                if (parsed.diagnosis && parsed.diagnosis.trim()) {
                  diagnosis = parsed.diagnosis;
                }
                if (parsed.diagnosisNotes) {
                  // Store for later use
                }
                if (parsed.hospitalized === true || parsed.hospitalized === 'true') {
                  isHospitalized = true;
                }
                if (parsed.symptoms && parsed.symptoms.trim()) {
                  symptomsList = parsed.symptoms;
                }
              }
            }
          } catch (e) {
            console.log('Error parsing visitNotes:', e);
          }
        }
        
        // Also check for diagnosis field directly in the record
        if (record.diagnosis && record.diagnosis.trim()) {
          diagnosis = record.diagnosis;
        }
        
        // Check hospitalization from record
        if (record.hospitalized === true || record.hospitalized === 'true' || record.hospitalized === 1) {
          isHospitalized = true;
        }
        
        // Add diagnosis to set
        if (diagnosis && diagnosis.trim()) {
          diagnosis.split(',').forEach(d => {
            const trimmed = d.trim();
            if (trimmed) {
              diagnosesSet.add(trimmed);
            }
          });
        }
        
        // Also check for diagnosis in other fields
        if (record.visitNotes && !diagnosis) {
          // Try to extract diagnosis from visitNotes text
          const notes = record.visitNotes || '';
          const diagnosisMatch = notes.match(/[Dd]iagnosis:?\s*([^\n]+)/);
          if (diagnosisMatch && diagnosisMatch[1]) {
            diagnosesSet.add(diagnosisMatch[1].trim());
          }
        }
        
        if (isHospitalized) hospitalizationCount++;
      });
    }

    // ============================================
    // FIXED: Collect SYMPTOMS from symptoms/assessment history
    // ============================================
    const symptomsSet = new Set();
    
    if (symptomsHistory && symptomsHistory.length > 0) {
      symptomsHistory.forEach(record => {
        // Check direct symptoms field
        let symptomsList = record.symptoms || '';
        
        // Parse visitNotes for symptoms
        if (record.visitNotes || record.visit_notes) {
          try {
            const rawNotes = record.visitNotes || record.visit_notes || '';
            if (rawNotes.trim().startsWith('{') && rawNotes.trim().endsWith('}')) {
              const parsed = JSON.parse(rawNotes);
              if (parsed && typeof parsed === 'object') {
                if (parsed.symptoms && parsed.symptoms.trim()) {
                  symptomsList = parsed.symptoms;
                }
              }
            }
          } catch (e) {
            // fallback
          }
        }
        
        // Also check for symptoms in visitNotes text
        if (!symptomsList && record.visitNotes) {
          const notes = record.visitNotes || '';
          const symptomsMatch = notes.match(/[Ss]ymptoms:?\s*([^\n]+)/);
          if (symptomsMatch && symptomsMatch[1]) {
            symptomsList = symptomsMatch[1];
          }
        }
        
        // Add symptoms to set
        if (symptomsList && symptomsList.trim()) {
          symptomsList.split(',').forEach(s => {
            const trimmed = s.trim();
            if (trimmed) {
              symptomsSet.add(trimmed);
            }
          });
        }
      });
    }

    // Collect BMI history
    const bmiHistoryArr = [];
    if (vitalsHistory && vitalsHistory.length > 0) {
      vitalsHistory.forEach(record => {
        if (record.bmi) {
          bmiHistoryArr.push({
            date: record.date || new Date().toISOString().split('T')[0],
            bmi: parseFloat(record.bmi),
            bmiStatus: record.bmiStatus || '',
            weight: record.weight,
            height: record.height
          });
        }
      });
    }

    // Get last visit date
    let lastVisit = null;
    if (allRecords.length > 0) {
      const dates = allRecords
        .map(r => r.date || r.visitDate || r.createdAt || r.dateGiven || r.date_given)
        .filter(Boolean)
        .map(d => new Date(d));
      if (dates.length > 0) {
        const sortedDates = dates.sort((a, b) => b - a);
        lastVisit = sortedDates[0];
      }
    }
    if (!lastVisit && child?.createdAt) {
      lastVisit = new Date(child.createdAt);
    }

    setChildSummary({
      totalVisits,
      averageVisits: totalVisits > 0 ? (totalVisits / 1).toFixed(1) : 0,
      medications: Array.from(medsSet),
      services: Array.from(servicesSet),
      diagnoses: Array.from(diagnosesSet),
      symptoms: Array.from(symptomsSet),
      bmiHistory: bmiHistoryArr,
      hospitalizations: hospitalizationCount,
      lastVisit,
    });
  };

  const getBMIDistribution = () => {
    const distribution = {
      "Severely Underweight": 0,
      "Underweight": 0,
      "Normal": 0,
      "Overweight": 0,
      "Obese": 0,
    };

    const recordsToUse = vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory : [];

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

  const getLatestBMI = () => {
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
        date: latest.date || new Date().toISOString().split('T')[0],
        weight: latest.weight,
        height: latest.height
      };
    }
    return null;
  };

  const latestBMI = getLatestBMI();

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
      <div className="mr-program-summary">
        <div className="mr-loading-state">
          <div className="mr-spinner-small"></div>
          <p>Loading summary data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-program-summary">
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Patient Overview</h3>
          <span className="mr-section-badge">{child?.fullName || 'Patient'}</span>
        </div>
        <div className="mr-overview-grid">
          <div className="mr-overview-item">
            <span className="mr-overview-label">Total Visits</span>
            <span className="mr-overview-value-large">{childSummary.totalVisits}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Last Visit</span>
            <span className="mr-overview-value-large">{childSummary.lastVisit ? formatDate(childSummary.lastVisit) : 'N/A'}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Medications</span>
            <span className="mr-overview-value-large">{childSummary.medications.length}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Services Received</span>
            <span className="mr-overview-value-large">{childSummary.services.length}</span>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Hospitalizations</span>
            <span className="mr-overview-value-large">{childSummary.hospitalizations}</span>
          </div>
        </div>
      </div>

      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>BMI Status</h3>
          <span className="mr-section-badge mr-badge-bmi">Health Status</span>
        </div>
        
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

      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Patient Health Issues</h3>
          <span className="mr-section-badge mr-badge-health">Recorded</span>
        </div>
        <div className="mr-two-columns">
          <div className="mr-health-column">
            <h4>Symptoms ({childSummary.symptoms.length})</h4>
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
            <h4>Diagnoses ({childSummary.diagnoses.length})</h4>
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