// /src/components/Dashboard/PatientsHistory.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import './PatientsHistory.css';
import * as api from '../../services/api.js';

// SVG Icons
const WarningIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
  </svg>
);

const NoDataIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const NoRecordsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Helper to get user from localStorage
const getStoredUser = () => {
  try {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    return null;
  }
};

const PatientsHistory = ({ user: propUser, onLogout: propOnLogout }) => {
  // Use prop user or fallback to stored user
  const user = propUser || getStoredUser();
  
  // Create logout function if not provided
  const handleLogout = propOnLogout || (() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  });

  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterFingerprint, setFilterFingerprint] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [locations, setLocations] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [viewingRecords, setViewingRecords] = useState(false);
  const [patientFullData, setPatientFullData] = useState(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [hasError, setHasError] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch patients data with error handling
  const fetchPatients = async () => {
    try {
      const data = await api.getChildren();
      const patientsList = Array.isArray(data) ? data : [];
      
      const patientsWithFingerprints = await Promise.all(
        patientsList.map(async (patient) => {
          try {
            const fingerprints = await api.getBiometricsForChild(patient.id);
            const hasFingerprints = fingerprints && fingerprints.length > 0;
            const fingerprintCount = fingerprints ? fingerprints.length : 0;
            return {
              ...patient,
              hasFingerprints,
              fingerprintCount,
              age: calculateAge(patient.estimatedBirthYear),
              locationName: getLocationName(patient.primaryLocationId),
            };
          } catch (error) {
            return {
              ...patient,
              hasFingerprints: false,
              fingerprintCount: 0,
              age: calculateAge(patient.estimatedBirthYear),
              locationName: getLocationName(patient.primaryLocationId),
            };
          }
        })
      );
      
      setPatients(patientsWithFingerprints);
      setFilteredPatients(patientsWithFingerprints);
      setHasError(false);
      return patientsWithFingerprints;
    } catch (error) {
      console.error('Error fetching patients:', error);
      setHasError(true);
      showToast('Failed to fetch patients', 'error');
      return [];
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const data = await api.getLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch ALL data for a patient
  const fetchPatientFullData = async (patientId) => {
    try {
      setLoadingRecords(true);
      
      // Fetch all data in parallel
      const [
        medicalRecords,
        vitalsRecords,
        medicalServicesRecords,
        socialServicesRecords,
        othersRecords,
        medicationsRecords,
        testsRecords,
        symptomsRecords,
        clothingRecords,
        educationRecords
      ] = await Promise.all([
        api.apiFetchMedicalRecords(patientId).catch(() => []),
        api.apiFetchVitalsRecords(patientId).catch(() => []),
        api.apiFetchMedicalServicesRecords(patientId).catch(() => []),
        api.apiFetchSocialServicesRecords(patientId).catch(() => []),
        api.apiFetchOthersRecords(patientId).catch(() => []),
        api.apiFetchMedicationRecords(patientId).catch(() => []),
        api.apiFetchTestsRecords(patientId).catch(() => []),
        api.apiFetchSymptomsRecords(patientId).catch(() => []),
        api.apiFetchClothingRecords(patientId).catch(() => []),
        api.apiFetchEducationHistory(patientId).catch(() => [])
      ]);

      setPatientFullData({
        medicalRecords: medicalRecords || [],
        vitals: vitalsRecords || [],
        medicalServices: medicalServicesRecords || [],
        socialServices: socialServicesRecords || [],
        others: othersRecords || [],
        medications: medicationsRecords || [],
        tests: testsRecords || [],
        symptoms: symptomsRecords || [],
        clothing: clothingRecords || [],
        education: educationRecords || [],
      });
      
      setLoadingRecords(false);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setLoadingRecords(false);
    }
  };

  // Calculate age from birth year
  const calculateAge = (birthYear) => {
    if (!birthYear) return 'N/A';
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  // Parse structured visitNotes
  const parseVisitNotes = (record) => {
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
    return parsedNotes;
  };

  // Get unified chronological timeline records sorted newest-first by date
  const getTimelineRecords = () => {
    const combined = [];

    // 1. Baselines
    if (patientFullData.medicalRecords) {
      patientFullData.medicalRecords.forEach(record => {
        combined.push({
          id: record.id || `mr-${Date.now()}-${Math.random()}`,
          date: record.visitDate || record.createdAt || '',
          type: 'baseline',
          badgeClass: 'ph-badge-baseline',
          badgeText: 'Baseline',
          title: record.diagnosis || 'Routine checkup',
          details: record.treatment || '',
          notes: record.notes || '',
          recordedBy: record.createdByName || record.recordedByName || 'Staff'
        });
      });
    }

    // 2. Vitals
    if (patientFullData.vitals) {
      patientFullData.vitals.forEach(record => {
        combined.push({
          id: record.id || `vitals-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'vitals',
          badgeClass: 'ph-badge-vitals',
          badgeText: 'Vitals',
          title: `Weight: ${record.weight} kg | Height: ${record.height} cm`,
          details: `BMI: ${record.bmi || 'N/A'} - ${record.bmiStatus || 'Unknown'}`,
          notes: '',
          recordedBy: record.recordedByName || 'Staff'
        });
      });
    }

    // 3. Medications
    if (patientFullData.medications) {
      patientFullData.medications.forEach(record => {
        const meds = [];
        if (record.ntdsMeds || record.ntds_meds) meds.push(`NTDs: ${record.ntdsMeds || record.ntds_meds}`);
        if (record.antibiotics) meds.push(`Antibiotics: ${record.antibiotics}`);
        if (record.otherMeds || record.other_meds) meds.push(`Other: ${record.otherMeds || record.other_meds}`);
        if (meds.length > 0) {
          combined.push({
            id: record.id || `med-${Date.now()}-${Math.random()}`,
            date: record.dateGiven || record.date_given || record.createdAt || '',
            type: 'medication',
            badgeClass: 'ph-badge-medication',
            badgeText: 'Medication',
            title: 'Medications Administered',
            details: meds.join(' | '),
            notes: '',
            recordedBy: record.recordedByName || 'Staff'
          });
        }
      });
    }

    // 4. Tests
    if (patientFullData.tests) {
      patientFullData.tests.forEach(record => {
        combined.push({
          id: record.id || `test-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'test',
          badgeClass: 'ph-badge-test',
          badgeText: 'Test',
          title: `Test Type: ${record.testType || record.test_type || ''}`,
          details: `Result: ${record.result || ''}`,
          notes: '',
          recordedBy: record.recordedByName || 'Staff'
        });
      });
    }

    // 5. Symptoms & Notes
    if (patientFullData.symptoms) {
      patientFullData.symptoms.forEach(record => {
        const parsed = parseVisitNotes(record);
        const parts = [];
        if (record.symptoms) parts.push(`Symptoms: ${record.symptoms}`);
        if (parsed.visitNotes) parts.push(`Notes: ${parsed.visitNotes}`);
        if (parsed.diagnosisNotes) parts.push(`Diag Notes: ${parsed.diagnosisNotes}`);
        
        combined.push({
          id: record.id || `symptom-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'symptom',
          badgeClass: 'ph-badge-symptom',
          badgeText: 'Symptom',
          title: parsed.diagnosis || 'Assessment details',
          details: parts.join(' | '),
          notes: parsed.hospitalized ? `Hospitalized: ${parsed.timeHospitalized || 'Yes'}` : '',
          recordedBy: record.recordedByName || 'Staff'
        });
      });
    }

    // 6. Clothing provisions
    if (patientFullData.clothing) {
      patientFullData.clothing.forEach(record => {
        combined.push({
          id: record.id || `clothing-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'clothing',
          badgeClass: 'ph-badge-service',
          badgeText: 'Clothing',
          title: 'Clothing provisions',
          details: `Shoes: ${record.shoes || 0} pairs | Clothes: ${record.clothes || 0} items`,
          notes: '',
          recordedBy: record.recordedByName || 'Staff'
        });
      });
    }

    // 7. Education history
    if (patientFullData.education) {
      patientFullData.education.forEach(record => {
        combined.push({
          id: record.id || `education-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'education',
          badgeClass: 'ph-badge-service',
          badgeText: 'Education',
          title: 'Education session',
          details: `Topics: ${Array.isArray(record.education) ? record.education.join(', ') : record.education || 'N/A'}`,
          notes: '',
          recordedBy: record.recordedByName || 'Staff'
        });
      });
    }

    // Sort by date (newest first)
    combined.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });

    return combined;
  };

  // Get location name
  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : locationId || 'N/A';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get age group
  const getAgeGroup = (age) => {
    if (age === 'N/A') return 'Unknown';
    if (age < 5) return '0-4';
    if (age < 13) return '5-12';
    if (age < 18) return '13-17';
    if (age < 35) return '18-34';
    if (age < 60) return '35-59';
    return '60+';
  };

  // Get record type label
  const getRecordTypeLabel = (type) => {
    const labels = {
      baseline: 'Baseline',
      vitals: 'Vitals',
      medication: 'Medication',
      test: 'Test',
      service: 'Service',
      symptom: 'Symptom',
      diagnosis: 'Diagnosis',
    };
    return labels[type] || type;
  };

  // Silent refresh function
  const refreshData = useCallback(async (showSpinner = false) => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    
    if (showSpinner) {
      setIsRefreshing(true);
    }
    
    try {
      await fetchPatients();
      await fetchLocations();
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      isRefreshingRef.current = false;
      if (showSpinner) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Start background refresh
  const startBackgroundRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      refreshData(false);
    }, 30000);
  }, [refreshData]);

  // Stop background refresh
  const stopBackgroundRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const locs = await fetchLocations();
      const pts = await fetchPatients();
      setLoading(false);
      
      // Auto-select patient from router state if present
      if (location.state && location.state.child) {
        const passedChild = location.state.child;
        const list = pts || [];
        const found = list.find(p => p.id === passedChild.id) || passedChild;
        
        // Setup locationName on found object
        if (locs && locs.length > 0 && found.primaryLocationId) {
          const loc = locs.find(l => l.id === found.primaryLocationId);
          if (loc) found.locationName = loc.name;
        }
        
        setSelectedPatient(found);
        setViewingRecords(true);
        setShowPatientDetails(true);
        setLoadingRecords(true);
        
        // Fetch historical records from database tables
        try {
          const [vitalsRecords, medicationsRecords, testsRecords, medicalServicesRecords, socialServicesRecords, clothingRecords, educationRecords] = await Promise.all([
            api.apiFetchVitalsRecords(found.id).catch(() => []),
            api.apiFetchMedicationRecords(found.id).catch(() => []),
            api.apiFetchTestsRecords(found.id).catch(() => []),
            api.apiFetchServicesRecords(found.id).then(r => (r || []).filter(item => item.serviceType === 'medical' || item.service_type === 'medical')).catch(() => []),
            api.apiFetchServicesRecords(found.id).then(r => (r || []).filter(item => item.serviceType === 'social' || item.service_type === 'social')).catch(() => []),
            api.apiFetchClothingRecords(found.id).catch(() => []),
            api.apiFetchEducationHistory(found.id).catch(() => [])
          ]);
          setPatientFullData({
            medicalRecords: [],
            vitals: vitalsRecords || [],
            medicalServices: medicalServicesRecords || [],
            socialServices: socialServicesRecords || [],
            others: [],
            medications: medicationsRecords || [],
            tests: testsRecords || [],
            symptoms: [],
            clothing: clothingRecords || [],
            education: educationRecords || [],
          });
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingRecords(false);
        }
      }
    };
    init();

    startBackgroundRefresh();

    return () => {
      stopBackgroundRefresh();
    };
  }, []);

  // Update location names when locations change
  useEffect(() => {
    if (locations.length > 0 && patients.length > 0) {
      const updatedPatients = patients.map(patient => ({
        ...patient,
        locationName: getLocationName(patient.primaryLocationId),
      }));
      setPatients(updatedPatients);
      setFilteredPatients(updatedPatients);
    }
  }, [locations]);

  // Filter and sort patients
  useEffect(() => {
    try {
      let result = [...patients];

      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        result = result.filter(patient =>
          patient.fullName?.toLowerCase().includes(term) ||
          patient.customSerialId?.toLowerCase().includes(term) ||
          patient.locationName?.toLowerCase().includes(term)
        );
      }

      if (filterGender !== 'all') {
        result = result.filter(patient => patient.gender === filterGender);
      }

      if (filterAgeGroup !== 'all') {
        result = result.filter(patient => {
          const age = patient.age;
          if (age === 'N/A') return false;
          const group = getAgeGroup(age);
          return group === filterAgeGroup;
        });
      }

      if (filterLocation !== 'all') {
        result = result.filter(patient => 
          patient.primaryLocationId === filterLocation || 
          patient.locationName === filterLocation
        );
      }

      if (filterFingerprint !== 'all') {
        if (filterFingerprint === 'has') {
          result = result.filter(patient => patient.hasFingerprints);
        } else if (filterFingerprint === 'no') {
          result = result.filter(patient => !patient.hasFingerprints);
        }
      }

      result.sort((a, b) => {
        let valA, valB;
        switch (sortBy) {
          case 'fullName':
            valA = a.fullName || '';
            valB = b.fullName || '';
            break;
          case 'age':
            valA = a.age || 0;
            valB = b.age || 0;
            break;
          case 'gender':
            valA = a.gender || '';
            valB = b.gender || '';
            break;
          case 'locationName':
            valA = a.locationName || '';
            valB = b.locationName || '';
            break;
          case 'createdAt':
          default:
            valA = new Date(a.createdAt || 0);
            valB = new Date(b.createdAt || 0);
            break;
        }

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });

      setFilteredPatients(result);
    } catch (error) {
      console.error('Error filtering patients:', error);
      setFilteredPatients(patients);
    }
  }, [patients, searchTerm, filterGender, filterAgeGroup, filterLocation, filterFingerprint, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
    setViewingRecords(false);
    await fetchPatientFullData(patient.id);
  };

  const handleCloseDetails = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
    setViewingRecords(false);
    setPatientFullData(null);
  };

  const handleViewMedicalRecords = async (patient) => {
    setSelectedPatient(patient);
    setViewingRecords(true);
    setShowPatientDetails(true);
    await fetchPatientFullData(patient.id);
  };

  const handleBackToList = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
    setViewingRecords(false);
    setPatientFullData(null);
  };

  const exportToCSV = () => {
    if (filteredPatients.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    const headers = ['S/N', 'ID', 'Name', 'Age', 'Gender', 'Location', 'Fingerprints', 'Registration Date'];
    const rows = filteredPatients.map((p, index) => [
      index + 1,
      p.customSerialId || 'N/A',
      p.fullName || 'N/A',
      p.age || 'N/A',
      p.gender || 'N/A',
      p.locationName || 'N/A',
      p.hasFingerprints ? 'Yes' : 'No',
      formatDate(p.createdAt)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
  };

  const ageGroups = [
    { value: 'all', label: 'All Ages' },
    { value: '0-4', label: '0-4 years' },
    { value: '5-12', label: '5-12 years' },
    { value: '13-17', label: '13-17 years' },
    { value: '18-34', label: '18-34 years' },
    { value: '35-59', label: '35-59 years' },
    { value: '60+', label: '60+ years' },
  ];

  // Render Patient Details Page
  const renderPatientDetails = () => {
    if (!selectedPatient) return null;

    if (viewingRecords) {
      // Render Medical Records Page with ALL data
      return (
        <div className="ph-details-page">
          <div className="ph-details-header">
            <button className="ph-back-btn" onClick={handleBackToList}>
              ← Back to Patients
            </button>
            <h2>
              Medical Records - {selectedPatient.fullName}
              <span className="ph-patient-id-badge">{selectedPatient.customSerialId || 'N/A'}</span>
            </h2>
          </div>

          <div className="ph-records-page-content">
            {loadingRecords ? (
              <div className="ph-loading-records">
                <div className="ph-spinner"></div>
                <p>Loading medical records...</p>
              </div>
            ) : patientFullData ? (
              <div className="ph-records-list-full">
              <div className="ph-records-list-full">
                {(() => {
                  const timeline = getTimelineRecords();
                  if (timeline.length === 0) {
                    return (
                      <div className="ph-no-records-full">
                        <span className="ph-no-records-icon"><NoRecordsIcon /></span>
                        <p>No medical records found for this patient.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="ph-timeline-container">
                      {timeline.map((record, index) => (
                        <div key={record.id || index} className="ph-record-item-full">
                          <div className="ph-record-header-full">
                            <span className="ph-record-date-full">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className={`ph-record-badge-full ${record.badgeClass}`}>
                              {record.badgeText}
                            </span>
                          </div>
                          
                          <div className="ph-record-diagnosis-full">
                            <strong>
                              {record.type === 'vitals' 
                                ? 'Measurements' 
                                : record.type === 'medication' 
                                  ? 'Action' 
                                  : record.type === 'test' 
                                    ? 'Test' 
                                    : record.type === 'clothing' 
                                      ? 'Items' 
                                      : record.type === 'education' 
                                        ? 'Topic' 
                                        : 'Diagnosis'}
                              :
                            </strong>{' '}
                            {record.title}
                          </div>
                          
                          {record.details && (
                            <div className="ph-record-treatment-full">
                              <strong>
                                {record.type === 'vitals' 
                                  ? 'BMI Status' 
                                  : record.type === 'medication' 
                                    ? 'Details' 
                                    : record.type === 'test' 
                                      ? 'Result' 
                                      : record.type === 'clothing' 
                                        ? 'Quantities' 
                                        : record.type === 'education' 
                                          ? 'Sessions' 
                                          : 'Treatment'}
                                :
                              </strong>{' '}
                              {record.details}
                            </div>
                          )}
                          
                          {record.notes && (
                            <div className="ph-record-notes-full">
                              <strong>Notes:</strong> {record.notes}
                            </div>
                          )}
                          
                          <div className="ph-record-footer-full">
                            <span>Recorded by: {record.recordedBy || 'Staff'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              </div>
            ) : (
              <div className="ph-no-records-full">
                <span className="ph-no-records-icon"><NoRecordsIcon /></span>
                <p>No medical records found for this patient.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Render Patient Details Page
    return (
      <div className="ph-details-page">
        <div className="ph-details-header">
          <button className="ph-back-btn" onClick={handleBackToList}>
            ← Back to Patients
          </button>
          <h2>
            Patient Details - {selectedPatient.fullName}
            <span className="ph-patient-id-badge">{selectedPatient.customSerialId || 'N/A'}</span>
          </h2>
        </div>

        <div className="ph-details-content">
          {/* Patient Info Grid */}
          <div className="ph-details-grid">
            <div className="ph-detail-card">
              <label>Full Name</label>
              <span>{selectedPatient.fullName}</span>
            </div>
            <div className="ph-detail-card">
              <label>ID</label>
              <span>{selectedPatient.customSerialId || 'N/A'}</span>
            </div>
            <div className="ph-detail-card">
              <label>Age</label>
              <span>{selectedPatient.age !== 'N/A' ? `${selectedPatient.age} years` : 'N/A'}</span>
            </div>
            <div className="ph-detail-card">
              <label>Gender</label>
              <span>{selectedPatient.gender || 'N/A'}</span>
            </div>
            <div className="ph-detail-card">
              <label>Location</label>
              <span>{selectedPatient.locationName}</span>
            </div>
            <div className="ph-detail-card">
              <label>Fingerprints</label>
              <span>{selectedPatient.hasFingerprints ? `Yes (${selectedPatient.fingerprintCount || 0} captured)` : 'No'}</span>
            </div>
            <div className="ph-detail-card">
              <label>Registration Date</label>
              <span>{formatDate(selectedPatient.createdAt)}</span>
            </div>
            <div className="ph-detail-card">
              <label>Age Group</label>
              <span>{getAgeGroup(selectedPatient.age)}</span>
            </div>
          </div>

          {/* Patient Photos */}
          {(selectedPatient.image1 || selectedPatient.image2 || selectedPatient.image3) && (
            <div className="ph-details-photos">
              <label>Patient Photos</label>
              <div className="ph-photo-grid-full">
                {selectedPatient.image1 && <img src={selectedPatient.image1} alt="Photo 1" />}
                {selectedPatient.image2 && <img src={selectedPatient.image2} alt="Photo 2" />}
                {selectedPatient.image3 && <img src={selectedPatient.image3} alt="Photo 3" />}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="ph-details-actions">
            <button className="ph-btn ph-btn-secondary" onClick={handleBackToList}>
              Back to List
            </button>
            <button 
              className="ph-btn ph-btn-primary"
              onClick={() => handleViewMedicalRecords(selectedPatient)}
            >
              View Medical Records
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If there's an error, show error state
  if (hasError) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="ph-error-state">
          <span className="ph-error-icon"><WarningIcon /></span>
          <h3>Something went wrong</h3>
          <p>Failed to load patients. Please try refreshing the page.</p>
          <button 
            className="ph-btn ph-btn-primary"
            onClick={() => {
              setHasError(false);
              setLoading(true);
              fetchPatients().finally(() => setLoading(false));
            }}
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  // If loading, return loading state inside Layout
  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="ph-loading">
          <div className="ph-spinner"></div>
          <p>Loading patients...</p>
        </div>
      </Layout>
    );
  }

  // If viewing patient details, show details page
  if (showPatientDetails && selectedPatient) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="ph-container">
          {renderPatientDetails()}
        </div>
      </Layout>
    );
  }

  // Main List View
  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="ph-container">
        {/* Toast Notification */}
        {toast.show && (
          <div className={`ph-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
          </div>
        )}

        {/* Refresh Indicator */}
        <div className="ph-refresh-indicator">
          {isRefreshing && <span className="ph-refresh-spinner"></span>}
          {lastRefreshed && (
            <span className="ph-refresh-time">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Header */}
        <div className="ph-header">
          <div className="ph-header-left">
            <h1>Patients History</h1>
            <p>View and manage all patients in the system</p>
          </div>
          <div className="ph-header-right">
            <span className="ph-total-count">{filteredPatients.length} patients</span>
            <button className="ph-btn ph-btn-export" onClick={exportToCSV}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="ph-filters">
          <div className="ph-filter-group">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ph-search-input"
            />
          </div>
          <div className="ph-filter-group">
            <select 
              value={filterGender} 
              onChange={(e) => setFilterGender(e.target.value)}
              className="ph-filter-select"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="ph-filter-group">
            <select 
              value={filterAgeGroup} 
              onChange={(e) => setFilterAgeGroup(e.target.value)}
              className="ph-filter-select"
            >
              {ageGroups.map(group => (
                <option key={group.value} value={group.value}>{group.label}</option>
              ))}
            </select>
          </div>
          <div className="ph-filter-group">
            <select 
              value={filterLocation} 
              onChange={(e) => setFilterLocation(e.target.value)}
              className="ph-filter-select"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="ph-filter-group">
            <select 
              value={filterFingerprint} 
              onChange={(e) => setFilterFingerprint(e.target.value)}
              className="ph-filter-select"
            >
              <option value="all">All Fingerprints</option>
              <option value="has">Has Fingerprints</option>
              <option value="no">No Fingerprints</option>
            </select>
          </div>
          <button className="ph-btn ph-btn-clear" onClick={() => {
            setSearchTerm('');
            setFilterGender('all');
            setFilterAgeGroup('all');
            setFilterLocation('all');
            setFilterFingerprint('all');
          }}>
            Clear Filters
          </button>
        </div>

        {/* Patients Table */}
        <div className="ph-table-container">
          <table className="ph-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th onClick={() => handleSort('fullName')} className="ph-sortable">
                  Name {sortBy === 'fullName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('age')} className="ph-sortable">
                  Age {sortBy === 'age' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('gender')} className="ph-sortable">
                  Gender {sortBy === 'gender' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('locationName')} className="ph-sortable">
                  Location {sortBy === 'locationName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Fingerprints</th>
                <th onClick={() => handleSort('createdAt')} className="ph-sortable">
                  Registration Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient, index) => (
                  <tr key={patient.id}>
                    <td style={{ textAlign: 'center', fontWeight: '500', color: '#64748b' }}>
                      {index + 1}
                    </td>
                    <td>
                      <div className="ph-patient-info">
                        {patient.image1 ? (
                          <img src={patient.image1} alt={patient.fullName} className="ph-patient-avatar" />
                        ) : (
                          <span className="ph-patient-avatar ph-avatar-placeholder">
                            {patient.fullName?.charAt(0) || '?'}
                          </span>
                        )}
                        <span className="ph-patient-name">{patient.fullName}</span>
                        <span className="ph-patient-id">({patient.customSerialId || 'N/A'})</span>
                      </div>
                    </td>
                    <td>{patient.age !== 'N/A' ? `${patient.age} years` : 'N/A'}</td>
                    <td>
                      <span className={`ph-gender-badge ph-gender-${patient.gender?.toLowerCase() || 'unknown'}`}>
                        {patient.gender || 'N/A'}
                      </span>
                    </td>
                    <td>{patient.locationName}</td>
                    <td>
                      <span className={`ph-fingerprint-badge ${patient.hasFingerprints ? 'ph-fp-yes' : 'ph-fp-no'}`}>
                        {patient.hasFingerprints ? `✓ ${patient.fingerprintCount || 0}` : '✗ No'}
                      </span>
                    </td>
                    <td>{formatDate(patient.createdAt)}</td>
                    <td>
                      <div className="ph-actions">
                        <button 
                          className="ph-btn ph-btn-view"
                          onClick={() => handleViewPatient(patient)}
                          title="View Details"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View
                        </button>
                        <button 
                          className="ph-btn ph-btn-medical"
                          onClick={() => handleViewMedicalRecords(patient)}
                          title="Medical Records"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          Records
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="ph-no-data">
                    <span className="ph-no-data-icon"><NoDataIcon /></span>
                    <p>No patients found</p>
                    <span className="ph-no-data-sub">Try adjusting your filters</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default PatientsHistory;