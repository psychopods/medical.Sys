import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "./Layout";
import "./MedicalRecords.css";
import "./MedicalRecords/tabs/PatientSelector.css"

// Import all tab components from index
import * as Tabs from "./MedicalRecords/tabs";

import { API_ENDPOINTS, API_BASE_URL } from "../../config/endpoints.js";
import * as api from "../../services/api.js";

// SVG Icons
const PatientIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="M12 3v8" />
    <path d="M8 7h8" />
  </svg>
);

// Loading Spinner Icon for Buttons
const LoadingSpinner = () => (
  <svg className="mr-btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// Patient Selector Page Component
const PatientSelectorPage = ({ 
  isLoadingPatients, 
  patientSearchTerm, 
  filteredPatients, 
  allPatients, 
  handlePatientSearch, 
  handleSelectPatient, 
  navigate,
  calculateAge 
}) => {
  const patientCount = useMemo(() => filteredPatients.length, [filteredPatients]);
  const totalPatients = useMemo(() => allPatients.length, [allPatients]);

  if (isLoadingPatients) {
    return (
      <div className="mr-loading-page">
        <div className="mr-spinner"></div>
        <p>Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="mr-patient-selector-page">
      <div className="mr-patient-selector-header-page">
        <div className="mr-header-top">
          <div>
            <h1>
              <span className="mr-header-icon"><PatientIcon /></span>
              Select a Patient
            </h1>
            <p>Search for a patient to add medical records. You can also register a new patient.</p>
          </div>
          <div className="mr-actions">
            <button 
              className="mr-btn mr-btn-primary"
              onClick={() => navigate("/child-registration")}
            >
              + Register New Patient
            </button>
          </div>
        </div>
      </div>

      <div className="mr-patient-search-section">
        <div className="mr-search-input-wrapper-page">
          <span className="mr-search-icon"><SearchIcon /></span>
          <input
            type="text"
            id="patient-search-input"
            placeholder="Search by name or ID..."
            value={patientSearchTerm}
            onChange={handlePatientSearch}
            className="mr-search-input-page"
            autoFocus
          />
        </div>
        <div className="mr-search-stats-page">
          Showing <strong>{patientCount}</strong> of <strong>{totalPatients}</strong> patients
        </div>
      </div>

      <div className="mr-patient-grid">
        {filteredPatients.length === 0 ? (
          <div className="mr-empty-state-page">
            <span className="mr-empty-icon"><EmptyIcon /></span>
            <h3>No Patients Found</h3>
            <p>No patients match your search criteria. Register a new patient to get started.</p>
            <button 
              className="mr-btn-primary"
              onClick={() => navigate("/child-registration")}
            >
              Register New Patient
            </button>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div 
              key={patient.id} 
              className="mr-patient-card"
            >
              <div className="mr-patient-avatar-card">
                {patient.image1 ? (
                  <img src={patient.image1} alt={patient.fullName} />
                ) : (
                  <span>{patient.fullName?.charAt(0) || "?"}</span>
                )}
              </div>
              <div className="mr-patient-info-card">
                <div className="mr-patient-name-card">
                  {patient.fullName}
                  <span className="mr-patient-id-badge-card">
                    {patient.customSerialId || "N/A"}
                  </span>
                </div>
                <div className="mr-patient-details-card">
                  <span className="mr-detail-item">
                    Age: {calculateAge(patient.estimatedBirthYear)}
                  </span>
                  <span className="mr-detail-dot">|</span>
                  <span className={`mr-gender-badge-card ${
                    patient.gender === 'Male' ? 'mr-gender-male-card' : 
                    patient.gender === 'Female' ? 'mr-gender-female-card' : 
                    'mr-gender-other-card'
                  }`}>
                    {patient.gender || "N/A"}
                  </span>
                  <span className="mr-detail-dot">|</span>
                  <span className={`mr-fingerprint-status-card ${
                    patient.hasFingerprints ? 'has-fingerprint' : 'no-fingerprint'
                  }`}>
                    {patient.hasFingerprints ? 'Fingerprints Captured' : 'No Fingerprints'}
                  </span>
                </div>
              </div>
              <button 
                className="mr-btn-select-card"
                onClick={() => handleSelectPatient(patient)}
              >
                Select
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MedicalRecords = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("baseline");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const toastTimeoutRef = useRef(null);

  // Loading states for each save action
  const [savingBaseline, setSavingBaseline] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [savingMedicalServices, setSavingMedicalServices] = useState(false);
  const [savingSocialServices, setSavingSocialServices] = useState(false);
  const [savingOthers, setSavingOthers] = useState(false);

  // Offline and Sync States
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [syncState, setSyncState] = useState({
    state: "idle",
    message: "Ready",
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // All data states
  const [baselineData, setBaselineData] = useState({
    kidId: "",
    fullName: "",
    gender: "",
    age: "",
    visitDate: new Date().toISOString().split("T")[0],
    location: "",
    firstVisit: true,
  });

  const [vitalsData, setVitalsData] = useState({
    weight: "",
    height: "",
    bmi: "",
    bmiStatus: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Combined Medical Services Data (Medications + Tests + Procedures)
  const [medicalServicesData, setMedicalServicesData] = useState({
    medications: {
      ntdsMeds: [],
      antibiotics: [],
      otherMeds: [],
    },
    tests: {
      testTypes: [],
      results: [],
      notes: "",
    },
    procedures: [],
    date: new Date().toISOString().split("T")[0],
  });

  // Combined Social Services Data (Clothing + Shoes + Education + Food + Other)
  const [socialServicesData, setSocialServicesData] = useState({
    clothing: {
      clothes: "",
      shoes: "",
      notes: "",
    },
    education: [],
    foodRefreshment: "",
    foodDetails: "",
    otherServices: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Others Data (Symptoms + Visit Notes + Diagnosis + Hospitalization)
  const [othersData, setOthersData] = useState({
    symptoms: "",
    visitNotes: "",
    diagnosis: "",
    diagnosisNotes: "",
    hospitalized: false,
    timeHospitalized: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [programSummary, setProgramSummary] = useState({
    totalVisitsRecorded: 0,
    averageVisitsPerChild: 0,
    mostCommonServices: "",
    topMedications: "",
    bmiDistribution: {},
    bmiStatusCounts: {},
    hospitalizations: 0,
    commonSymptoms: [],
    commonDiagnoses: [],
  });

  const [serviceDelivery, setServiceDelivery] = useState({
    totalKidsSeen: 0,
    totalServicesProvided: 0,
    averageBMI: 0,
    totalClothesGiven: 0,
    totalShoesGiven: 0,
    totalEducationSessions: 0,
    totalFoodProvided: 0,
    totalTestsDone: 0,
    medicationsGiven: {},
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Medical Services & Social Options (Fetched dynamically)
  const [medicationOptions, setMedicationOptions] = useState({
    ntdsMeds: [],
    antibiotics: [],
    otherMeds: [],
  });
  const [testTypesOptions, setTestTypesOptions] = useState([]);
  const [testResultOptions, setTestResultOptions] = useState([]);
  const [procedureOptions, setProcedureOptions] = useState([]);
  const [educationOptions, setEducationOptions] = useState([]);

  useEffect(() => {
    const unsubscribeSync = api.registerSyncListener(setSyncState);
    return () => {
      unsubscribeSync();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOfflineMode(false);
      api.triggerSync();
    };
    const handleOffline = () => setOfflineMode(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSyncOfflineData = async () => {
    setIsSyncing(true);
    await api.triggerSync();
    setIsSyncing(false);
  };

  // Fetch all patients for selection - FIXED to include fingerprint status
  const fetchAllPatients = async () => {
    try {
      const data = await api.getChildren();
      const patients = Array.isArray(data) ? data : [];
      
      // Fetch all fingerprints in a single optimized bulk query
      const allFingerprints = await api.getAllFingerprints();
      const childIdsWithFingerprints = new Set(
        allFingerprints
          .filter(fp => fp && (fp.childId || fp.child_id))
          .map(fp => fp.childId || fp.child_id)
      );

      const patientsWithFingerprints = patients.map((patient) => ({
        ...patient,
        hasFingerprints: childIdsWithFingerprints.has(patient.id)
      }));
      
      setAllPatients(patientsWithFingerprints);
      setFilteredPatients(patientsWithFingerprints);
      return patientsWithFingerprints;
    } catch (error) {
      console.error("Error fetching patients:", error);
      setAllPatients([]);
      setFilteredPatients([]);
      return [];
    }
  };

  const handlePatientSearch = useCallback((e) => {
    e.preventDefault();
    const searchTerm = e.target.value;
    setPatientSearchTerm(searchTerm);
    
    if (!searchTerm || searchTerm.trim() === "") {
      setFilteredPatients(allPatients);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = allPatients.filter(patient => {
      const fullName = (patient.fullName || "").toLowerCase();
      const customId = (patient.customSerialId || "").toLowerCase();
      return fullName.includes(searchLower) || customId.includes(searchLower);
    });
    
    setFilteredPatients(filtered);
  }, [allPatients]);

  const getLocationName = useCallback((locationId) => {
    const locations = JSON.parse(localStorage.getItem("locations") || "[]");
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.name : locationId || "";
  }, []);

  const handleSelectPatient = useCallback((selectedPatient) => {
    const patientData = {
      id: selectedPatient.id,
      customSerialId: selectedPatient.customSerialId,
      fullName: selectedPatient.fullName,
      gender: selectedPatient.gender,
      estimatedBirthYear: selectedPatient.estimatedBirthYear,
      age: calculateAge(selectedPatient.estimatedBirthYear),
      locationName: getLocationName(selectedPatient.primaryLocationId),
      primaryLocationId: selectedPatient.primaryLocationId,
      image1: selectedPatient.image1,
      image2: selectedPatient.image2,
      image3: selectedPatient.image3,
      createdAt: selectedPatient.createdAt,
      hasFingerprints: selectedPatient.hasFingerprints || false,
    };

    setChild(patientData);
    setBaselineData({
      ...baselineData,
      kidId: selectedPatient.customSerialId || "",
      fullName: selectedPatient.fullName || "",
      gender: selectedPatient.gender || "",
      age: calculateAge(selectedPatient.estimatedBirthYear),
      location: selectedPatient.locationName || getLocationName(selectedPatient.primaryLocationId) || "",
    });
    
    setShowPatientSelector(false);
    setPatientSearchTerm("");
    
    if (selectedPatient.id) {
      fetchAllRecords(selectedPatient.id);
    }
    
    showToast(`Selected patient: ${selectedPatient.fullName}`, "success");
  }, [baselineData, getLocationName]);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }

    const childData = location.state?.child;
    if (childData) {
      setChild(childData);
      setBaselineData({
        ...baselineData,
        kidId: childData.customSerialId || "",
        fullName: childData.fullName || "",
        gender: childData.gender || "",
        age: calculateAge(childData.estimatedBirthYear),
        location: childData.locationName || getLocationName(childData.primaryLocationId) || "",
      });
      fetchAllRecords(childData.id);
      setLoading(false);
    } else {
      const storedChild = sessionStorage.getItem("selectedChild");
      if (storedChild) {
        const parsedChild = JSON.parse(storedChild);
        setChild(parsedChild);
        setBaselineData({
          ...baselineData,
          kidId: parsedChild.customSerialId || "",
          fullName: parsedChild.fullName || "",
          gender: parsedChild.gender || "",
          age: calculateAge(parsedChild.estimatedBirthYear),
          location:
            parsedChild.locationName || getLocationName(parsedChild.primaryLocationId) || "",
        });
        fetchAllRecords(parsedChild.id);
        setLoading(false);
      } else {
        setShowPatientSelector(true);
        setIsLoadingPatients(true);
        fetchAllPatients().then(() => {
          setIsLoadingPatients(false);
          setLoading(false);
        });
      }
    }

    loadClinicalAnalytics();
    loadClinicalOptions();
  }, [navigate, location]);

  const loadClinicalAnalytics = async () => {
    try {
      const summaryData = await api.getClinicalSummary();
      if (summaryData && summaryData.programSummary && summaryData.serviceDelivery) {
        setProgramSummary(summaryData.programSummary);
        setServiceDelivery(summaryData.serviceDelivery);
      }
    } catch (err) {
      console.warn("Failed to load clinical analytics from API:", err);
    }
  };

  const loadClinicalOptions = async () => {
    try {
      const options = await api.getClinicalOptions();
      if (options) {
        if (options.medicationOptions) setMedicationOptions(options.medicationOptions);
        if (options.testTypesOptions) setTestTypesOptions(options.testTypesOptions);
        if (options.testResultOptions) setTestResultOptions(options.testResultOptions);
        if (options.procedureOptions) setProcedureOptions(options.procedureOptions);
        if (options.educationOptions) setEducationOptions(options.educationOptions);
      }
    } catch (err) {
      console.warn("Failed to load clinical options:", err);
    }
  };

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 20000);
  };

  const fetchAllRecords = async (childId) => {
    if (!childId) return;
    await Promise.all([
      fetchMedicalRecords(childId),
      fetchVitalsRecords(childId),
      fetchMedicalServicesRecords(childId),
      fetchSocialServicesRecords(childId),
      fetchOthersRecords(childId),
    ]);
  };

  const fetchMedicalRecords = async (childId) => {
    try {
      const data = await api.apiFetchMedicalRecords(childId);
      setMedicalRecords(data || []);
    } catch (error) {
      console.error("Error fetching medical records:", error);
    }
  };

  const fetchVitalsRecords = async (childId) => {
    try {
      const data = await api.apiFetchVitalsRecords(childId);
      if (data && Array.isArray(data)) {
        // Store vitals history if needed
      }
    } catch (error) {
      console.error("Error fetching vitals:", error);
    }
  };

  const fetchMedicalServicesRecords = async (childId) => {
    try {
      await api.apiFetchMedicalServicesRecords(childId);
    } catch (error) {
      console.error("Error fetching medical services:", error);
    }
  };

  const fetchSocialServicesRecords = async (childId) => {
    try {
      await api.apiFetchSocialServicesRecords(childId);
    } catch (error) {
      console.error("Error fetching social services:", error);
    }
  };

  const fetchOthersRecords = async (childId) => {
    try {
      await api.apiFetchOthersRecords(childId);
    } catch (error) {
      console.error("Error fetching others records:", error);
    }
  };

  // Save functions & Tab transitions
  const navigateToNextTab = (currentTabId) => {
    const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
    if (currentIndex !== -1 && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const saveBaselineInfo = async () => {
    if (!child) {
      showToast("Please select a patient first", "error");
      return;
    }
    setSavingBaseline(true);
    try {
      await api.saveBaseline(child.id, {
        visitDate: baselineData.visitDate,
        firstVisit: baselineData.firstVisit,
        recordedBy: user?.id,
        recordedByName: getUserDisplayName(),
      });
      showToast("Baseline information saved successfully!", "success");
      navigateToNextTab("baseline");
    } catch (error) {
      console.error("Error saving baseline:", error);
      showToast("Failed to save baseline information", "error");
    } finally {
      setSavingBaseline(false);
    }
  };

  const saveVitals = async () => {
    if (!child) {
      showToast("Please select a patient first", "error");
      return;
    }
    setSavingVitals(true);
    const bmi = calculateBMI(vitalsData.weight, vitalsData.height);
    const bmiStatus = getBMIStatus(bmi);

    try {
      await api.saveVitals(child.id, {
        ...vitalsData,
        bmi,
        bmiStatus,
        recordedBy: user?.id,
        recordedByName: getUserDisplayName(),
      });

      showToast("Vitals saved successfully!", "success");
      setVitalsData({
        weight: "",
        height: "",
        bmi: "",
        bmiStatus: "",
        date: new Date().toISOString().split("T")[0],
      });
      navigateToNextTab("vitals");
    } catch (error) {
      console.error("Error saving vitals:", error);
      showToast("Failed to save vitals", "error");
    } finally {
      setSavingVitals(false);
    }
  };

  const saveMedicalServices = async () => {
    if (!child) {
      showToast("Please select a patient first", "error");
      return;
    }
    setSavingMedicalServices(true);
    try {
      // 1. Save services_rendered record
      await api.saveMedicalServices(child.id, {
        medications: medicalServicesData.medications,
        tests: medicalServicesData.tests,
        procedures: medicalServicesData.procedures,
        date: medicalServicesData.date,
        recordedBy: user?.id,
        recordedByName: getUserDisplayName(),
      });

      // 2. Save medications_given record if medication was selected
      const ntds = medicalServicesData.medications?.ntdsMeds || [];
      const antib = medicalServicesData.medications?.antibiotics || [];
      const other = medicalServicesData.medications?.otherMeds || [];
      if (ntds.length > 0 || antib.length > 0 || other.length > 0) {
        await api.saveMedication(child.id, {
          ntdsMeds: ntds.join(', '),
          antibiotics: antib.join(', '),
          otherMeds: other.join(', '),
          dateGiven: medicalServicesData.date,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName(),
          version: 1
        });
      }

      // 3. Save laboratory_tests record if test type was selected
      const testTypes = medicalServicesData.tests?.testTypes || [];
      const testResults = medicalServicesData.tests?.results || [];
      const testNotes = medicalServicesData.tests?.notes || '';
      if (testTypes.length > 0) {
        for (const testType of testTypes) {
          await api.saveTest(child.id, {
            testType,
            result: testResults.join(', ') || 'Pending',
            notes: testNotes,
            date: medicalServicesData.date,
            recordedBy: user?.id,
            recordedByName: getUserDisplayName(),
            version: 1
          });
        }
      }

      showToast("Medical services saved successfully!", "success");
      setMedicalServicesData({
        medications: {
          ntdsMeds: [],
          antibiotics: [],
          otherMeds: [],
        },
        tests: {
          testTypes: [],
          results: [],
          notes: "",
        },
        procedures: [],
        date: new Date().toISOString().split("T")[0],
      });
      navigateToNextTab("medical-services");
    } catch (error) {
      console.error("Error saving medical services:", error);
      showToast("Failed to save medical services", "error");
    } finally {
      setSavingMedicalServices(false);
    }
  };

  const saveSocialServices = async () => {
    if (!child) {
      showToast("Please select a patient first", "error");
      return;
    }
    setSavingSocialServices(true);
    try {
      // 1. Save services_rendered record
      await api.saveSocialServices(child.id, {
        clothing: socialServicesData.clothing,
        education: socialServicesData.education,
        foodRefreshment: socialServicesData.foodRefreshment,
        foodDetails: socialServicesData.foodDetails,
        otherServices: socialServicesData.otherServices,
        date: socialServicesData.date,
        recordedBy: user?.id,
        recordedByName: getUserDisplayName(),
      });

      // 2. Save clothing_provisions record if clothes/shoes details exist
      const clothesSize = socialServicesData.clothing?.clothes || '';
      const shoesSize = socialServicesData.clothing?.shoes || '';
      if (clothesSize || shoesSize) {
        await api.saveClothing(child.id, {
          clothes: clothesSize,
          shoes: shoesSize,
          date: socialServicesData.date,
          recordedBy: user?.id,
          recordedByName: getUserDisplayName(),
          version: 1
        });
      }

      showToast("Social services saved successfully!", "success");
      setSocialServicesData({
        clothing: {
          clothes: "",
          shoes: "",
          notes: "",
        },
        education: [],
        foodRefreshment: "",
        foodDetails: "",
        otherServices: "",
        date: new Date().toISOString().split("T")[0],
      });
      navigateToNextTab("social-services");
    } catch (error) {
      console.error("Error saving social services:", error);
      showToast("Failed to save social services", "error");
    } finally {
      setSavingSocialServices(false);
    }
  };

  const saveOthers = async () => {
    if (!child) {
      showToast("Please select a patient first", "error");
      return;
    }
    setSavingOthers(true);
    try {
      await api.saveOthers(child.id, {
        symptoms: othersData.symptoms,
        visitNotes: othersData.visitNotes,
        diagnosis: othersData.diagnosis,
        diagnosisNotes: othersData.diagnosisNotes,
        hospitalized: othersData.hospitalized,
        timeHospitalized: othersData.timeHospitalized,
        date: othersData.date,
        recordedBy: user?.id,
        recordedByName: getUserDisplayName(),
      });
      showToast("Assessment saved successfully!", "success");
      setOthersData({
        symptoms: "",
        visitNotes: "",
        diagnosis: "",
        diagnosisNotes: "",
        hospitalized: false,
        timeHospitalized: "",
        date: new Date().toISOString().split("T")[0],
      });
      navigateToNextTab("others");
    } catch (error) {
      console.error("Error saving assessment:", error);
      showToast("Failed to save assessment", "error");
    } finally {
      setSavingOthers(false);
    }
  };

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return "";
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const getBMIStatus = (bmi) => {
    if (!bmi) return "";
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 16) return "Severely Underweight";
    if (bmiNum >= 16 && bmiNum < 18.5) return "Underweight";
    if (bmiNum >= 18.5 && bmiNum < 25) return "Normal";
    if (bmiNum >= 25 && bmiNum < 30) return "Overweight";
    return "Obese";
  };

  const calculateAge = (birthYear) => {
    if (!birthYear) return "N/A";
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return `${age}`;
  };

  const getUserDisplayName = () => {
    if (!user) return "Staff";
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;
    if (user.username) return user.username;
    return "Staff User";
  };

  const getRecordTypeLabel = (type) => {
    const labels = {
      baseline: "Baseline",
      vitals: "Vitals",
      medication: "Medication",
      test: "Test",
      service: "Service",
      symptom: "Symptom",
      diagnosis: "Diagnosis",
    };
    return labels[type] || type;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  // Tab configuration - UPDATED with Others tab
  const tabs = [
    { id: "baseline", label: "Baseline Info", component: Tabs.BaselineInfo },
    { id: "vitals", label: "Vitals", component: Tabs.Vitals },
    { id: "others", label: "Assessment", component: Tabs.Others },
    { id: "medical-services", label: "Medical Services", component: Tabs.MedicalServices },
    { id: "social-services", label: "Social Services", component: Tabs.SocialServices },
    { id: "program-summary", label: "Program Summary", component: Tabs.ProgramSummary },
    { id: "service-delivery", label: "Service Delivery", component: Tabs.ServiceDelivery },
    { id: "history", label: "All History", component: Tabs.AllHistory },
  ];

  if (loading) {
    return (
      <div className="mr-loading">
        <div className="mr-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  if (showPatientSelector || !child) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="medical-records-page">
          <PatientSelectorPage 
            isLoadingPatients={isLoadingPatients}
            patientSearchTerm={patientSearchTerm}
            filteredPatients={filteredPatients}
            allPatients={allPatients}
            handlePatientSearch={handlePatientSearch}
            handleSelectPatient={handleSelectPatient}
            navigate={navigate}
            calculateAge={calculateAge}
          />
        </div>
      </Layout>
    );
  }

  // Find the active tab component
  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || Tabs.BaselineInfo;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="medical-records-page">
        {/* Network & Sync Status Banner */}
        {(offlineMode ||
          syncState.state === "running" ||
          syncState.message.includes("complete") ||
          syncState.message.includes("Error") ||
          syncState.message.includes("error")) && (
          <div
            className="medical-records-offline-banner"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: offlineMode
                ? "rgba(239, 68, 68, 0.15)"
                : "rgba(16, 185, 129, 0.15)",
              color: offlineMode ? "#ef4444" : "#10b981",
              border: `1px solid ${offlineMode ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              padding: "12px 20px",
              borderRadius: "12px",
              marginBottom: "24px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: offlineMode ? "#ef4444" : "#10b981",
                  display: "inline-block",
                  marginRight: "10px",
                  boxShadow: `0 0 8px ${offlineMode ? "#ef4444" : "#10b981"}`,
                }}
              ></span>
              <span>
                Network: <strong>{offlineMode ? "Offline" : "Online"}</strong> —
                Sync: <strong>{syncState.message}</strong>
              </span>
            </div>
            {!offlineMode && (
              <button
                className="medical-records-sync-btn"
                onClick={handleSyncOfflineData}
                disabled={isSyncing}
                style={{
                  backgroundColor: isSyncing ? "#cccccc" : "#0066cc",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "12px",
                  transition: "all 0.2s",
                }}
              >
                Sync Offline Data
              </button>
            )}
          </div>
        )}

        {toast.show && (
          <div className={`mr-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: "", type: "" })}
            >
              ×
            </button>
          </div>
        )}

        <div className="mr-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <button
              className="mr-back-btn"
              onClick={() => {
                setChild(null);
                setShowPatientSelector(true);
                setIsLoadingPatients(true);
                fetchAllPatients().then(() => {
                  setIsLoadingPatients(false);
                });
              }}
            >
              ← Change Patient
            </button>
            <h1>Medical Records - {child?.fullName}</h1>
            <button
              className="mr-btn mr-btn-secondary"
              onClick={() => {
                setChild(null);
                setShowPatientSelector(true);
                setIsLoadingPatients(true);
                fetchAllPatients().then(() => {
                  setIsLoadingPatients(false);
                });
              }}
              style={{ fontSize: "14px" }}
            >
              Select Different Patient
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mr-tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`mr-tab-nav-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mr-tab-content">
          <ActiveTabComponent
            child={child}
            user={user}
            baselineData={baselineData}
            setBaselineData={setBaselineData}
            vitalsData={vitalsData}
            setVitalsData={setVitalsData}
            medicalServicesData={medicalServicesData}
            setMedicalServicesData={setMedicalServicesData}
            socialServicesData={socialServicesData}
            setSocialServicesData={setSocialServicesData}
            othersData={othersData}
            setOthersData={setOthersData}
            programSummary={programSummary}
            serviceDelivery={serviceDelivery}
            medicalRecords={medicalRecords}
            medicationOptions={medicationOptions}
            testTypesOptions={testTypesOptions}
            testResultOptions={testResultOptions}
            procedureOptions={procedureOptions}
            educationOptions={educationOptions}
            saveBaselineInfo={saveBaselineInfo}
            saveVitals={saveVitals}
            saveMedicalServices={saveMedicalServices}
            saveSocialServices={saveSocialServices}
            saveOthers={saveOthers}
            calculateBMI={calculateBMI}
            getBMIStatus={getBMIStatus}
            calculateAge={calculateAge}
            getUserDisplayName={getUserDisplayName}
            getRecordTypeLabel={getRecordTypeLabel}
            showToast={showToast}
            savingBaseline={savingBaseline}
            savingVitals={savingVitals}
            savingMedicalServices={savingMedicalServices}
            savingSocialServices={savingSocialServices}
            savingOthers={savingOthers}
          />
        </div>
      </div>
    </Layout>
  );
};

export default MedicalRecords;