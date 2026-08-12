import React, { useState, useEffect, useMemo } from "react";
import "./AllHistory.css";

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

    // 2. Add vitals records
    if (vitalsData && vitalsData.weight && vitalsData.height) {
      combined.push({
        id: `vitals-${Date.now()}-${Math.random()}`,
        visitDate: vitalsData.date || new Date().toISOString().split('T')[0],
        recordType: 'vitals',
        diagnosis: `BMI: ${vitalsData.bmi || 'N/A'} - ${vitalsData.bmiStatus || 'Unknown'}`,
        treatment: 'Monitoring recommended',
        notes: `Weight: ${vitalsData.weight}kg, Height: ${vitalsData.height}cm, BMI: ${vitalsData.bmi || 'N/A'}`,
        createdByName: vitalsData.recordedByName || 'Staff'
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
      }
      
      if (socialServicesData.education && socialServicesData.education.length > 0) {
        services.push(`Education: ${socialServicesData.education.join(', ')}`);
      }
      
      if (socialServicesData.foodRefreshment) {
        services.push(`Food: ${socialServicesData.foodRefreshment}`);
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
      
      if (othersData.diagnosis) {
        assessments.push(`Diagnosis: ${othersData.diagnosis}`);
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

  useEffect(() => {
    if (child && child.id) {
      const records = combineChildRecords();
      setDisplayRecords(records);
    } else {
      setDisplayRecords([]);
    }
  }, [child, medicalRecords, vitalsData, medicalServicesData, socialServicesData, othersData]);

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

  return (
    <div className="mr-all-history">
      <div className="mr-history-header-section">
        <h3>Medical History - {child.fullName || 'Patient'}</h3>
        <span className="mr-history-count">
          {displayRecords.length} records
        </span>
      </div>
      
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