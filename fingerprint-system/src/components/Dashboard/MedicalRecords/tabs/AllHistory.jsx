// src/components/Dashboard/MedicalRecords/tabs/AllHistory.jsx
import React, { useState, useEffect, useMemo } from "react";
import "./AllHistory.css";
import * as api from "../../../../services/api.js";

// ============================================
// SVG ICONS
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

const IconPrint = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M18 9H6" />
    <path d="M18 13v6H6v-6" />
    <rect x="8" y="15" width="8" height="3" />
    <rect x="6" y="9" width="12" height="4" rx="1" />
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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

const IconVisitCount = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <path d="M12 22V12" />
    <circle cx="12" cy="12" r="2" />
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
    unknown: 'Unknown'
  };
  return labels[type] || type;
};

// ============================================
// MAIN COMPONENT
// ============================================

const AllHistory = ({ 
  child, 
  medicalRecords = [], 
  vitalsData, 
  medicalServicesData, 
  socialServicesData, 
  othersData,
  getRecordTypeLabel 
}) => {
  const [displayRecords, setDisplayRecords] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [medicationsHistory, setMedicationsHistory] = useState([]);
  const [testsHistory, setTestsHistory] = useState([]);
  const [servicesHistory, setServicesHistory] = useState([]);
  const [symptomsHistory, setSymptomsHistory] = useState([]);
  const [clothingHistory, setClothingHistory] = useState([]);
  const [baselineHistory, setBaselineHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // State for location and staff names
  const [locationNames, setLocationNames] = useState({});
  const [staffNames, setStaffNames] = useState({});

  // Fetch location names
  const fetchLocationNames = async () => {
    try {
      const locations = await api.getLocations();
      const locationMap = {};
      locations.forEach(loc => {
        locationMap[loc.id] = loc.name;
      });
      setLocationNames(locationMap);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch staff names
  const fetchStaffNames = async () => {
    try {
      const staff = await api.getUsers();
      const staffMap = {};
      staff.forEach(s => {
        const name = `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim() || s.username || s.id;
        staffMap[s.id] = name;
      });
      setStaffNames(staffMap);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  // Get location name from ID
  const getLocationName = (locationId) => {
    if (!locationId) return 'N/A';
    return locationNames[locationId] || locationId;
  };

  // Get staff name from ID
  const getStaffName = (staffId) => {
    if (!staffId) return 'System';
    return staffNames[staffId] || staffId;
  };

  // Fetch full clinical history
  const fetchFullHistory = async (childId) => {
    if (!childId) return;
    try {
      setLoading(true);
      
      const [vitals, meds, tests, srvs, symptoms, clothing, baseline] = await Promise.all([
        api.apiFetchVitalsRecords(childId),
        api.apiFetchMedicationRecords(childId),
        api.apiFetchTestsRecords(childId),
        api.apiFetchServicesRecords(childId),
        api.apiFetchSymptomsRecords(childId),
        api.apiFetchClothingRecords(childId),
        api.apiFetchMedicalRecords(childId)
      ]);
      
      setVitalsHistory(vitals || []);
      setMedicationsHistory(meds || []);
      setTestsHistory(tests || []);
      setServicesHistory(srvs || []);
      setSymptomsHistory(symptoms || []);
      setClothingHistory(clothing || []);
      setBaselineHistory(baseline || []);
      
      await Promise.all([
        fetchLocationNames(),
        fetchStaffNames()
      ]);
    } catch (error) {
      console.error('Error fetching full history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate age from birth year
  const calculateAge = (birthYear) => {
    if (!birthYear) return 'N/A';
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  // Combine all records from different database sources
  const combineChildRecords = () => {
    const allRecords = [];

    // 1. Add baseline records with resolved names
    if (baselineHistory && baselineHistory.length > 0) {
      baselineHistory.forEach(record => {
        const locationId = record.location || record.locationName || child?.primaryLocationId || '';
        const locationName = getLocationName(locationId);
        const visitDate = record.visitDate || record.createdAt || new Date().toISOString().split('T')[0];
        const kidId = child?.customSerialId || record.kidId || 'N/A';
        const fullName = child?.fullName || record.fullName || 'N/A';
        const gender = child?.gender || record.gender || 'N/A';
        const age = child?.age || record.age || calculateAge(child?.estimatedBirthYear) || 'N/A';
        const recordedBy = record.recordedBy || record.recordedByName || '';
        const recordedByName = getStaffName(recordedBy);
        
        allRecords.push({
          id: record.id || `baseline-${Date.now()}-${Math.random()}`,
          visitDate: visitDate,
          recordType: 'baseline',
          diagnosis: 'Baseline Information',
          treatment: '',
          notes: '',
          createdByName: recordedByName || 'Staff',
          icon: <IconMedical />,
          isBaseline: true,
          baselineData: {
            kidId: kidId,
            fullName: fullName,
            gender: gender,
            age: age,
            visitDate: visitDate,
            location: locationName || locationId || 'N/A',
            locationId: locationId,
            firstVisit: record.firstVisit || false,
            recordedBy: recordedByName || 'System',
            recordedById: recordedBy
          }
        });
      });
    } else if (child) {
      const locationId = child?.primaryLocationId || '';
      const locationName = getLocationName(locationId);
      const visitDate = child?.createdAt ? new Date(child.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const kidId = child?.customSerialId || 'N/A';
      const fullName = child?.fullName || 'N/A';
      const gender = child?.gender || 'N/A';
      const age = child?.age || calculateAge(child?.estimatedBirthYear) || 'N/A';
      
      allRecords.push({
        id: `baseline-${Date.now()}`,
        visitDate: visitDate,
        recordType: 'baseline',
        diagnosis: 'Baseline Information',
        treatment: '',
        notes: '',
        createdByName: 'System',
        icon: <IconMedical />,
        isBaseline: true,
        baselineData: {
          kidId: kidId,
          fullName: fullName,
          gender: gender,
          age: age,
          visitDate: visitDate,
          location: locationName || locationId || 'N/A',
          locationId: locationId,
          firstVisit: true,
          recordedBy: 'System',
          recordedById: ''
        }
      });
    }

    // 2. Vitals records with staff names
    if (vitalsHistory && vitalsHistory.length > 0) {
      vitalsHistory.forEach(record => {
        const bmiStatus = record.bmiStatus || 'Unknown';
        const bmi = record.bmi || 'N/A';
        const weight = record.weight || 'N/A';
        const height = record.height || 'N/A';
        const visitDate = record.date || new Date().toISOString().split('T')[0];
        const recordedByName = getStaffName(record.recordedBy);
        
        allRecords.push({
          id: record.id || `vitals-${Date.now()}-${Math.random()}`,
          visitDate: visitDate,
          recordType: 'vitals',
          diagnosis: `Vitals Check - BMI: ${bmi} (${bmiStatus})`,
          treatment: '',
          notes: '',
          measurement: `Weight: ${weight}kg | Height: ${height}cm | BMI: ${bmi} (${bmiStatus})`,
          createdByName: recordedByName || record.recordedByName || 'Staff',
          icon: <IconHeart />,
          isVitals: true
        });
      });
    }

    // 3. Medications with staff names
    if (medicationsHistory && medicationsHistory.length > 0) {
      medicationsHistory.forEach(record => {
        const meds = [];
        if (record.ntdsMeds || record.ntds_meds) meds.push(`NTDs: ${record.ntdsMeds || record.ntds_meds}`);
        if (record.antibiotics) meds.push(`Antibiotics: ${record.antibiotics}`);
        if (record.otherMeds || record.other_meds) meds.push(`Other: ${record.otherMeds || record.other_meds}`);
        
        if (meds.length > 0) {
          const recordedByName = getStaffName(record.recordedBy);
          allRecords.push({
            id: record.id || `med-${Date.now()}-${Math.random()}`,
            visitDate: record.dateGiven || record.date_given || record.createdAt || new Date().toISOString().split('T')[0],
            recordType: 'medication',
            diagnosis: 'Medication Administration',
            treatment: meds.join(' | '),
            notes: 'Prescribed medications administered to patient.',
            createdByName: recordedByName || record.recordedByName || record.recorded_by_name || 'Staff',
            icon: <IconMedication />
          });
        }
      });
    }

    // 4. Laboratory tests with staff names
    if (testsHistory && testsHistory.length > 0) {
      testsHistory.forEach(record => {
        const recordedByName = getStaffName(record.recordedBy);
        allRecords.push({
          id: record.id || `test-${Date.now()}-${Math.random()}`,
          visitDate: record.date || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: 'test',
          diagnosis: `Lab Test: ${record.testType || record.test_type || ''}`,
          treatment: '',
          notes: `Result: ${record.result || 'Pending'} ${record.notes ? '| Notes: ' + record.notes : ''}`,
          createdByName: recordedByName || record.recordedByName || record.recorded_by_name || 'Staff',
          icon: <IconLab />
        });
      });
    }

    // 5. Services/Procedures with staff names
    if (servicesHistory && servicesHistory.length > 0) {
      servicesHistory.forEach(record => {
        const type = record.serviceType || record.service_type || 'service';
        const list = record.servicesList || record.services_list || '';
        const serviceLabel = type.charAt(0).toUpperCase() + type.slice(1);
        const recordedByName = getStaffName(record.recordedBy);
        
        allRecords.push({
          id: record.id || `srv-${Date.now()}-${Math.random()}`,
          visitDate: record.date || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: type === 'education' ? 'education' : 'service',
          diagnosis: `${serviceLabel} Service Provided`,
          servicesProvided: list || 'Service rendered',
          treatment: '',
          notes: '',
          createdByName: recordedByName || record.recordedByName || record.recorded_by_name || 'Staff',
          icon: type === 'education' ? <IconEducation /> : <IconService />,
          isService: true
        });
      });
    }

    // 6. Clothing provisions with staff names
    if (clothingHistory && clothingHistory.length > 0) {
      clothingHistory.forEach(record => {
        const details = [];
        if (record.clothes) details.push(`Clothes: ${record.clothes}`);
        if (record.shoes) details.push(`Shoes: ${record.shoes}`);
        const recordedByName = getStaffName(record.recordedBy);
        
        allRecords.push({
          id: record.id || `cloth-${Date.now()}-${Math.random()}`,
          visitDate: record.date || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: 'service',
          diagnosis: 'Clothing Provisions',
          servicesProvided: details.join(' | '),
          treatment: '',
          notes: '',
          createdByName: recordedByName || record.recordedByName || record.recorded_by_name || 'Staff',
          icon: <IconService />,
          isService: true
        });
      });
    }

    // 7. Symptoms/Assessment with staff names
    if (symptomsHistory && symptomsHistory.length > 0) {
      symptomsHistory.forEach(record => {
        let parsedNotes = { visitNotes: '', diagnosis: '', diagnosisNotes: '', hospitalized: false, timeHospitalized: '' };
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

        const notesParts = [];
        if (record.symptoms) notesParts.push(`Symptoms: ${record.symptoms}`);
        if (parsedNotes.visitNotes) notesParts.push(`Visit Notes: ${parsedNotes.visitNotes}`);
        if (parsedNotes.diagnosisNotes) notesParts.push(`Diagnosis Notes: ${parsedNotes.diagnosisNotes}`);
        if (parsedNotes.hospitalized) notesParts.push(`Hospitalized: ${parsedNotes.timeHospitalized || 'Yes'}`);
        
        const finalDiagnosis = parsedNotes.diagnosis || record.diagnosis || 'Assessment Performed';
        const recordedByName = getStaffName(record.recordedBy);
        
        allRecords.push({
          id: record.id || `assess-${Date.now()}-${Math.random()}`,
          visitDate: record.date || record.createdAt || new Date().toISOString().split('T')[0],
          recordType: 'assessment',
          diagnosis: finalDiagnosis,
          treatment: '',
          notes: notesParts.join(' | ') || 'Assessment recorded',
          createdByName: recordedByName || record.recordedByName || record.recorded_by_name || 'Staff',
          icon: <IconAssessment />
        });
      });
    }

    // Sort all records by date (chronological)
    allRecords.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));

    // Calculate visit numbers
    const recordsWithVisits = [];
    let currentVisitNumber = 0;
    let lastDate = '';

    // First pass: count unique dates
    const uniqueDates = new Set();
    allRecords.forEach(record => {
      const dateKey = new Date(record.visitDate).toISOString().split('T')[0];
      uniqueDates.add(dateKey);
    });
    const totalUniqueDates = uniqueDates.size;

    // Second pass: assign visit numbers
    allRecords.forEach(record => {
      const dateKey = new Date(record.visitDate).toISOString().split('T')[0];
      
      if (dateKey !== lastDate) {
        currentVisitNumber++;
        lastDate = dateKey;
      }
      
      const recordWithVisit = {
        ...record,
        visitNumber: currentVisitNumber,
        totalVisits: totalUniqueDates
      };
      
      recordsWithVisits.push(recordWithVisit);
    });

    // Sort by date (newest first) for display
    recordsWithVisits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
    
    return recordsWithVisits;
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
      setBaselineHistory([]);
    }
  }, [child]);

  // Re-combine records when location or staff names change
  useEffect(() => {
    if (child && child.id) {
      if (Object.keys(locationNames).length > 0 || Object.keys(staffNames).length > 0) {
        const records = combineChildRecords();
        setDisplayRecords(records);
      }
    }
  }, [locationNames, staffNames]);

  // Combine records when data changes
  useEffect(() => {
    if (child && child.id) {
      const records = combineChildRecords();
      setDisplayRecords(records);
    } else {
      setDisplayRecords([]);
    }
  }, [child, medicalRecords, vitalsHistory, medicationsHistory, testsHistory, servicesHistory, symptomsHistory, clothingHistory, baselineHistory]);

  // Get unique record types for filter
  const recordTypes = useMemo(() => {
    const types = new Set();
    displayRecords.forEach(record => {
      if (record.recordType) {
        types.add(record.recordType);
      }
    });
    return ['all', ...Array.from(types)];
  }, [displayRecords]);

  // Filter records
  const filteredRecords = useMemo(() => {
    let records = displayRecords;
    
    if (selectedFilter !== 'all') {
      records = records.filter(record => record.recordType === selectedFilter);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      records = records.filter(record => 
        record.diagnosis.toLowerCase().includes(term) ||
        record.treatment.toLowerCase().includes(term) ||
        record.servicesProvided?.toLowerCase().includes(term) ||
        record.notes.toLowerCase().includes(term) ||
        record.measurement?.toLowerCase().includes(term) ||
        record.createdByName.toLowerCase().includes(term) ||
        (record.isBaseline && record.baselineData?.fullName.toLowerCase().includes(term)) ||
        (record.isBaseline && record.baselineData?.kidId.toLowerCase().includes(term))
      );
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      records = records.filter(record => {
        const recordDate = new Date(record.visitDate);
        return recordDate >= fromDate;
      });
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      records = records.filter(record => {
        const recordDate = new Date(record.visitDate);
        return recordDate <= toDate;
      });
    }
    
    return records;
  }, [displayRecords, selectedFilter, searchTerm, dateFrom, dateTo]);

  // Get record type counts
  const getRecordTypeCounts = () => {
    const counts = {};
    displayRecords.forEach(record => {
      const type = record.recordType || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  };

  const recordCounts = getRecordTypeCounts();

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No records to export.');
      return;
    }

    const headers = ['Date', 'Type', 'Diagnosis', 'Treatment', 'Services Provided', 'Notes', 'Measurements', 'Visit #', 'Total Visits', 'Recorded By'];
    const rows = filteredRecords.map(record => [
      new Date(record.visitDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      getTypeLabel(record.recordType),
      record.diagnosis,
      record.treatment || '',
      record.servicesProvided || '',
      record.notes || '',
      record.measurement || '',
      record.visitNumber || '',
      record.totalVisits || '',
      record.createdByName || 'Staff'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `medical_history_${child?.fullName || 'patient'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilter('all');
    setDateFrom('');
    setDateTo('');
    setShowDateFilter(false);
  };

  // If no child selected
  if (!child || !child.id) {
    return (
      <div className="mr-all-history">
        <div className="mr-history-header-section">
          <h3><IconMedical /> Medical History</h3>
          <span className="mr-history-count">0 records</span>
        </div>
        <div className="mr-empty-state">
          <div className="mr-empty-icon-wrapper"><IconClipboard /></div>
          <h4>No Patient Selected</h4>
          <p>Please select a patient to view their complete medical history.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mr-all-history">
        <div className="mr-history-header-section">
          <div className="mr-history-title-wrapper">
            <h3><IconMedical /> Medical History</h3>
            <span className="mr-history-patient">{child.fullName || 'Patient'}</span>
          </div>
          <span className="mr-history-count">Loading...</span>
        </div>
        <div className="mr-loading-state">
          <div className="mr-spinner-wrapper"><IconSpinner /></div>
          <p>Loading medical records...</p>
        </div>
      </div>
    );
  }

  // Render Baseline Card
  const renderBaselineCard = (record) => {
    const data = record.baselineData;
    const isFirstVisit = record.visitNumber === 1;
    
    return (
      <div className="mr-baseline-card">
        <div className="mr-baseline-grid">
          <div className="mr-baseline-item">
            <span className="mr-baseline-label"><IconId /> Kid ID</span>
            <span className="mr-baseline-value">{data.kidId}</span>
          </div>
          <div className="mr-baseline-item">
            <span className="mr-baseline-label"><IconUserBadge /> Full Name</span>
            <span className="mr-baseline-value">{data.fullName}</span>
          </div>
          <div className="mr-baseline-item">
            <span className="mr-baseline-label"><IconGender /> Gender</span>
            <span className="mr-baseline-value">{data.gender}</span>
          </div>
          <div className="mr-baseline-item">
            <span className="mr-baseline-label"><IconAge /> Age</span>
            <span className="mr-baseline-value">{data.age}</span>
          </div>
          <div className="mr-baseline-item">
            <span className="mr-baseline-label"><IconCalendarCheck /> Visit Date</span>
            <span className="mr-baseline-value">{new Date(data.visitDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}</span>
          </div>
          <div className="mr-baseline-item">
            <span className="mr-baseline-label"><IconLocation /> Location</span>
            <span className="mr-baseline-value">{data.location}</span>
          </div>
        </div>
        <div className="mr-baseline-footer">
          <div className="mr-baseline-footer-left">
            <span className="mr-baseline-recorded-by">Recorded by: {data.recordedBy}</span>
          </div>
          <div className="mr-baseline-footer-right">
            <span className="mr-baseline-visit-count">
              <IconVisitCount /> Visit {record.visitNumber} of {record.totalVisits}
            </span>
            {isFirstVisit && <span className="mr-baseline-first-visit">First Visit</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mr-all-history" id="history-print-area">
      <div className="mr-history-header-section">
        <div className="mr-history-title-wrapper">
          <h3><IconMedical /> Medical History</h3>
          <span className="mr-history-patient">{child.fullName || 'Patient'}</span>
          <span className="mr-history-id">ID: {child.customSerialId || 'N/A'}</span>
        </div>
        <div className="mr-history-actions">
          <button className="mr-action-btn" onClick={() => setShowDateFilter(!showDateFilter)} title="Filter by date">
            <IconCalendar /> {showDateFilter ? 'Hide Date Filter' : 'Date Filter'}
          </button>
          <button className="mr-action-btn" onClick={handleExportCSV} title="Export to CSV">
            <IconDownload /> Export
          </button>
          <button className="mr-action-btn mr-print-btn" onClick={handlePrint} title="Print records">
            <IconPrint /> Print
          </button>
          <span className="mr-history-count">
            {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
          </span>
        </div>
      </div>
      
      {/* Summary Cards */}
      {displayRecords.length > 0 && (
        <div className="mr-history-summary-cards">
          {Object.entries(recordCounts).map(([type, count]) => (
            <div 
              key={type} 
              className={`mr-summary-card mr-summary-${type}`}
              onClick={() => setSelectedFilter(selectedFilter === type ? 'all' : type)}
            >
              <span className="mr-summary-icon">{getTypeIcon(type)}</span>
              <div className="mr-summary-info">
                <span className="mr-summary-count">{count}</span>
                <span className="mr-summary-label">{getTypeLabel(type)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Controls */}
      {displayRecords.length > 0 && (
        <div className="mr-history-controls">
          <div className="mr-search-wrapper">
            <span className="mr-search-icon"><IconSearch /></span>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mr-search-input"
            />
            {searchTerm && (
              <button className="mr-clear-search" onClick={() => setSearchTerm('')}>
                <IconClose />
              </button>
            )}
          </div>
          
          {/* Date Filter */}
          {showDateFilter && (
            <div className="mr-date-filter">
              <div className="mr-date-filter-group">
                <label>From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mr-date-input"
                />
              </div>
              <div className="mr-date-filter-group">
                <label>To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mr-date-input"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button className="mr-clear-date-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                  Clear Dates
                </button>
              )}
            </div>
          )}
          
          {/* Filter Buttons */}
          <div className="mr-filter-row">
            <div className="mr-filter-buttons">
              {recordTypes.map(type => (
                <button
                  key={type}
                  className={`mr-filter-btn ${selectedFilter === type ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(type)}
                >
                  {type === 'all' ? 'All' : getTypeLabel(type)}
                  {type !== 'all' && (
                    <span className="mr-filter-count">
                      {displayRecords.filter(r => r.recordType === type).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {(searchTerm || selectedFilter !== 'all' || dateFrom || dateTo) && (
              <button className="mr-clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Results */}
      {filteredRecords.length === 0 ? (
        <div className="mr-empty-state">
          <div className="mr-empty-icon-wrapper"><IconClipboard /></div>
          <h4>No Records Found</h4>
          <p>
            {searchTerm 
              ? `No records match your search "${searchTerm}". Try a different search term.`
              : selectedFilter !== 'all' 
                ? `No ${getTypeLabel(selectedFilter)} records found for this patient.`
                : dateFrom || dateTo
                  ? 'No records found in the selected date range.'
                  : 'No medical history records found for this patient.'
            }
          </p>
          {(searchTerm || selectedFilter !== 'all' || dateFrom || dateTo) && (
            <button className="mr-clear-filter-btn" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="mr-history-timeline">
          {filteredRecords.map((record, index) => (
            <div key={record.id || index} className="mr-timeline-item">
              <div className="mr-timeline-marker">
                <span className="mr-timeline-icon">{record.icon || getTypeIcon(record.recordType)}</span>
                <div className="mr-timeline-line"></div>
              </div>
              <div className="mr-history-card">
                <div className="mr-history-card-header">
                  <div className="mr-history-card-left">
                    <span className="mr-history-date">
                      {new Date(record.visitDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className={`mr-history-badge mr-badge-${record.recordType}`}>
                      {getTypeLabel(record.recordType)}
                    </span>
                    {record.visitNumber && (
                      <span className="mr-visit-badge">
                        Visit {record.visitNumber}/{record.totalVisits}
                      </span>
                    )}
                  </div>
                  <span className="mr-history-by">
                    <IconUser /> {record.createdByName || "Staff"}
                  </span>
                </div>
                <div className="mr-history-card-body">
                  {record.isBaseline ? (
                    renderBaselineCard(record)
                  ) : (
                    <>
                      <div className="mr-history-diagnosis">
                        <span className="mr-label">Diagnosis:</span>
                        <span className="mr-value">{record.diagnosis}</span>
                      </div>
                      
                      {/* For services, show "Services Provided" */}
                      {record.isService && record.servicesProvided && (
                        <div className="mr-history-services">
                          <span className="mr-label">Services Provided:</span>
                          <span className="mr-value">{record.servicesProvided}</span>
                        </div>
                      )}
                      
                      {/* For non-services, show treatment if it exists */}
                      {!record.isService && record.treatment && (
                        <div className="mr-history-treatment">
                          <span className="mr-label">Treatment:</span>
                          <span className="mr-value">{record.treatment}</span>
                        </div>
                      )}
                      
                      {record.notes && !record.isVitals && !record.isService && (
                        <div className="mr-history-notes">
                          <span className="mr-label">Notes:</span>
                          <span className="mr-value">{record.notes}</span>
                        </div>
                      )}
                      {record.measurement && (
                        <div className="mr-history-measurement">
                          <span className="mr-label">Measurements:</span>
                          <span className="mr-value">{record.measurement}</span>
                        </div>
                      )}
                      {record.notes && record.isVitals && (
                        <div className="mr-history-notes">
                          <span className="mr-label">Notes:</span>
                          <span className="mr-value">{record.notes}</span>
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
  );
};

export default AllHistory;