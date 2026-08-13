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
  const [medicationsHistory, setMedicationsHistory] = useState([]);
  const [testsHistory, setTestsHistory] = useState([]);
  const [servicesHistory, setServicesHistory] = useState([]);
  const [symptomsHistory, setSymptomsHistory] = useState([]);
  const [clothingHistory, setClothingHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch full clinical history for the child from database
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

  // Combine all records from different database sources
  const combineChildRecords = () => {
    const combined = [];

    // 1. Add medical records (baseline, checkups, etc.)
    if (medicalRecords && medicalRecords.length > 0) {
      medicalRecords.forEach(record => {
        combined.push({
          id: record.id || `mr-${Date.now()}-${Math.random()}`,
          visitDate: record.visitDate || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: 'baseline',
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

    // 3. Add medications history
    if (medicationsHistory && medicationsHistory.length > 0) {
      medicationsHistory.forEach(record => {
        const meds = [];
        if (record.ntdsMeds || record.ntds_meds) meds.push(record.ntdsMeds || record.ntds_meds);
        if (record.antibiotics) meds.push(record.antibiotics);
        if (record.otherMeds || record.other_meds) meds.push(record.otherMeds || record.other_meds);
        
        if (meds.length > 0) {
          combined.push({
            id: record.id || `med-${Date.now()}-${Math.random()}`,
            visitDate: record.dateGiven || record.date_given || record.createdAt || new Date().toISOString().split('T')[0],
            recordType: 'medication',
            diagnosis: 'Medication administered',
            treatment: meds.join(', '),
            notes: '',
            createdByName: record.recordedByName || record.recorded_by_name || 'Staff'
          });
        }
      });
    }

    // 4. Add laboratory tests history
    if (testsHistory && testsHistory.length > 0) {
      testsHistory.forEach(record => {
        combined.push({
          id: record.id || `test-${Date.now()}-${Math.random()}`,
          visitDate: record.date || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: 'test',
          diagnosis: `Test: ${record.testType || record.test_type || ''}`,
          treatment: `Result: ${record.result || ''}`,
          notes: record.notes || '',
          createdByName: record.recordedByName || record.recorded_by_name || 'Staff'
        });
      });
    }

    // 5. Add services history (generic services_rendered)
    if (servicesHistory && servicesHistory.length > 0) {
      servicesHistory.forEach(record => {
        const type = record.serviceType || record.service_type || 'service';
        const list = record.servicesList || record.services_list || '';
        combined.push({
          id: record.id || `srv-${Date.now()}-${Math.random()}`,
          visitDate: record.date || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: type === 'education' ? 'education' : 'service',
          diagnosis: `${type.charAt(0).toUpperCase() + type.slice(1)} services provided`,
          treatment: list,
          notes: '',
          createdByName: record.recordedByName || record.recorded_by_name || 'Staff'
        });
      });
    }

    // 6. Add clothing provisions history
    if (clothingHistory && clothingHistory.length > 0) {
      clothingHistory.forEach(record => {
        const details = [];
        if (record.clothes) details.push(`Clothes size: ${record.clothes}`);
        if (record.shoes) details.push(`Shoes size: ${record.shoes}`);
        
        combined.push({
          id: record.id || `cloth-${Date.now()}-${Math.random()}`,
          visitDate: record.date || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: 'service',
          diagnosis: 'Clothing provisions',
          treatment: details.join(', '),
          notes: '',
          createdByName: record.recordedByName || record.recorded_by_name || 'Staff'
        });
      });
    }

    // 7. Add symptoms/assessment history
    if (symptomsHistory && symptomsHistory.length > 0) {
      symptomsHistory.forEach(record => {
        let parsedNotes = { visitNotes: record.visitNotes || record.visit_notes || '', diagnosis: '', diagnosisNotes: '', hospitalized: false, timeHospitalized: '' };
        try {
          const rawNotes = record.visitNotes || record.visit_notes || '';
          if (rawNotes.trim().startsWith('{') && rawNotes.trim().endsWith('}')) {
            const parsed = JSON.parse(rawNotes);
            if (parsed && typeof parsed === 'object') {
              parsedNotes = {
                visitNotes: parsed.visitNotes || '',
                diagnosis: parsed.diagnosis || '',
                diagnosisNotes: parsed.diagnosisNotes || '',
                hospitalized: parsed.hospitalized || false,
                timeHospitalized: parsed.timeHospitalized || ''
              };
            }
          }
        } catch (e) {
          // fallback
        }

        const assessments = [];
        if (record.symptoms) assessments.push(`Symptoms: ${record.symptoms}`);
        if (parsedNotes.visitNotes) assessments.push(`Notes: ${parsedNotes.visitNotes}`);
        if (parsedNotes.diagnosisNotes) assessments.push(`Diag Notes: ${parsedNotes.diagnosisNotes}`);
        if (parsedNotes.hospitalized) assessments.push(`Hospitalized: ${parsedNotes.timeHospitalized || 'Yes'}`);
        
        combined.push({
          id: record.id || `assess-${Date.now()}-${Math.random()}`,
          visitDate: record.date || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: 'diagnosis',
          diagnosis: parsedNotes.diagnosis || record.diagnosis || 'Assessment performed',
          treatment: assessments.join(' | '),
          notes: parsedNotes.visitNotes || parsedNotes.diagnosisNotes || '',
          createdByName: record.recordedByName || record.recorded_by_name || 'Staff'
        });
      });
    }

    // Sort by date (newest first)
    combined.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
    
    return combined;
  };

  // Fetch full clinical history when child changes
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

  // Combine records when data changes
  useEffect(() => {
    if (child && child.id) {
      const records = combineChildRecords();
      setDisplayRecords(records);
    } else {
      setDisplayRecords([]);
    }
  }, [child, medicalRecords, vitalsHistory, medicationsHistory, testsHistory, servicesHistory, symptomsHistory, clothingHistory]);

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