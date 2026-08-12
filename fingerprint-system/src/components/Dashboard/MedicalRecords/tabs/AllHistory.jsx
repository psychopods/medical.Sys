import React, { useState, useEffect, useMemo } from "react";
import "./AllHistory.css";
import * as api from "../../../../services/api.js";

const AllHistory = ({ 
  child, 
  medicalRecords = [], 
  vitalsData, 
  medicalServicesData, 
  socialServicesData, 
  othersData,
  getRecordTypeLabel 
}) => {
  // State for combined child history records
  const [displayRecords, setDisplayRecords] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch vitals history for the child
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

  // Combine all records from different sources
  const combineChildRecords = () => {
    const combined = [];

    // 1. Add medical records (baseline, checkups, etc.)
    if (medicalRecords && medicalRecords.length > 0) {
      medicalRecords.forEach(record => {
        combined.push({
          id: record.id || `mr-${Date.now()}-${Math.random()}`,
          visitDate: record.visitDate || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: record.recordType || 'baseline',
          diagnosis: record.diagnosis || 'Routine checkup',
          treatment: record.treatment || '',
          notes: record.notes || '',
          createdByName: record.createdByName || record.recordedByName || 'Staff'
        });
      });
    }

    // 2. Add ALL vitals records from history
    if (vitalsHistory && vitalsHistory.length > 0) {
      vitalsHistory.forEach(record => {
        combined.push({
          id: record.id || `vitals-${Date.now()}-${Math.random()}`,
          visitDate: record.date || new Date().toISOString().split('T')[0],
          recordType: 'vitals',
          diagnosis: `BMI: ${record.bmi || 'N/A'} - ${record.bmiStatus || 'Unknown'}`,
          treatment: `Weight: ${record.weight}kg, Height: ${record.height}cm`,
          notes: `Weight: ${record.weight}kg, Height: ${record.height}cm, BMI: ${record.bmi || 'N/A'}`,
          createdByName: record.recordedByName || 'Staff'
        });
      });
    }

    // 3. Add medical services (medications, tests, procedures)
    if (medicalServicesData) {
      // Medications
      const medications = [
        ...(medicalServicesData.medications?.ntdsMeds || []),
        ...(medicalServicesData.medications?.antibiotics || []),
        ...(medicalServicesData.medications?.otherMeds || [])
      ];
      
      if (medications.length > 0) {
        combined.push({
          id: `med-${Date.now()}-${Math.random()}`,
          visitDate: medicalServicesData.date || new Date().toISOString().split('T')[0],
          recordType: 'medication',
          diagnosis: 'Medication administered',
          treatment: medications.join(', '),
          notes: `Medications: ${medications.join(', ')}`,
          createdByName: medicalServicesData.recordedByName || 'Staff'
        });
      }

      // Tests
      const tests = medicalServicesData.tests?.testTypes || [];
      const results = medicalServicesData.tests?.results || [];
      if (tests.length > 0) {
        combined.push({
          id: `test-${Date.now()}-${Math.random()}`,
          visitDate: medicalServicesData.date || new Date().toISOString().split('T')[0],
          recordType: 'test',
          diagnosis: `Tests: ${tests.join(', ')}`,
          treatment: `Results: ${results.join(', ')}`,
          notes: medicalServicesData.tests?.notes || '',
          createdByName: medicalServicesData.recordedByName || 'Staff'
        });
      }

      // Procedures
      if (medicalServicesData.procedures && medicalServicesData.procedures.length > 0) {
        combined.push({
          id: `proc-${Date.now()}-${Math.random()}`,
          visitDate: medicalServicesData.date || new Date().toISOString().split('T')[0],
          recordType: 'service',
          diagnosis: 'Procedures performed',
          treatment: medicalServicesData.procedures.join(', '),
          notes: `Procedures: ${medicalServicesData.procedures.join(', ')}`,
          createdByName: medicalServicesData.recordedByName || 'Staff'
        });
      }
    }

    // 4. Add social services
    if (socialServicesData) {
      const services = [];
      
      if (socialServicesData.clothing) {
        const clothes = socialServicesData.clothing.clothes || 0;
        const shoes = socialServicesData.clothing.shoes || 0;
        if (clothes > 0 || shoes > 0) {
          services.push(`Clothes: ${clothes}, Shoes: ${shoes}`);
        }
        if (socialServicesData.clothing.notes) {
          services.push(`Notes: ${socialServicesData.clothing.notes}`);
        }
      }
      
      if (socialServicesData.education && socialServicesData.education.length > 0) {
        services.push(`Education: ${socialServicesData.education.join(', ')}`);
      }
      
      if (socialServicesData.foodRefreshment) {
        services.push(`Food: ${socialServicesData.foodRefreshment}`);
        if (socialServicesData.foodDetails) {
          services.push(`Details: ${socialServicesData.foodDetails}`);
        }
      }
      
      if (socialServicesData.otherServices) {
        services.push(`Other: ${socialServicesData.otherServices}`);
      }

      if (services.length > 0) {
        combined.push({
          id: `social-${Date.now()}-${Math.random()}`,
          visitDate: socialServicesData.date || new Date().toISOString().split('T')[0],
          recordType: 'service',
          diagnosis: 'Social services provided',
          treatment: services.join(' | '),
          notes: socialServicesData.clothing?.notes || '',
          createdByName: socialServicesData.recordedByName || 'Staff'
        });
      }
    }

    // 5. Add others/assessment data
    if (othersData) {
      const assessments = [];
      
      if (othersData.symptoms) {
        assessments.push(`Symptoms: ${othersData.symptoms}`);
      }
      
      if (othersData.visitNotes) {
        assessments.push(`Visit Notes: ${othersData.visitNotes}`);
      }
      
      if (othersData.diagnosis) {
        assessments.push(`Diagnosis: ${othersData.diagnosis}`);
      }
      
      if (othersData.diagnosisNotes) {
        assessments.push(`Diagnosis Notes: ${othersData.diagnosisNotes}`);
      }
      
      if (othersData.hospitalized) {
        assessments.push(`Hospitalized: ${othersData.timeHospitalized || 'Yes'}`);
      }

      if (assessments.length > 0) {
        combined.push({
          id: `assess-${Date.now()}-${Math.random()}`,
          visitDate: othersData.date || new Date().toISOString().split('T')[0],
          recordType: 'diagnosis',
          diagnosis: othersData.diagnosis || 'Assessment performed',
          treatment: assessments.join(' | '),
          notes: othersData.visitNotes || othersData.diagnosisNotes || '',
          createdByName: othersData.recordedByName || 'Staff'
        });
      }
    }

    // Sort by date (newest first)
    combined.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
    
    return combined;
  };

  // Fetch vitals history when child changes
  useEffect(() => {
    if (child && child.id) {
      fetchVitalsHistory(child.id);
    } else {
      setVitalsHistory([]);
    }
  }, [child]);

  // Combine records when data changes
  useEffect(() => {
    if (child && child.id) {
      const records = combineChildRecords();
      setDisplayRecords(records);
    } else {
      setDisplayRecords([]);
    }
  }, [child, medicalRecords, vitalsHistory, medicalServicesData, socialServicesData, othersData]);

  // Get the count of records by type
  const getRecordTypeCounts = () => {
    const counts = {};
    displayRecords.forEach(record => {
      const type = record.recordType || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  };

  const recordCounts = getRecordTypeCounts();

  // If no child selected or no records, show empty state
  if (!child || !child.id) {
    return (
      <div className="mr-all-history">
        <div className="mr-history-header-section">
          <h3>Complete Medical History</h3>
          <span className="mr-history-count">0 records</span>
        </div>
        <div className="mr-empty-state">
          <span className="mr-empty-icon">📋</span>
          <p>No patient selected</p>
          <span className="mr-empty-subtext">Please select a patient to view their medical history.</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mr-all-history">
        <div className="mr-history-header-section">
          <h3>Medical History - {child.fullName || 'Patient'}</h3>
          <span className="mr-history-count">Loading...</span>
        </div>
        <div className="mr-loading-state">
          <div className="mr-spinner-small"></div>
          <p>Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-all-history">
      <div className="mr-history-header-section">
        <div className="mr-history-title-wrapper">
          <h3>Medical History - {child.fullName || 'Patient'}</h3>
          <span className="mr-history-id">ID: {child.customSerialId || 'N/A'}</span>
        </div>
        <span className="mr-history-count">
          {displayRecords.length} records
        </span>
      </div>
      
      {/* Record Type Summary */}
      {displayRecords.length > 0 && (
        <div className="mr-history-summary">
          {Object.entries(recordCounts).map(([type, count]) => (
            <span key={type} className={`mr-summary-badge mr-summary-${type}`}>
              {getRecordTypeLabel ? getRecordTypeLabel(type) : type}: {count}
            </span>
          ))}
        </div>
      )}
      
      {displayRecords.length === 0 ? (
        <div className="mr-empty-state">
          <span className="mr-empty-icon">📋</span>
          <p>No medical history records found</p>
          <span className="mr-empty-subtext">Records will appear here once they are added for this patient.</span>
        </div>
      ) : (
        <div className="mr-history-list">
          {displayRecords.map((record, index) => (
            <div key={record.id || index} className="mr-history-item">
              <div className="mr-history-header">
                <span className="mr-history-date">
                  {new Date(record.visitDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <span
                  className={`mr-history-badge mr-badge-${record.recordType}`}
                >
                  {getRecordTypeLabel ? getRecordTypeLabel(record.recordType) : record.recordType}
                </span>
              </div>
              <div className="mr-history-diagnosis">
                <strong>Diagnosis:</strong> {record.diagnosis}
              </div>
              {record.treatment && (
                <div className="mr-history-treatment">
                  <strong>Treatment:</strong> {record.treatment}
                </div>
              )}
              {record.notes && (
                <div className="mr-history-notes">
                  <strong>Notes:</strong> {record.notes}
                </div>
              )}
              <div className="mr-history-footer">
                <span className="mr-history-by">
                  Recorded by: {record.createdByName || "Staff"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllHistory;