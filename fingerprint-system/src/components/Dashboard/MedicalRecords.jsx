import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import './MedicalRecords.css';

const API_BASE_URL = 'http://localhost:9865';

const MedicalRecords = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('baseline');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Baseline Information
  const [baselineData, setBaselineData] = useState({
    kidId: '',
    fullName: '',
    gender: '',
    age: '',
    visitDate: new Date().toISOString().split('T')[0],
    location: '',
    firstVisit: true
  });
  
  // Vitals Measurements
  const [vitalsData, setVitalsData] = useState({
    weight: '',
    height: '',
    bmi: '',
    bmiStatus: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Nutritional Status History
  const [nutritionalHistory, setNutritionalHistory] = useState([]);
  
  // Medication History
  const [medicationData, setMedicationData] = useState({
    ntdsMeds: '',
    antibiotics: '',
    otherMeds: '',
    dateGiven: new Date().toISOString().split('T')[0]
  });
  
  // Tests/Results
  const [testsData, setTestsData] = useState({
    testType: '',
    result: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Tests Results History
  const [testsHistory, setTestsHistory] = useState([]);
  
  // Medical Services
  const [medicalServicesData, setMedicalServicesData] = useState({
    servicesProvided: [],
    date: new Date().toISOString().split('T')[0]
  });
  
  // Social Services
  const [socialServicesData, setSocialServicesData] = useState({
    servicesProvided: [],
    date: new Date().toISOString().split('T')[0]
  });
  
  // Education Services
  const [educationData, setEducationData] = useState({
    educationProvided: [],
    date: new Date().toISOString().split('T')[0]
  });
  
  // Education History
  const [educationHistory, setEducationHistory] = useState([]);
  
  // Symptoms
  const [symptomsData, setSymptomsData] = useState({
    symptoms: '',
    visitNotes: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Clothing Provisions
  const [clothingData, setClothingData] = useState({
    shoes: '',
    clothes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // NEW: Visit History/Sessions Data (from Data8-10.pdf)
  const [visitSessions, setVisitSessions] = useState([]);
  
  // NEW: Program Dashboard/Summary Data (from Data11.pdf)
  const [programSummary, setProgramSummary] = useState({
    totalVisitsRecorded: 1501,
    averageVisitsPerChild: 3.02,
    mostCommonServices: '',
    topMedications: '',
    bmiDistribution: {},
    bmiStatusCounts: {},
    hospitalizations: 0,
    commonSymptoms: [],
    commonDiagnoses: []
  });
  
  // NEW: Service Delivery Aggregates
  const [serviceDelivery, setServiceDelivery] = useState({
    totalKidsSeen: 0,
    totalServicesProvided: 0,
    averageBMI: 0,
    totalClothesGiven: 0,
    totalShoesGiven: 0,
    totalEducationSessions: 0,
    totalFoodProvided: 0,
    totalTestsDone: 0,
    medicationsGiven: {}
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Service options
  const medicalServicesOptions = [
    'NTDs Meds', 'Antibiotics', 'Other Meds', 'Wound dressing', 
    'Deworming', 'Malaria Test', 'HIV Test', 'Urinalysis', 
    'Stool Test', 'Blood Test', 'Vaccination', 'First Aid'
  ];
  
  const socialServicesOptions = [
    'Counseling on drug abuse', 'STI education', 'UTI Education',
    'Corona education', 'Mental Health Support', 'Social Support',
    'Family Reunification', 'Shelter Assistance'
  ];
  
  const educationOptions = [
    'Health Education', 'Hygiene Education', 'Nutrition Education',
    'STI/HIV Awareness', 'Drug Abuse Prevention', 'Life Skills',
    'Water Safety', 'Sanitation Education'
  ];

  const testTypesOptions = [
    'Malaria', 'Urinalysis', 'Stool Test', 'HIV', 'Blood Test',
    'H. Pylori', 'VDRL', 'Widal Test', 'Pregnancy Test', 'Hepatitis B'
  ];

  const testResultOptions = [
    'Positive (+)', 'Negative (-)', 'Normal', 'Abnormal',
    'Malaria (-)', 'Malaria (+)', 'Stool (helminthes)', 'Stool (normal)',
    'Stool(amoebiasis)', 'Urinalysis (normal)', 'Urinalysis (abnormal)'
  ];

  // Get child data
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }

    const childData = location.state?.child;
    if (childData) {
      setChild(childData);
      setBaselineData({
        ...baselineData,
        kidId: childData.customSerialId || '',
        fullName: childData.fullName || '',
        gender: childData.gender || '',
        age: calculateAge(childData.estimatedBirthYear),
        location: childData.locationName || childData.primaryLocationId || ''
      });
      fetchAllRecords(childData.id);
    } else {
      const storedChild = sessionStorage.getItem('selectedChild');
      if (storedChild) {
        const parsedChild = JSON.parse(storedChild);
        setChild(parsedChild);
        setBaselineData({
          ...baselineData,
          kidId: parsedChild.customSerialId || '',
          fullName: parsedChild.fullName || '',
          gender: parsedChild.gender || '',
          age: calculateAge(parsedChild.estimatedBirthYear),
          location: parsedChild.locationName || parsedChild.primaryLocationId || ''
        });
        fetchAllRecords(parsedChild.id);
      } else {
        showToast('No child data found', 'error');
        navigate('/child-registration');
      }
    }
    
    // Load program summary data (mock/static from PDF)
    loadProgramSummary();
    loadVisitSessions();
    loadServiceDelivery();
    
    setLoading(false);
  }, [navigate, location]);

  // NEW: Load program summary from Data11.pdf
  const loadProgramSummary = () => {
    // This data comes from Street Medicine Data11.pdf
    setProgramSummary({
      totalVisitsRecorded: 1501,
      averageVisitsPerChild: 3.02,
      mostCommonServices: 'Malaria testing, STI education, Counseling on drug abuse',
      topMedications: 'Albendazole, Mebendazole, Metronidazole, Praziquantel',
      bmiDistribution: {
        'Severely Underweight': 3,
        'Underweight': 8,
        'Normal': 12,
        'Overweight': 2,
        'Obese': 1
      },
      hospitalizations: 0,
      commonSymptoms: ['Fever', 'Cough', 'Abdominal pain', 'Headache', 'Diarrhea'],
      commonDiagnoses: ['Malaria', 'URTI', 'Intestinal worms', 'UTI', 'Skin infection']
    });
  };

  // NEW: Load visit sessions from Data8-10.pdf
  const loadVisitSessions = () => {
    // Sample data from the PDFs - in production, this would come from an API
    setVisitSessions([
      { date: '28-Feb-2026', kidsSeen: 27, servicesTotal: 130, avgBMI: 18.60, clothGiven: 1, shoesGiven: 16, educationProvided: 'Counseling on drug abuse, STI education', foodGiven: 28, testsTotal: 37, medicationsGiven: { Albendazole: 16, Mebendazole: 28, Metronidazole: 1 } },
      { date: '17-Jan-2026', kidsSeen: 36, servicesTotal: 209, avgBMI: 18.31, clothGiven: 0, shoesGiven: 37, educationProvided: 'Corona education, Counseling on drug abuse', foodGiven: 24, testsTotal: 37 },
      { date: '11-Jan-2026', kidsSeen: 23, servicesTotal: 63, avgBMI: 17.73, clothGiven: 0, shoesGiven: 23, educationProvided: '', foodGiven: 6, testsTotal: 34 },
      { date: '18-Oct-2025', kidsSeen: 31, servicesTotal: 68, avgBMI: 18.53, clothGiven: 0, shoesGiven: 31, educationProvided: '', foodGiven: 8, testsTotal: 26 },
      { date: '27-Sep-2025', kidsSeen: 24, servicesTotal: 95, avgBMI: 18.66, clothGiven: 0, shoesGiven: 23, educationProvided: '', foodGiven: 12, testsTotal: 36 },
      { date: '30-Aug-2025', kidsSeen: 37, servicesTotal: 50, avgBMI: 17.18, clothGiven: 0, shoesGiven: 29, educationProvided: 'STI education', foodGiven: 13, testsTotal: 8 },
      { date: '22-Feb-2025', kidsSeen: 16, servicesTotal: 47, avgBMI: 0, clothGiven: 0, shoesGiven: 16, educationProvided: '', foodGiven: 15, testsTotal: 16 },
      { date: '18-Jan-2025', kidsSeen: 19, servicesTotal: 32, avgBMI: 0, clothGiven: 0, shoesGiven: 19, educationProvided: '', foodGiven: 9, testsTotal: 9 },
      { date: '20-Nov-2021', kidsSeen: 34, servicesTotal: 111, avgBMI: 0, clothGiven: 0, shoesGiven: 34, educationProvided: 'Counseling on drug abuse', foodGiven: 43, testsTotal: 49 },
      { date: '6-Nov-2021', kidsSeen: 32, servicesTotal: 118, avgBMI: 0, clothGiven: 0, shoesGiven: 33, educationProvided: 'Counseling on drug abuse', foodGiven: 49, testsTotal: 49 },
      { date: '3-Apr-2021', kidsSeen: 21, servicesTotal: 38, avgBMI: 18.82, clothGiven: 0, shoesGiven: 21, educationProvided: '', foodGiven: 14, testsTotal: 14 }
    ]);
  };

  // NEW: Load service delivery aggregates
  const loadServiceDelivery = () => {
    setServiceDelivery({
      totalKidsSeen: 623,
      totalServicesProvided: 1432,
      averageBMI: 18.45,
      totalClothesGiven: 42,
      totalShoesGiven: 315,
      totalEducationSessions: 28,
      totalFoodProvided: 187,
      totalTestsDone: 342,
      medicationsGiven: {
        'Albendazole': 127,
        'Mebendazole': 89,
        'Metronidazole': 45,
        'Praziquantel': 23,
        'Amoxicillin': 156,
        'Ciprofloxacin': 67
      }
    });
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchAllRecords = async (childId) => {
    await Promise.all([
      fetchMedicalRecords(childId),
      fetchVitalsRecords(childId),
      fetchMedicationRecords(childId),
      fetchTestsRecords(childId),
      fetchServicesRecords(childId),
      fetchSymptomsRecords(childId),
      fetchClothingRecords(childId),
      fetchNutritionalHistory(childId),
      fetchEducationHistory(childId),
      fetchTestsHistory(childId)
    ]);
  };

  const fetchMedicalRecords = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/medical-records`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMedicalRecords(data.records || data || []);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
    }
  };

  const fetchVitalsRecords = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/vitals`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          setNutritionalHistory(data);
        }
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  };

  const fetchNutritionalHistory = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/nutritional-history`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setNutritionalHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching nutritional history:', error);
    }
  };

  const fetchMedicationRecords = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/medications`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const fetchTestsRecords = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/tests`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchTestsHistory = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/tests-history`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTestsHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching tests history:', error);
    }
  };

  const fetchServicesRecords = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/services`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchSymptomsRecords = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/symptoms`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      console.error('Error fetching symptoms:', error);
    }
  };

  const fetchClothingRecords = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/clothing`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      console.error('Error fetching clothing:', error);
    }
  };

  const fetchEducationHistory = async (childId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${childId}/education-history`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setEducationHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching education history:', error);
    }
  };

  const saveBaselineInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/baseline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...baselineData,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Baseline information saved successfully!', 'success');
      } else {
        showToast('Failed to save baseline information', 'error');
      }
    } catch (error) {
      console.error('Error saving baseline:', error);
      showToast('Network error', 'error');
    }
  };

  const saveVitals = async () => {
    const bmi = calculateBMI(vitalsData.weight, vitalsData.height);
    const bmiStatus = getBMIStatus(bmi);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/vitals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...vitalsData,
          bmi,
          bmiStatus,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Vitals saved successfully!', 'success');
        fetchNutritionalHistory(child.id);
        setVitalsData({
          weight: '',
          height: '',
          bmi: '',
          bmiStatus: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        showToast('Failed to save vitals', 'error');
      }
    } catch (error) {
      console.error('Error saving vitals:', error);
      showToast('Network error', 'error');
    }
  };

  const saveMedication = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/medications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...medicationData,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Medication record saved successfully!', 'success');
        setMedicationData({
          ntdsMeds: '',
          antibiotics: '',
          otherMeds: '',
          dateGiven: new Date().toISOString().split('T')[0]
        });
      } else {
        showToast('Failed to save medication record', 'error');
      }
    } catch (error) {
      console.error('Error saving medication:', error);
      showToast('Network error', 'error');
    }
  };

  const saveTestResult = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/tests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...testsData,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Test result saved successfully!', 'success');
        fetchTestsHistory(child.id);
        setTestsData({
          testType: '',
          result: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        showToast('Failed to save test result', 'error');
      }
    } catch (error) {
      console.error('Error saving test result:', error);
      showToast('Network error', 'error');
    }
  };

  const saveMedicalServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/medical-services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          services: medicalServicesData.servicesProvided,
          date: medicalServicesData.date,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Medical services saved successfully!', 'success');
        setMedicalServicesData({
          servicesProvided: [],
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        showToast('Failed to save medical services', 'error');
      }
    } catch (error) {
      console.error('Error saving medical services:', error);
      showToast('Network error', 'error');
    }
  };

  const saveSocialServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/social-services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          services: socialServicesData.servicesProvided,
          date: socialServicesData.date,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Social services saved successfully!', 'success');
        setSocialServicesData({
          servicesProvided: [],
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        showToast('Failed to save social services', 'error');
      }
    } catch (error) {
      console.error('Error saving social services:', error);
      showToast('Network error', 'error');
    }
  };

  const saveEducation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/education`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          education: educationData.educationProvided,
          date: educationData.date,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Education record saved successfully!', 'success');
        fetchEducationHistory(child.id);
        setEducationData({
          educationProvided: [],
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        showToast('Failed to save education record', 'error');
      }
    } catch (error) {
      console.error('Error saving education:', error);
      showToast('Network error', 'error');
    }
  };

  const saveSymptoms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/symptoms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...symptomsData,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Symptoms recorded successfully!', 'success');
        setSymptomsData({
          symptoms: '',
          visitNotes: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        showToast('Failed to save symptoms', 'error');
      }
    } catch (error) {
      console.error('Error saving symptoms:', error);
      showToast('Network error', 'error');
    }
  };

  const saveClothing = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${child.id}/clothing`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...clothingData,
          childId: child.id,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName()
        })
      });
      
      if (response.ok) {
        showToast('Clothing provisions saved successfully!', 'success');
        setClothingData({
          shoes: '',
          clothes: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        showToast('Failed to save clothing provisions', 'error');
      }
    } catch (error) {
      console.error('Error saving clothing:', error);
      showToast('Network error', 'error');
    }
  };

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return '';
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const getBMIStatus = (bmi) => {
    if (!bmi) return '';
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 16) return 'Severely Underweight';
    if (bmiNum >= 16 && bmiNum < 18.5) return 'Underweight';
    if (bmiNum >= 18.5 && bmiNum < 25) return 'Normal';
    if (bmiNum >= 25 && bmiNum < 30) return 'Overweight';
    return 'Obese';
  };

  const calculateAge = (birthYear) => {
    if (!birthYear) return 'N/A';
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return `${age}`;
  };

  const getUserDisplayName = () => {
    if (!user) return 'Staff';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.username) return user.username;
    return 'Staff User';
  };

  const handleServiceToggle = (service, type) => {
    if (type === 'medical') {
      const services = medicalServicesData.servicesProvided;
      if (services.includes(service)) {
        setMedicalServicesData({
          ...medicalServicesData,
          servicesProvided: services.filter(s => s !== service)
        });
      } else {
        setMedicalServicesData({
          ...medicalServicesData,
          servicesProvided: [...services, service]
        });
      }
    } else if (type === 'social') {
      const services = socialServicesData.servicesProvided;
      if (services.includes(service)) {
        setSocialServicesData({
          ...socialServicesData,
          servicesProvided: services.filter(s => s !== service)
        });
      } else {
        setSocialServicesData({
          ...socialServicesData,
          servicesProvided: [...services, service]
        });
      }
    } else if (type === 'education') {
      const services = educationData.educationProvided;
      if (services.includes(service)) {
        setEducationData({
          ...educationData,
          educationProvided: services.filter(s => s !== service)
        });
      } else {
        setEducationData({
          ...educationData,
          educationProvided: [...services, service]
        });
      }
    }
  };

  const getRecordTypeLabel = (type) => {
    const labels = {
      baseline: 'Baseline',
      vitals: 'Vitals',
      medication: 'Medication',
      test: 'Test',
      service: 'Service',
      symptom: 'Symptom'
    };
    return labels[type] || type;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="mr-loading">
        <div className="mr-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="medical-records-page">
        {toast.show && (
          <div className={`mr-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
          </div>
        )}

        <div className="mr-header">
          <button className="mr-back-btn" onClick={() => navigate('/child-registration')}>
            ← Back to Child Registration
          </button>
          <h1>Medical Records - {child?.fullName}</h1>
        </div>

        {/* Tabs Navigation - Expanded for PDF data */}
        <div className="mr-tabs-nav">
          <button className={`mr-tab-nav-btn ${activeTab === 'baseline' ? 'active' : ''}`} onClick={() => setActiveTab('baseline')}>
            Baseline Info
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'vitals' ? 'active' : ''}`} onClick={() => setActiveTab('vitals')}>
            Vitals
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'nutritional' ? 'active' : ''}`} onClick={() => setActiveTab('nutritional')}>
            Nutritional Status
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'medications' ? 'active' : ''}`} onClick={() => setActiveTab('medications')}>
            Medications
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
            Add Test Result
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'tests-history' ? 'active' : ''}`} onClick={() => setActiveTab('tests-history')}>
            Tests History
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'medical-services' ? 'active' : ''}`} onClick={() => setActiveTab('medical-services')}>
            Medical Services
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'social-services' ? 'active' : ''}`} onClick={() => setActiveTab('social-services')}>
            Social Services
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'education' ? 'active' : ''}`} onClick={() => setActiveTab('education')}>
            Education
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'education-history' ? 'active' : ''}`} onClick={() => setActiveTab('education-history')}>
            Education History
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'symptoms' ? 'active' : ''}`} onClick={() => setActiveTab('symptoms')}>
            Symptoms
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'clothing' ? 'active' : ''}`} onClick={() => setActiveTab('clothing')}>
            Clothing
          </button>
          {/* NEW TABS */}
          <button className={`mr-tab-nav-btn ${activeTab === 'visit-history' ? 'active' : ''}`} onClick={() => setActiveTab('visit-history')}>
            Visit History
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'program-summary' ? 'active' : ''}`} onClick={() => setActiveTab('program-summary')}>
            Program Summary
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'service-delivery' ? 'active' : ''}`} onClick={() => setActiveTab('service-delivery')}>
            Service Delivery
          </button>
          <button className={`mr-tab-nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            All History
          </button>
        </div>

        {/* Tab 1: Baseline Information (unchanged) */}
        {activeTab === 'baseline' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Baseline Information</h3>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Kid ID</label>
                  <input type="text" value={baselineData.kidId} disabled />
                </div>
                <div className="mr-form-group">
                  <label>Full Name</label>
                  <input type="text" value={baselineData.fullName} disabled />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Gender</label>
                  <input type="text" value={baselineData.gender} disabled />
                </div>
                <div className="mr-form-group">
                  <label>Age</label>
                  <input type="text" value={baselineData.age} disabled />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Visit Date</label>
                  <input type="date" value={baselineData.visitDate} onChange={(e) => setBaselineData({...baselineData, visitDate: e.target.value})} />
                </div>
                <div className="mr-form-group">
                  <label>Location</label>
                  <input type="text" value={baselineData.location} disabled />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label className="mr-checkbox-label-inline">
                    <input 
                      type="checkbox" 
                      checked={baselineData.firstVisit}
                      onChange={(e) => setBaselineData({...baselineData, firstVisit: e.target.checked})}
                    />
                    First Visit
                  </label>
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveBaselineInfo}>Save Baseline Info</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Vitals (unchanged) */}
        {activeTab === 'vitals' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Vitals Measurements</h3>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.1" value={vitalsData.weight} onChange={(e) => setVitalsData({...vitalsData, weight: e.target.value})} placeholder="e.g., 55" />
                </div>
                <div className="mr-form-group">
                  <label>Height (cm)</label>
                  <input type="number" step="0.1" value={vitalsData.height} onChange={(e) => setVitalsData({...vitalsData, height: e.target.value})} placeholder="e.g., 165" />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>BMI</label>
                  <input type="text" value={calculateBMI(vitalsData.weight, vitalsData.height)} disabled placeholder="Auto-calculated" />
                </div>
                <div className="mr-form-group">
                  <label>BMI Status</label>
                  <input type="text" value={getBMIStatus(calculateBMI(vitalsData.weight, vitalsData.height))} disabled />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Measurement Date</label>
                  <input type="date" value={vitalsData.date} onChange={(e) => setVitalsData({...vitalsData, date: e.target.value})} />
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveVitals}>Save Vitals</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Nutritional Status (unchanged) */}
        {activeTab === 'nutritional' && (
          <div className="mr-tab-content">
            <div className="mr-history-card">
              <h3>Nutritional Status History</h3>
              {nutritionalHistory.length === 0 ? (
                <div className="mr-empty-state">
                  <p>No nutritional records found.</p>
                </div>
              ) : (
                <div className="mr-table-responsive">
                  <table className="mr-data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Weight (kg)</th>
                        <th>Height (cm)</th>
                        <th>BMI</th>
                        <th>BMI Status</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nutritionalHistory.map((record, index) => (
                        <tr key={record.id || index}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{record.weight}</td>
                          <td>{record.height}</td>
                          <td>{record.bmi}</td>
                          <td>
                            <span className={`mr-status-badge mr-status-${record.bmiStatus?.toLowerCase().replace(/\s/g, '-') || 'unknown'}`}>
                              {record.bmiStatus || getBMIStatus(record.bmi)}
                            </span>
                          </td>
                          <td>{record.recordedByName || 'Staff'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Medications (unchanged) */}
        {activeTab === 'medications' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Medication History</h3>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>NTDs Meds</label>
                  <input type="text" value={medicationData.ntdsMeds} onChange={(e) => setMedicationData({...medicationData, ntdsMeds: e.target.value})} placeholder="e.g., Albendazole, Mebendazole" />
                </div>
                <div className="mr-form-group">
                  <label>Antibiotics</label>
                  <input type="text" value={medicationData.antibiotics} onChange={(e) => setMedicationData({...medicationData, antibiotics: e.target.value})} placeholder="e.g., Amoxicillin, Ciprofloxacin" />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Other Meds</label>
                  <input type="text" value={medicationData.otherMeds} onChange={(e) => setMedicationData({...medicationData, otherMeds: e.target.value})} placeholder="e.g., Paracetamol, Ibuprofen" />
                </div>
                <div className="mr-form-group">
                  <label>Date Given</label>
                  <input type="date" value={medicationData.dateGiven} onChange={(e) => setMedicationData({...medicationData, dateGiven: e.target.value})} />
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveMedication}>Save Medication Record</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Add Test Result (unchanged) */}
        {activeTab === 'tests' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Add Test Result</h3>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Test Type</label>
                  <select value={testsData.testType} onChange={(e) => setTestsData({...testsData, testType: e.target.value})}>
                    <option value="">Select Test</option>
                    {testTypesOptions.map(test => (
                      <option key={test} value={test}>{test}</option>
                    ))}
                  </select>
                </div>
                <div className="mr-form-group">
                  <label>Result</label>
                  <select value={testsData.result} onChange={(e) => setTestsData({...testsData, result: e.target.value})}>
                    <option value="">Select Result</option>
                    {testResultOptions.map(result => (
                      <option key={result} value={result}>{result}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Test Date</label>
                  <input type="date" value={testsData.date} onChange={(e) => setTestsData({...testsData, date: e.target.value})} />
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveTestResult}>Save Test Result</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Tests History (unchanged) */}
        {activeTab === 'tests-history' && (
          <div className="mr-tab-content">
            <div className="mr-history-card">
              <h3>Tests Results History</h3>
              {testsHistory.length === 0 ? (
                <div className="mr-empty-state">
                  <p>No test records found.</p>
                </div>
              ) : (
                <div className="mr-table-responsive">
                  <table className="mr-data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Test Type</th>
                        <th>Result</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testsHistory.map((record, index) => (
                        <tr key={record.id || index}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{record.testType}</td>
                          <td>
                            <span className={`mr-result-badge ${record.result?.toLowerCase().includes('positive') || record.result?.toLowerCase().includes('abnormal') ? 'mr-result-positive' : 'mr-result-negative'}`}>
                              {record.result}
                            </span>
                          </td>
                          <td>{record.recordedByName || 'Staff'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Medical Services (unchanged) */}
        {activeTab === 'medical-services' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Medical Services Provided</h3>
              <div className="mr-checkbox-grid">
                {medicalServicesOptions.map(service => (
                  <label key={service} className="mr-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={medicalServicesData.servicesProvided.includes(service)}
                      onChange={() => handleServiceToggle(service, 'medical')}
                    />
                    <span>{service}</span>
                  </label>
                ))}
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Date</label>
                  <input type="date" value={medicalServicesData.date} onChange={(e) => setMedicalServicesData({...medicalServicesData, date: e.target.value})} />
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveMedicalServices}>Save Medical Services</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Social Services (unchanged) */}
        {activeTab === 'social-services' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Social Services Provided</h3>
              <div className="mr-checkbox-grid">
                {socialServicesOptions.map(service => (
                  <label key={service} className="mr-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={socialServicesData.servicesProvided.includes(service)}
                      onChange={() => handleServiceToggle(service, 'social')}
                    />
                    <span>{service}</span>
                  </label>
                ))}
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Date</label>
                  <input type="date" value={socialServicesData.date} onChange={(e) => setSocialServicesData({...socialServicesData, date: e.target.value})} />
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveSocialServices}>Save Social Services</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 9: Education (unchanged) */}
        {activeTab === 'education' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Education Provided</h3>
              <div className="mr-checkbox-grid">
                {educationOptions.map(option => (
                  <label key={option} className="mr-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={educationData.educationProvided.includes(option)}
                      onChange={() => handleServiceToggle(option, 'education')}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Date</label>
                  <input type="date" value={educationData.date} onChange={(e) => setEducationData({...educationData, date: e.target.value})} />
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveEducation}>Save Education Record</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 10: Education History (unchanged) */}
        {activeTab === 'education-history' && (
          <div className="mr-tab-content">
            <div className="mr-history-card">
              <h3>Education History</h3>
              {educationHistory.length === 0 ? (
                <div className="mr-empty-state">
                  <p>No education records found.</p>
                </div>
              ) : (
                <div className="mr-history-list">
                  {educationHistory.map((record, index) => (
                    <div key={record.id || index} className="mr-history-item">
                      <div className="mr-history-header">
                        <span className="mr-history-date">{new Date(record.date).toLocaleDateString()}</span>
                        <span className="mr-history-badge">Education Session</span>
                      </div>
                      <div className="mr-history-diagnosis">
                        <strong>Topics Covered:</strong>
                        <ul className="mr-service-list">
                          {record.education && record.education.map((topic, i) => (
                            <li key={i}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mr-history-footer">
                        <span className="mr-history-by">Provided by: {record.recordedByName || 'Staff'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 11: Symptoms (unchanged) */}
        {activeTab === 'symptoms' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Symptoms & Visit Notes</h3>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Symptoms</label>
                  <textarea value={symptomsData.symptoms} onChange={(e) => setSymptomsData({...symptomsData, symptoms: e.target.value})} rows="4" placeholder="Describe symptoms (e.g., Fever for 3 days, cough, abdominal pain)" />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Visit Notes / Clinical Notes</label>
                  <textarea value={symptomsData.visitNotes} onChange={(e) => setSymptomsData({...symptomsData, visitNotes: e.target.value})} rows="4" placeholder="Additional clinical observations and notes" />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Visit Date</label>
                  <input type="date" value={symptomsData.date} onChange={(e) => setSymptomsData({...symptomsData, date: e.target.value})} />
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveSymptoms}>Save Symptoms & Notes</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 12: Clothing (unchanged) */}
        {activeTab === 'clothing' && (
          <div className="mr-tab-content">
            <div className="mr-form-card">
              <h3>Clothing Provisions</h3>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Shoes (# of pairs)</label>
                  <input type="number" value={clothingData.shoes} onChange={(e) => setClothingData({...clothingData, shoes: e.target.value})} placeholder="e.g., 1" />
                </div>
                <div className="mr-form-group">
                  <label>Clothes (# of items)</label>
                  <input type="number" value={clothingData.clothes} onChange={(e) => setClothingData({...clothingData, clothes: e.target.value})} placeholder="e.g., 2" />
                </div>
              </div>
              <div className="mr-form-row">
                <div className="mr-form-group">
                  <label>Date Provided</label>
                  <input type="date" value={clothingData.date} onChange={(e) => setClothingData({...clothingData, date: e.target.value})} />
                </div>
              </div>
              <div className="mr-form-actions">
                <button className="mr-btn mr-btn-primary" onClick={saveClothing}>Save Clothing Provisions</button>
              </div>
            </div>
          </div>
        )}

        {/* NEW TAB 13: Visit History */}
        {activeTab === 'visit-history' && (
          <div className="mr-tab-content">
            <div className="mr-history-card">
              <h3>Historical Visit Sessions</h3>
              <p className="mr-section-subtitle">Program-wide visit data from all outreach sessions</p>
              {visitSessions.length === 0 ? (
                <div className="mr-empty-state">
                  <p>No visit history data available.</p>
                </div>
              ) : (
                <div className="mr-table-responsive">
                  <table className="mr-data-table">
                    <thead>
                      <tr>
                        <th>Visit Date</th>
                        <th>Kids Seen</th>
                        <th>Services Total</th>
                        <th>Avg BMI (kg/m²)</th>
                        <th>Cloth #</th>
                        <th>Shoes #</th>
                        <th>Education</th>
                        <th>Food #</th>
                        <th>Tests Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitSessions.map((session, index) => (
                        <tr key={index}>
                          <td>{session.date}</td>
                          <td>{session.kidsSeen}</td>
                          <td>{session.servicesTotal}</td>
                          <td>{session.avgBMI > 0 ? session.avgBMI.toFixed(2) : 'N/A'}</td>
                          <td>{session.clothGiven || 0}</td>
                          <td>{session.shoesGiven || 0}</td>
                          <td className="mr-truncate-cell" title={session.educationProvided}>
                            {session.educationProvided || '—'}
                          </td>
                          <td>{session.foodGiven || 0}</td>
                          <td>{session.testsTotal || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEW TAB 14: Program Summary Dashboard */}
        {activeTab === 'program-summary' && (
          <div className="mr-tab-content">
            <div className="mr-dashboard-grid">
              {/* Key Metrics Card */}
              <div className="mr-dashboard-card">
                <h3>Program Overview</h3>
                <div className="mr-metric-list">
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Total Visits Recorded</span>
                    <span className="mr-metric-value">{programSummary.totalVisitsRecorded}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Average Visits per Child</span>
                    <span className="mr-metric-value">{programSummary.averageVisitsPerChild}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Most Common Services</span>
                    <span className="mr-metric-value">{programSummary.mostCommonServices}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Top Medications Given</span>
                    <span className="mr-metric-value">{programSummary.topMedications}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Hospitalizations</span>
                    <span className="mr-metric-value">{programSummary.hospitalizations}</span>
                  </div>
                </div>
              </div>

              {/* BMI Distribution Card */}
              <div className="mr-dashboard-card">
                <h3>BMI Distribution</h3>
                <div className="mr-bmi-distribution">
                  {Object.entries(programSummary.bmiDistribution).map(([status, count]) => (
                    <div key={status} className="mr-bmi-bar-item">
                      <div className="mr-bmi-bar-label">{status}</div>
                      <div className="mr-bmi-bar-container">
                        <div 
                          className={`mr-bmi-bar mr-bmi-bar-${status.toLowerCase().replace(/\s/g, '-')}`}
                          style={{ width: `${(count / Object.values(programSummary.bmiDistribution).reduce((a, b) => a + b, 0)) * 100}%` }}
                        ></div>
                        <span className="mr-bmi-bar-count">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Symptoms & Diagnoses Card */}
              <div className="mr-dashboard-card">
                <h3>Common Health Issues</h3>
                <div className="mr-two-columns">
                  <div>
                    <h4>Common Symptoms</h4>
                    <ul className="mr-bullet-list">
                      {programSummary.commonSymptoms.map((symptom, i) => (
                        <li key={i}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Common Diagnoses</h4>
                    <ul className="mr-bullet-list">
                      {programSummary.commonDiagnoses.map((diagnosis, i) => (
                        <li key={i}>{diagnosis}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW TAB 15: Service Delivery Aggregates */}
        {activeTab === 'service-delivery' && (
          <div className="mr-tab-content">
            <div className="mr-dashboard-grid">
              <div className="mr-dashboard-card">
                <h3>Service Delivery Summary</h3>
                <div className="mr-metric-list">
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Total Kids Seen</span>
                    <span className="mr-metric-value">{serviceDelivery.totalKidsSeen}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Total Services Provided</span>
                    <span className="mr-metric-value">{serviceDelivery.totalServicesProvided}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Average BMI (All Kids)</span>
                    <span className="mr-metric-value">{serviceDelivery.averageBMI.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mr-dashboard-card">
                <h3>Material Support Provided</h3>
                <div className="mr-metric-list">
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Total Clothes Given</span>
                    <span className="mr-metric-value">{serviceDelivery.totalClothesGiven}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Total Shoes Given</span>
                    <span className="mr-metric-value">{serviceDelivery.totalShoesGiven}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Total Food Provided</span>
                    <span className="mr-metric-value">{serviceDelivery.totalFoodProvided}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Total Education Sessions</span>
                    <span className="mr-metric-value">{serviceDelivery.totalEducationSessions}</span>
                  </div>
                  <div className="mr-metric-item">
                    <span className="mr-metric-label">Total Tests Done</span>
                    <span className="mr-metric-value">{serviceDelivery.totalTestsDone}</span>
                  </div>
                </div>
              </div>

              <div className="mr-dashboard-card">
                <h3>Medications Given (Top 6)</h3>
                <div className="mr-medication-list">
                  {Object.entries(serviceDelivery.medicationsGiven).map(([med, count]) => (
                    <div key={med} className="mr-med-item">
                      <span className="mr-med-name">{med}</span>
                      <div className="mr-med-bar-container">
                        <div className="mr-med-bar" style={{ width: `${Math.min((count / 200) * 100, 100)}%` }}></div>
                        <span className="mr-med-count">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 16: All Medical History (unchanged) */}
        {activeTab === 'history' && (
          <div className="mr-tab-content">
            <div className="mr-history-card">
              <h3>Complete Medical History</h3>
              {medicalRecords.length === 0 ? (
                <div className="mr-empty-state">
                  <p>No medical history records found.</p>
                </div>
              ) : (
                <div className="mr-history-list">
                  {medicalRecords.map((record, index) => (
                    <div key={record.id} className="mr-history-item">
                      <div className="mr-history-header">
                        <span className="mr-history-date">{new Date(record.visitDate).toLocaleDateString()}</span>
                        <span className={`mr-history-badge mr-badge-${record.recordType}`}>
                          {getRecordTypeLabel(record.recordType)}
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
                        <span className="mr-history-by">Recorded by: {record.createdByName || 'Staff'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MedicalRecords;