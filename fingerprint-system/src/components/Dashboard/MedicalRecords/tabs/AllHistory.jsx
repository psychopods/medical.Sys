import React, { useState, useEffect } from "react";
import "./AllHistory.css";

const AllHistory = ({ medicalRecords = [], getRecordTypeLabel }) => {
  // Mock data for demonstration
  const mockRecords = [
    {
      id: "1",
      visitDate: "2026-08-10",
      recordType: "baseline",
      diagnosis: "Initial assessment - Patient in good health",
      treatment: "Health education provided",
      notes: "Patient presented with no acute complaints. Vital signs normal.",
      createdByName: "Dr. Sarah Johnson"
    },
    {
      id: "2",
      visitDate: "2026-08-05",
      recordType: "vitals",
      diagnosis: "Routine checkup",
      treatment: "Monitoring recommended",
      notes: "Weight: 45kg, Height: 152cm, BMI: 19.5 - Normal range",
      createdByName: "Nurse Mary Atim"
    },
    {
      id: "3",
      visitDate: "2026-07-28",
      recordType: "medication",
      diagnosis: "Malaria",
      treatment: "Artemether-Lumefantrine (ALU) tabs prescribed",
      notes: "Patient presented with fever and headache. Completed 3-day course.",
      createdByName: "Dr. James Okello"
    },
    {
      id: "4",
      visitDate: "2026-07-20",
      recordType: "test",
      diagnosis: "Urinary Tract Infection",
      treatment: "Ciprofloxacin 500mg twice daily for 5 days",
      notes: "Urinalysis showed presence of bacteria. Patient advised to drink plenty of water.",
      createdByName: "Dr. Sarah Johnson"
    },
    {
      id: "5",
      visitDate: "2026-07-15",
      recordType: "service",
      diagnosis: "Nutritional assessment",
      treatment: "Nutritional counseling and supplements",
      notes: "Patient identified as underweight. Provided nutritional education and Vitamin B complex supplements.",
      createdByName: "Nurse Mary Atim"
    },
    {
      id: "6",
      visitDate: "2026-07-10",
      recordType: "symptom",
      diagnosis: "Respiratory infection",
      treatment: "Amoxicillin 500mg three times daily for 7 days",
      notes: "Patient presented with cough, fever, and chest congestion. Advised rest and fluids.",
      createdByName: "Dr. James Okello"
    },
    {
      id: "7",
      visitDate: "2026-07-05",
      recordType: "medication",
      diagnosis: "Intestinal worms",
      treatment: "Albendazole 400mg single dose",
      notes: "Patient complained of abdominal pain. Stool test confirmed helminth infection.",
      createdByName: "Dr. Sarah Johnson"
    },
    {
      id: "8",
      visitDate: "2026-06-28",
      recordType: "service",
      diagnosis: "Wound care",
      treatment: "Wound dressing and antibiotics",
      notes: "Patient presented with minor wound on left arm. Wound cleaned and dressed. Tetanus vaccine administered.",
      createdByName: "Nurse Mary Atim"
    }
  ];

  const [displayRecords, setDisplayRecords] = useState([]);

  useEffect(() => {
    // Use provided records if available, otherwise use mock data
    if (medicalRecords && medicalRecords.length > 0) {
      setDisplayRecords(medicalRecords);
    } else {
      setDisplayRecords(mockRecords);
    }
  }, [medicalRecords]);

  return (
    <div className="mr-all-history">
      <div className="mr-history-header-section">
        <h3>Complete Medical History</h3>
        <span className="mr-history-count">
          {displayRecords.length} records
        </span>
      </div>
      
      {displayRecords.length === 0 ? (
        <div className="mr-empty-state">
          <span className="mr-empty-icon">📋</span>
          <p>No medical history records found.</p>
          <span className="mr-empty-subtext">Records will appear here once they are added.</span>
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