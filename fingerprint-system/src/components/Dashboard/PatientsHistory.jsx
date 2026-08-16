// /src/components/Dashboard/PatientsHistory.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import './PatientsHistory.css';
import * as api from '../../services/api.js';

// ============================================
// SVG ICONS (Same as AllHistory)
// ============================================

const IconMedical = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <path d="M12 22V12" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconHeart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconMedication = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M12 6v6" />
    <path d="M8 8h8" />
    <circle cx="12" cy="18" r="4" />
    <path d="M12 14v2" />
    <path d="M12 20v2" />
  </svg>
);

const IconLab = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect x="4" y="6" width="16" height="16" rx="2" />
    <path d="M8 10h8" />
    <path d="M8 14h6" />
    <path d="M8 18h4" />
    <circle cx="18" cy="18" r="3" />
    <path d="M18 15v6" />
    <path d="M15 18h6" />
  </svg>
);

const IconService = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const IconEducation = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="13" y2="13" />
  </svg>
);

const IconAssessment = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconClipboard = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const IconSpinner = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-spinner">
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconId = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 8h20" />
    <circle cx="8" cy="12" r="2" />
    <path d="M12 12h6" />
    <path d="M12 16h4" />
  </svg>
);

const IconUserBadge = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <rect x="2" y="2" width="20" height="20" rx="2" />
  </svg>
);

const IconGender = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 16v6" />
    <path d="M9 22h6" />
    <path d="M12 2v2" />
    <path d="M9 4h6" />
  </svg>
);

const IconAge = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconLocation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconCalendarCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <polyline points="16 14 12 18 9 15" />
  </svg>
);

// ============================================
// MISSING ICONS - ADDED
// ============================================

const NoDataIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const WarningIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
  </svg>
);

// Map icons to record types
const getTypeIcon = (type) => {
  const icons = {
    baseline: <IconMedical />,
    vitals: <IconHeart />,
    medication: <IconMedication />,
    test: <IconLab />,
    service: <IconService />,
    education: <IconEducation />,
    assessment: <IconAssessment />,
    diagnosis: <IconAssessment />,
    clothing: <IconService />,
    social: <IconService />,
    unknown: <IconClipboard />
  };
  return icons[type] || icons.unknown;
};

const getTypeLabel = (type) => {
  const labels = {
    baseline: 'Baseline',
    vitals: 'Vitals',
    medication: 'Medication',
    test: 'Lab Test',
    service: 'Service',
    education: 'Education',
    assessment: 'Assessment',
    diagnosis: 'Diagnosis',
    clothing: 'Clothing',
    social: 'Social Service',
    unknown: 'Unknown'
  };
  return labels[type] || type;
};

// Helper to get user from localStorage
const getStoredUser = () => {
  try {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    return null;
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

const PatientsHistory = ({ user: propUser, onLogout: propOnLogout }) => {
  const user = propUser || getStoredUser();
  
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
  const [selectedFilterRecords, setSelectedFilterRecords] = useState('all');
  const [searchRecordsTerm, setSearchRecordsTerm] = useState('');

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

  // ============================================
  // GET TIMELINE RECORDS
  // ============================================

  const getTimelineRecords = () => {
    const combined = [];

    // 1. BASELINE
    if (patientFullData?.medicalRecords && patientFullData.medicalRecords.length > 0) {
      patientFullData.medicalRecords.forEach(record => {
        const locationName = record.location || record.locationName || selectedPatient?.locationName || 'N/A';
        const kidId = selectedPatient?.customSerialId || record.kidId || 'N/A';
        const fullName = selectedPatient?.fullName || record.fullName || 'N/A';
        const gender = selectedPatient?.gender || record.gender || 'N/A';
        const age = selectedPatient?.age || record.age || calculateAge(selectedPatient?.estimatedBirthYear) || 'N/A';
        
        combined.push({
          id: record.id || `mr-${Date.now()}-${Math.random()}`,
          date: record.visitDate || record.createdAt || '',
          type: 'baseline',
          badgeClass: 'ph-badge-baseline',
          badgeText: 'Baseline',
          isBaseline: true,
          baselineData: {
            kidId: kidId,
            fullName: fullName,
            gender: gender,
            age: age,
            visitDate: record.visitDate || record.createdAt || '',
            location: locationName,
            firstVisit: record.firstVisit || false,
            recordedBy: record.recordedByName || 'Staff'
          },
          title: 'Baseline Information',
          details: '',
          notes: record.notes || '',
          recordedBy: record.createdByName || record.recordedByName || 'Staff'
        });
      });
    } else if (selectedPatient) {
      const locationName = selectedPatient?.locationName || selectedPatient?.primaryLocationId || 'N/A';
      const visitDate = selectedPatient?.createdAt ? new Date(selectedPatient.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const kidId = selectedPatient?.customSerialId || 'N/A';
      const fullName = selectedPatient?.fullName || 'N/A';
      const gender = selectedPatient?.gender || 'N/A';
      const age = selectedPatient?.age || calculateAge(selectedPatient?.estimatedBirthYear) || 'N/A';
      
      combined.push({
        id: `baseline-${Date.now()}`,
        date: visitDate,
        type: 'baseline',
        badgeClass: 'ph-badge-baseline',
        badgeText: 'Baseline',
        isBaseline: true,
        baselineData: {
          kidId: kidId,
          fullName: fullName,
          gender: gender,
          age: age,
          visitDate: visitDate,
          location: locationName,
          firstVisit: true,
          recordedBy: 'System'
        },
        title: 'Baseline Information',
        details: '',
        notes: '',
        recordedBy: 'System'
      });
    }

    // 2. Vitals
    if (patientFullData?.vitals) {
      patientFullData.vitals.forEach(record => {
        combined.push({
          id: record.id || `vitals-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'vitals',
          badgeClass: 'ph-badge-vitals',
          badgeText: 'Vitals',
          title: `Vitals Check - BMI: ${record.bmi || 'N/A'} (${record.bmiStatus || 'Unknown'})`,
          details: '',
          measurement: `Weight: ${record.weight || 'N/A'}kg | Height: ${record.height || 'N/A'}cm | BMI: ${record.bmi || 'N/A'} (${record.bmiStatus || 'Unknown'})`,
          notes: '',
          recordedBy: record.recordedByName || 'Staff',
          isVitals: true
        });
      });
    }

    // 3. Medications
    if (patientFullData?.medications) {
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
            title: 'Medication Administration',
            details: meds.join(' | '),
            notes: 'Prescribed medications administered to patient.',
            recordedBy: record.recordedByName || 'Staff'
          });
        }
      });
    }

    // 4. Tests
    if (patientFullData?.tests) {
      patientFullData.tests.forEach(record => {
        combined.push({
          id: record.id || `test-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'test',
          badgeClass: 'ph-badge-test',
          badgeText: 'Lab Test',
          title: `Lab Test: ${record.testType || record.test_type || ''}`,
          details: '',
          notes: `Result: ${record.result || 'Pending'} ${record.notes ? '| Notes: ' + record.notes : ''}`,
          recordedBy: record.recordedByName || 'Staff'
        });
      });
    }

    // 5. Symptoms/Assessment
    if (patientFullData?.symptoms) {
      patientFullData.symptoms.forEach(record => {
        const parsed = parseVisitNotes(record);
        const parts = [];
        if (record.symptoms) parts.push(`Symptoms: ${record.symptoms}`);
        if (parsed.visitNotes) parts.push(`Visit Notes: ${parsed.visitNotes}`);
        if (parsed.diagnosisNotes) parts.push(`Diagnosis Notes: ${parsed.diagnosisNotes}`);
        if (parsed.hospitalized) parts.push(`Hospitalized: ${parsed.timeHospitalized || 'Yes'}`);
        
        combined.push({
          id: record.id || `symptom-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'assessment',
          badgeClass: 'ph-badge-assessment',
          badgeText: 'Assessment',
          title: parsed.diagnosis || 'Assessment Performed',
          details: '',
          notes: parts.join(' | ') || 'Assessment recorded',
          recordedBy: record.recordedByName || 'Staff'
        });
      });
    }

    // 6. Clothing provisions
    if (patientFullData?.clothing) {
      patientFullData.clothing.forEach(record => {
        const details = [];
        if (record.clothes) details.push(`Clothes: ${record.clothes}`);
        if (record.shoes) details.push(`Shoes: ${record.shoes}`);
        combined.push({
          id: record.id || `clothing-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'clothing',
          badgeClass: 'ph-badge-service',
          badgeText: 'Clothing',
          title: 'Clothing Provisions',
          details: details.join(' | '),
          notes: 'Clothing items provided to patient.',
          recordedBy: record.recordedByName || 'Staff',
          isService: true
        });
      });
    }

    // 7. Education history
    if (patientFullData?.education) {
      patientFullData.education.forEach(record => {
        combined.push({
          id: record.id || `education-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'education',
          badgeClass: 'ph-badge-service',
          badgeText: 'Education',
          title: 'Education Session',
          details: `Topics: ${Array.isArray(record.education) ? record.education.join(', ') : record.education || 'N/A'}`,
          notes: '',
          recordedBy: record.recordedByName || 'Staff',
          isService: true
        });
      });
    }

    // 8. Medical Services
    if (patientFullData?.medicalServices) {
      patientFullData.medicalServices.forEach(record => {
        const list = record.servicesList || record.services_list || '';
        combined.push({
          id: record.id || `medical-service-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'service',
          badgeClass: 'ph-badge-service',
          badgeText: 'Medical Service',
          title: record.serviceType || record.service_type ? `${(record.serviceType || record.service_type).charAt(0).toUpperCase() + (record.serviceType || record.service_type).slice(1)} Service Provided` : 'Medical Service Provided',
          details: list || 'Service rendered',
          notes: '',
          recordedBy: record.recordedByName || record.recorded_by_name || 'Staff',
          isService: true,
          servicesProvided: list || 'Service rendered'
        });
      });
    }

    // 9. Social Services
    if (patientFullData?.socialServices) {
      patientFullData.socialServices.forEach(record => {
        const list = record.servicesList || record.services_list || '';
        combined.push({
          id: record.id || `social-service-${Date.now()}-${Math.random()}`,
          date: record.date || record.createdAt || '',
          type: 'social',
          badgeClass: 'ph-badge-service',
          badgeText: 'Social Service',
          title: 'Social Service Provided',
          details: list || 'Social service rendered',
          notes: '',
          recordedBy: record.recordedByName || record.recorded_by_name || 'Staff',
          isService: true,
          servicesProvided: list || 'Social service rendered'
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

  // ============================================
  // RENDER BASELINE CARD
  // ============================================

  const renderBaselineCard = (record) => {
    const data = record.baselineData;
    const isFirstVisit = false;
    
    return (
      <div className="ph-baseline-card">
        <div className="ph-baseline-grid">
          <div className="ph-baseline-item">
            <span className="ph-baseline-label"><IconId /> Kid ID</span>
            <span className="ph-baseline-value">{data.kidId}</span>
          </div>
          <div className="ph-baseline-item">
            <span className="ph-baseline-label"><IconUserBadge /> Full Name</span>
            <span className="ph-baseline-value">{data.fullName}</span>
          </div>
          <div className="ph-baseline-item">
            <span className="ph-baseline-label"><IconGender /> Gender</span>
            <span className="ph-baseline-value">{data.gender}</span>
          </div>
          <div className="ph-baseline-item">
            <span className="ph-baseline-label"><IconAge /> Age</span>
            <span className="ph-baseline-value">{data.age}</span>
          </div>
          <div className="ph-baseline-item">
            <span className="ph-baseline-label"><IconCalendarCheck /> Visit Date</span>
            <span className="ph-baseline-value">{new Date(data.visitDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}</span>
          </div>
          <div className="ph-baseline-item">
            <span className="ph-baseline-label"><IconLocation /> Location</span>
            <span className="ph-baseline-value">{data.location}</span>
          </div>
        </div>
        <div className="ph-baseline-footer">
          <div className="ph-baseline-footer-left">
            <span className="ph-baseline-recorded-by">Recorded by: {data.recordedBy}</span>
          </div>
          <div className="ph-baseline-footer-right">
            {isFirstVisit && <span className="ph-baseline-first-visit">First Visit</span>}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // EXPORT FUNCTION - INCLUDES ALL MEDICAL HISTORY
  // ============================================

  const exportToCSV = () => {
    // If viewing a specific patient's records, export that patient's full history
    if (showPatientDetails && selectedPatient && viewingRecords) {
      const timeline = patientFullData ? getTimelineRecords() : [];
      if (timeline.length === 0) {
        showToast('No medical records to export for this patient', 'warning');
        return;
      }

      const headers = [
        'Date', 'Type', 'Diagnosis', 'Details', 'Services Provided', 
        'Measurements', 'Notes', 'Recorded By'
      ];
      
      const rows = timeline.map(record => {
        let diagnosis = record.title || '';
        let details = record.details || '';
        let servicesProvided = '';
        let measurements = record.measurement || '';
        let notes = record.notes || '';
        
        // For baseline records, use the baseline data
        if (record.isBaseline && record.baselineData) {
          const data = record.baselineData;
          diagnosis = 'Baseline Information';
          details = `Kid ID: ${data.kidId} | Full Name: ${data.fullName} | Gender: ${data.gender} | Age: ${data.age} | Location: ${data.location}`;
          servicesProvided = '';
          measurements = '';
          notes = '';
        }
        
        // For service records, use services provided
        if (record.isService) {
          servicesProvided = record.details || '';
          details = '';
        }
        
        return [
          new Date(record.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          getTypeLabel(record.type),
          diagnosis,
          details,
          servicesProvided,
          measurements,
          notes,
          record.recordedBy || 'Staff'
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPatient.fullName || 'patient'}_medical_history_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Medical history exported successfully!', 'success');
      return;
    }

    // Export patient list
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

  // ============================================
  // RENDER PATIENT DETAILS
  // ============================================

  const renderPatientDetails = () => {
    if (!selectedPatient) return null;

    if (viewingRecords) {
      const timeline = patientFullData ? getTimelineRecords() : [];
      const recordTypes = ['all', ...new Set(timeline.map(r => r.type))];
      
      let filteredTimeline = timeline;
      if (selectedFilterRecords !== 'all') {
        filteredTimeline = timeline.filter(r => r.type === selectedFilterRecords);
      }
      
      if (searchRecordsTerm.trim()) {
        const term = searchRecordsTerm.toLowerCase().trim();
        filteredTimeline = filteredTimeline.filter(r => 
          r.title?.toLowerCase().includes(term) ||
          r.details?.toLowerCase().includes(term) ||
          r.notes?.toLowerCase().includes(term) ||
          r.measurement?.toLowerCase().includes(term) ||
          r.recordedBy?.toLowerCase().includes(term)
        );
      }

      return (
        <div className="ph-details-page">
          <div className="ph-details-header">
            <button className="ph-back-btn" onClick={handleBackToList}>
              ← Back to Patients
            </button>
            <h2>
              <IconMedical /> Medical History - {selectedPatient.fullName}
              <span className="ph-patient-id-badge">{selectedPatient.customSerialId || 'N/A'}</span>
            </h2>
            <button className="ph-btn ph-btn-export" onClick={exportToCSV} style={{ marginLeft: 'auto' }}>
              <IconDownload /> Export CSV
            </button>
          </div>

          <div className="ph-records-page-content">
            {loadingRecords ? (
              <div className="ph-loading-records">
                <div className="ph-spinner"></div>
                <p>Loading medical records...</p>
              </div>
            ) : (
              <div className="ph-records-list-full">
                {/* Summary Cards */}
                {timeline.length > 0 && (
                  <div className="ph-history-summary-cards">
                    {Object.entries(
                      timeline.reduce((acc, r) => {
                        acc[r.type] = (acc[r.type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <div 
                        key={type} 
                        className={`ph-summary-card ph-summary-${type}`}
                        onClick={() => setSelectedFilterRecords(selectedFilterRecords === type ? 'all' : type)}
                      >
                        <span className="ph-summary-icon">{getTypeIcon(type)}</span>
                        <div className="ph-summary-info">
                          <span className="ph-summary-count">{count}</span>
                          <span className="ph-summary-label">{getTypeLabel(type)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Controls */}
                {timeline.length > 0 && (
                  <div className="ph-history-controls">
                    <div className="ph-search-wrapper">
                      <span className="ph-search-icon"><IconSearch /></span>
                      <input
                        type="text"
                        placeholder="Search records..."
                        value={searchRecordsTerm}
                        onChange={(e) => setSearchRecordsTerm(e.target.value)}
                        className="ph-search-input"
                      />
                      {searchRecordsTerm && (
                        <button className="ph-clear-search" onClick={() => setSearchRecordsTerm('')}>
                          <IconClose />
                        </button>
                      )}
                    </div>
                    <div className="ph-filter-row">
                      <div className="ph-filter-buttons">
                        {recordTypes.map(type => (
                          <button
                            key={type}
                            className={`ph-filter-btn ${selectedFilterRecords === type ? 'active' : ''}`}
                            onClick={() => setSelectedFilterRecords(type)}
                          >
                            {type === 'all' ? 'All' : getTypeLabel(type)}
                            {type !== 'all' && (
                              <span className="ph-filter-count">
                                {timeline.filter(r => r.type === type).length}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      {(searchRecordsTerm || selectedFilterRecords !== 'all') && (
                        <button className="ph-clear-filters-btn" onClick={() => {
                          setSearchRecordsTerm('');
                          setSelectedFilterRecords('all');
                        }}>
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Timeline */}
                {filteredTimeline.length === 0 ? (
                  <div className="ph-empty-state">
                    <div className="ph-empty-icon-wrapper"><IconClipboard /></div>
                    <h4>No Records Found</h4>
                    <p>
                      {searchRecordsTerm 
                        ? `No records match your search "${searchRecordsTerm}". Try a different search term.`
                        : selectedFilterRecords !== 'all' 
                          ? `No ${getTypeLabel(selectedFilterRecords)} records found for this patient.`
                          : 'No medical history records found for this patient.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="ph-history-timeline">
                    {filteredTimeline.map((record, index) => (
                      <div key={record.id || index} className="ph-timeline-item">
                        <div className="ph-timeline-marker">
                          <span className="ph-timeline-icon">{getTypeIcon(record.type)}</span>
                          <div className="ph-timeline-line"></div>
                        </div>
                        <div className="ph-history-card">
                          <div className="ph-history-card-header">
                            <div className="ph-history-card-left">
                              <span className="ph-history-date">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className={`ph-history-badge ${record.badgeClass}`}>
                                {record.badgeText}
                              </span>
                            </div>
                            <span className="ph-history-by">
                              <IconUser /> {record.recordedBy || "Staff"}
                            </span>
                          </div>
                          <div className="ph-history-card-body">
                            {record.isBaseline ? (
                              renderBaselineCard(record)
                            ) : (
                              <>
                                <div className="ph-history-diagnosis">
                                  <span className="ph-label">Diagnosis:</span>
                                  <span className="ph-value">{record.title}</span>
                                </div>
                                
                                {record.isService && record.details && (
                                  <div className="ph-history-services">
                                    <span className="ph-label">Services Provided:</span>
                                    <span className="ph-value">{record.details}</span>
                                  </div>
                                )}
                                
                                {!record.isService && record.details && (
                                  <div className="ph-history-treatment">
                                    <span className="ph-label">
                                      {record.type === 'vitals' ? 'Measurements' : 
                                       record.type === 'medication' ? 'Treatment' : 
                                       record.type === 'test' ? 'Result' : 
                                       record.type === 'clothing' ? 'Items' : 
                                       record.type === 'education' ? 'Topics' : 
                                       'Details'}
                                    </span>
                                    <span className="ph-value">{record.details}</span>
                                  </div>
                                )}
                                
                                {record.measurement && (
                                  <div className="ph-history-measurement">
                                    <span className="ph-label">Measurements:</span>
                                    <span className="ph-value">{record.measurement}</span>
                                  </div>
                                )}
                                
                                {record.notes && (
                                  <div className="ph-history-notes">
                                    <span className="ph-label">Notes:</span>
                                    <span className="ph-value">{record.notes}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
          <div className="ph-details-grid">
            <div className="ph-detail-card">
              <label><IconId /> Kid ID</label>
              <span>{selectedPatient.customSerialId || 'N/A'}</span>
            </div>
            <div className="ph-detail-card">
              <label><IconUserBadge /> Full Name</label>
              <span>{selectedPatient.fullName}</span>
            </div>
            <div className="ph-detail-card">
              <label><IconGender /> Gender</label>
              <span>{selectedPatient.gender || 'N/A'}</span>
            </div>
            <div className="ph-detail-card">
              <label><IconAge /> Age</label>
              <span>{selectedPatient.age !== 'N/A' ? `${selectedPatient.age} years` : 'N/A'}</span>
            </div>
            <div className="ph-detail-card">
              <label><IconCalendarCheck /> Visit Date</label>
              <span>{formatDate(selectedPatient.createdAt)}</span>
            </div>
            <div className="ph-detail-card">
              <label><IconLocation /> Location</label>
              <span>{selectedPatient.locationName}</span>
            </div>
            <div className="ph-detail-card">
              <label>Fingerprints</label>
              <span>{selectedPatient.hasFingerprints ? `Yes (${selectedPatient.fingerprintCount || 0} captured)` : 'No'}</span>
            </div>
            <div className="ph-detail-card">
              <label>Age Group</label>
              <span>{getAgeGroup(selectedPatient.age)}</span>
            </div>
          </div>

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

  // ============================================
  // REMAINING FUNCTIONS
  // ============================================

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

  const startBackgroundRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      refreshData(false);
    }, 30000);
  }, [refreshData]);

  const stopBackgroundRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

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

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const locs = await fetchLocations();
      const pts = await fetchPatients();
      setLoading(false);
      
      if (location.state && location.state.child) {
        const passedChild = location.state.child;
        const list = pts || [];
        const found = list.find(p => p.id === passedChild.id) || passedChild;
        
        if (locs && locs.length > 0 && found.primaryLocationId) {
          const loc = locs.find(l => l.id === found.primaryLocationId);
          if (loc) found.locationName = loc.name;
        }
        
        setSelectedPatient(found);
        setViewingRecords(true);
        setShowPatientDetails(true);
        setLoadingRecords(true);
        
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

  const ageGroups = [
    { value: 'all', label: 'All Ages' },
    { value: '0-4', label: '0-4 years' },
    { value: '5-12', label: '5-12 years' },
    { value: '13-17', label: '13-17 years' },
    { value: '18-34', label: '18-34 years' },
    { value: '35-59', label: '35-59 years' },
    { value: '60+', label: '60+ years' },
  ];

  // If there's an error
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

  // If loading
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

  // If viewing patient details
  if (showPatientDetails && selectedPatient) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="ph-container">
          {renderPatientDetails()}
        </div>
      </Layout>
    );
  }

  // ============================================
  // MAIN LIST VIEW
  // ============================================

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="ph-container">
        {toast.show && (
          <div className={`ph-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
          </div>
        )}

        <div className="ph-refresh-indicator">
          {isRefreshing && <span className="ph-refresh-spinner"></span>}
          {lastRefreshed && (
            <span className="ph-refresh-time">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="ph-header">
          <div className="ph-header-left">
            <h1>Patients History</h1>
            <p>View and manage all patients in the system</p>
          </div>
          <div className="ph-header-right">
            <span className="ph-total-count">{filteredPatients.length} patients</span>
            <button className="ph-btn ph-btn-export" onClick={exportToCSV}>
              <IconDownload /> Export CSV
            </button>
          </div>
        </div>

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