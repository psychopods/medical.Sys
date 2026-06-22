import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import "./ChildRegistration.css";
import {
  RenderAllChildrenList,
  RenderChildEditPage,
  RenderChildViewPage,
  RenderFingerprintEnrollment,
  RenderFingerprintsList,
  RenderListPage,
  RenderLocationsManagement,
  RenderOlderPatientsList,
  RenderRegistrationPage,
  RenderTodayRegistrations,
  RenderVerifyPage,
  RenderYoungPatientsList,
} from "./ChildRegistrationRenders";

// API base URL & endpoints
import { API_ENDPOINTS } from "../../config/endpoints.js";
import {
  getLocations,
  getChildren,
  registerChild as apiRegisterChild,
  enrollBiometric as apiEnrollBiometric,
  getBiometricsForChild,
  triggerSync,
  updateChild as apiUpdateChild,
  deleteChild as apiDeleteChild,
  getChildById as apiGetChildById,
} from "../../services/api.js";

// Finger names and hand mapping
const fingerNames = {
  1: { name: "Right Thumb", hand: "Right", finger: "Thumb" },
  2: { name: "Right Index", hand: "Right", finger: "Index" },
  3: { name: "Right Middle", hand: "Right", finger: "Middle" },
  4: { name: "Right Ring", hand: "Right", finger: "Ring" },
  5: { name: "Right Pinky", hand: "Right", finger: "Pinky" },
  6: { name: "Left Thumb", hand: "Left", finger: "Thumb" },
  7: { name: "Left Index", hand: "Left", finger: "Index" },
  8: { name: "Left Middle", hand: "Left", finger: "Middle" },
  9: { name: "Left Ring", hand: "Left", finger: "Ring" },
  10: { name: "Left Pinky", hand: "Left", finger: "Pinky" },
};

const ChildRegistration = () => {
  // ===== ALL STATE DECLARATIONS =====
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [activePage, setActivePage] = useState("list");
  const [pageHistory, setPageHistory] = useState(["list"]);
  const [fingerprintExists, setFingerprintExists] = useState(null);
  const [existingChild, setExistingChild] = useState(null);
  const [existingChildImages, setExistingChildImages] = useState(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingFingerprints, setIsSavingFingerprints] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [generatedId, setGeneratedId] = useState("");
  const [childrenData, setChildrenData] = useState([]);
  const [todayData, setTodayData] = useState([]);
  const [fingerprintData, setFingerprintData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [staffUserMap, setStaffUserMap] = useState({});
  const [formErrors, setFormErrors] = useState({
    fullName: "",
    estimatedBirthYear: "",
    gender: "",
    primaryLocationId: "",
  });

  // Loading states
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [youngPatients, setYoungPatients] = useState([]);
  const [olderPatients, setOlderPatients] = useState([]);
  const [searchYoung, setSearchYoung] = useState("");
  const [searchOlder, setSearchOlder] = useState("");

  const [viewingChild, setViewingChild] = useState(null);
  const [editingChild, setEditingChild] = useState(null);
  const [childFormData, setChildFormData] = useState({
    fullName: "",
    estimatedBirthYear: "",
    gender: "",
    primaryLocationId: "",
    customSerialId: "",
    image1: "",
    image2: "",
    image3: "",
  });
  const [childFormErrors, setChildFormErrors] = useState({
    fullName: "",
    estimatedBirthYear: "",
    gender: "",
    primaryLocationId: "",
  });

  const [editingLocation, setEditingLocation] = useState(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    description: "",
  });
  const [locationFormErrors, setLocationFormErrors] = useState({
    name: "",
  });

  // Fingerprint enrollment for existing child
  const [enrollingChild, setEnrollingChild] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedFinger, setSelectedFinger] = useState(1);
  const [fingerCaptures, setFingerCaptures] = useState({});
  const [fingerQuality, setFingerQuality] = useState({});
  const [capturedFingers, setCapturedFingers] = useState([]);

  // Fingerprint enrollment during registration
  const [regSelectedFinger, setRegSelectedFinger] = useState(null);
  const [regFingerCaptures, setRegFingerCaptures] = useState({});
  const [regFingerQuality, setRegFingerQuality] = useState({});
  const [regCapturedFingers, setRegCapturedFingers] = useState([]);
  const [regIsCapturing, setRegIsCapturing] = useState(false);

  const [showPrintPage, setShowPrintPage] = useState(false);
  const [printDataType, setPrintDataType] = useState("");
  const [printFilters, setPrintFilters] = useState({
    date_from: '',
    date_to: '',
    location: '',
    fingerprint_status: '',
    gender: '',
    age_group: ''
  });

  const [searchAllChildren, setSearchAllChildren] = useState("");
  const [searchTodayReg, setSearchTodayReg] = useState("");
  const [searchFingerprints, setSearchFingerprints] = useState("");
  const [searchLocations, setSearchLocations] = useState("");

  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);
  const [preview3, setPreview3] = useState(null);
  const [showCamera1, setShowCamera1] = useState(false);
  const [showCamera2, setShowCamera2] = useState(false);
  const [showCamera3, setShowCamera3] = useState(false);

  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const videoRef3 = useRef(null);
  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);
  const canvasRef3 = useRef(null);
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    estimatedBirthYear: "",
    gender: "",
    primaryLocationId: "",
  });
  const navigate = useNavigate();

  // ===== NAVIGATION FUNCTIONS =====
  const navigateToPage = (page) => {
    if (page !== activePage) {
      setPageHistory((prev) => [...prev, activePage]);
      setActivePage(page);
    }
  };

  const goBack = () => {
    if (pageHistory.length > 0) {
      const previousPage = pageHistory[pageHistory.length - 1];
      setPageHistory((prev) => prev.slice(0, -1));
      setActivePage(previousPage);
    } else {
      setActivePage("list");
    }
  };

  // ===== HELPER FUNCTIONS =====
  const getUserDisplayName = (userObj) => {
    if (!userObj) return "N/A";

    if (userObj.firstName && userObj.lastName) {
      return `${userObj.firstName} ${userObj.lastName}`;
    }
    if (userObj.first_name && userObj.last_name) {
      return `${userObj.first_name} ${userObj.last_name}`;
    }
    if (
      userObj.username &&
      userObj.username !== userObj.user_id &&
      userObj.username !== userObj.id
    ) {
      return userObj.username;
    }
    if (userObj.name) return userObj.name;
    if (userObj.user_name) return userObj.user_name;
    if (userObj.email) return userObj.email.split("@")[0];

    return "Staff User";
  };

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const calculateAgeFromYear = (estimatedBirthYear) => {
    if (!estimatedBirthYear) return "N/A";
    const currentYear = new Date().getFullYear();
    const age = currentYear - estimatedBirthYear;
    return `${age} year${age !== 1 ? "s" : ""}`;
  };

  const calculateAgeValue = (estimatedBirthYear) => {
    if (!estimatedBirthYear) return 0;
    const currentYear = new Date().getFullYear();
    return currentYear - estimatedBirthYear;
  };

  const getLocationName = (locationId) => {
    if (!Array.isArray(locations) || locations.length === 0) return "";
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.name : "";
  };

  const getStaffNameById = (staffId) => {
    if (!staffId) return "N/A";
    if (staffUserMap[staffId]) return staffUserMap[staffId];
    if (user && (user.id === staffId || user.user_id === staffId)) {
      return getUserDisplayName(user);
    }
    return staffId;
  };

  // ===== TOAST FUNCTION =====
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // ===== TOAST COMPONENT =====
  const ToastNotification = () => {
    if (!toast.show) return null;
    return (
      <div className={`child-reg-toast-notification ${toast.type}`}>
        <div className="child-reg-toast-content">
          {toast.type === "success" ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17L4 12" />
            </svg>
          ) : toast.type === "error" ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
        <button
          className="child-reg-toast-close"
          onClick={() => setToast({ show: false, message: "", type: "" })}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  };

  // ===== DATA FETCHING FUNCTIONS =====
  const fetchStaffUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const users = await response.json();
        setStaffUsers(users);
        const userMap = {};
        users.forEach((staff) => {
          const firstName = staff.firstName || staff.first_name || "";
          const lastName = staff.lastName || staff.last_name || "";
          let fullName = "";
          if (firstName && lastName) {
            fullName = `${firstName} ${lastName}`;
          } else if (firstName) {
            fullName = firstName;
          } else if (lastName) {
            fullName = lastName;
          } else if (staff.username) {
            fullName = staff.username;
          } else if (staff.email) {
            fullName = staff.email.split("@")[0];
          } else {
            fullName = "Staff User";
          }
          if (staff.id) userMap[staff.id] = fullName;
          if (staff.user_id) userMap[staff.user_id] = fullName;
          if (staff.username) userMap[staff.username] = fullName;
        });
        setStaffUserMap(userMap);
        return userMap;
      }
    } catch (error) {
      console.error("Error fetching staff users:", error);
    }
    return {};
  };

  const fetchLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations([]);
    }
  };

  const fetchChildren = async (userMap = staffUserMap) => {
    try {
      const data = await getChildren();
      let childrenArray = Array.isArray(data) ? data : [];
      childrenArray = childrenArray.map((child) => ({
        ...child,
        registeredByName: getStaffNameById(child.createdByStaffId),
      }));
      setChildrenData(childrenArray);
      filterPatientsByAge(childrenArray);
    } catch (error) {
      console.error("Error fetching children:", error);
      setChildrenData([]);
    }
  };

  const fetchTodayRegistrations = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const data = await getChildren();
      const childrenArray = Array.isArray(data) ? data : [];
      const todayArray = childrenArray
        .filter(
          (child) => child.createdAt && child.createdAt.split("T")[0] === today,
        )
        .map((child) => ({
          ...child,
          registeredByName: getStaffNameById(child.createdByStaffId),
        }));
      setTodayData(todayArray);
    } catch (error) {
      console.error("Error fetching today registrations:", error);
      setTodayData([]);
    }
  };

  const fetchFingerprints = async () => {
    try {
      const allFingerprints = [];
      const isOnline = navigator.onLine;

      if (!isOnline) {
        try {
          const { executeQuery } = await import("../../services/db.js");
          const rows = await executeQuery(
            "SELECT * FROM biometric_fingerprints",
          );
          rows.forEach((fp) => {
            const child = childrenData.find((c) => c.id === fp.child_id);
            allFingerprints.push({
              id: fp.id,
              childId: fp.child_id,
              childName: child ? child.fullName : "Unknown",
              customSerialId: child ? child.customSerialId : "",
              fingerIndex: fp.finger_index,
              templateBase64: fp.template_data,
              templateData: fp.template_data,
              qualityScore: fp.quality_score,
              status: fp.status,
              version: fp.version,
              syncStatus: fp.sync_status,
              capturedAt: fp.created_at,
              fingerName:
                fingerNames[fp.finger_index]?.name ||
                `Finger ${fp.finger_index}`,
            });
          });
          setFingerprintData(allFingerprints);
          return;
        } catch (dbError) {
          console.error("Error fetching fingerprints from SQLite:", dbError);
        }
      }

      for (const child of childrenData) {
        if (child.id) {
          try {
            const fingerprints = await getBiometricsForChild(child.id);
            fingerprints.forEach((fp) => {
              if (fp && Object.keys(fp).length > 0) {
                allFingerprints.push({
                  ...fp,
                  childName: child.fullName,
                  childId: child.id,
                  customSerialId: child.customSerialId,
                  capturedAt: fp.capturedAt || fp.captured_at || fp.createdAt,
                  qualityScore: fp.qualityScore || fp.quality,
                  capturedByName:
                    fp.capturedByName || getStaffNameById(fp.capturedBy),
                  fingerName:
                    fingerNames[fp.fingerIndex]?.name ||
                    `Finger ${fp.fingerIndex}`,
                });
              }
            });
          } catch (e) {
            console.error("Error fetching fingerprints for child:", e);
          }
        }
      }
      setFingerprintData(allFingerprints);
    } catch (error) {
      console.error("Error fetching fingerprints:", error);
      setFingerprintData([]);
    }
  };

  const filterPatientsByAge = (children) => {
    const young = [];
    const older = [];
    children.forEach((child) => {
      const age = calculateAgeValue(child.estimatedBirthYear);
      if (age < 18) {
        young.push(child);
      } else {
        older.push(child);
      }
    });
    setYoungPatients(young);
    setOlderPatients(older);
  };

  const generateRandomDigits = (length) => {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  };

  const generateRandomSuffix = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 2; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getLocationInitials = (locationId) => {
    if (!locationId || !locations || locations.length === 0) return "LOC";
    const locObj = locations.find((l) => l.id === locationId);
    if (!locObj || !locObj.name) return "LOC";
    const cleanName = locObj.name.replace(/[^a-zA-Z]/g, "").toUpperCase();
    return cleanName.substring(0, 3).padEnd(3, "X");
  };

  const generateRegistrationId = async (locationId = formData.primaryLocationId) => {
    try {
      const locInitials = getLocationInitials(locationId);
      const currentYear = new Date().getFullYear();
      const yy = currentYear.toString().slice(-2);
      
      // Load current children to run local uniqueness/collision check
      const childrenArray = await getChildren();
      const existingIds = new Set(
        (childrenArray || []).map((c) => (c.customSerialId || c.custom_serial_id || "").toUpperCase())
      );
      
      let uniqueId = "";
      let attempts = 0;
      const maxAttempts = 20;
      
      do {
        const randomDigits = generateRandomDigits(6);
        const suffix = generateRandomSuffix();
        uniqueId = `KD-${yy}-${locInitials}-${randomDigits}-${suffix}`;
        attempts++;
      } while (existingIds.has(uniqueId.toUpperCase()) && attempts < maxAttempts);
      
      setGeneratedId(uniqueId);
    } catch (error) {
      console.error("Error generating registration ID:", error);
      const currentYear = new Date().getFullYear();
      const yy = currentYear.toString().slice(-2);
      const locInitials = getLocationInitials(locationId);
      const randomDigits = generateRandomDigits(6);
      const suffix = generateRandomSuffix();
      setGeneratedId(`KD-${yy}-${locInitials}-${randomDigits}-${suffix}`);
    }
  };



  // ===== FORM VALIDATION FUNCTIONS =====
  const validateForm = () => {
    let isValid = true;
    const errors = {
      fullName: "",
      estimatedBirthYear: "",
      gender: "",
      primaryLocationId: "",
    };

    if (!formData.fullName.trim()) {
      errors.fullName = "Child name is required";
      isValid = false;
    }
    if (!formData.estimatedBirthYear) {
      errors.estimatedBirthYear = "Estimated birth year is required";
      isValid = false;
    }
    if (!formData.gender) {
      errors.gender = "Gender is required";
      isValid = false;
    }
    if (!formData.primaryLocationId) {
      errors.primaryLocationId = "Location is required";
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const validateChildEditForm = () => {
    let isValid = true;
    const errors = {
      fullName: "",
      estimatedBirthYear: "",
      gender: "",
      primaryLocationId: "",
    };

    if (!childFormData.fullName.trim()) {
      errors.fullName = "Child name is required";
      isValid = false;
    }
    if (!childFormData.estimatedBirthYear) {
      errors.estimatedBirthYear = "Estimated birth year is required";
      isValid = false;
    }
    if (!childFormData.gender) {
      errors.gender = "Gender is required";
      isValid = false;
    }
    if (!childFormData.primaryLocationId) {
      errors.primaryLocationId = "Location is required";
      isValid = false;
    }
    setChildFormErrors(errors);
    return isValid;
  };

  const validateLocationForm = () => {
    let isValid = true;
    const errors = { name: "" };
    if (!locationFormData.name.trim()) {
      errors.name = "Location name is required";
      isValid = false;
    }
    setLocationFormErrors(errors);
    return isValid;
  };

  const handleFormChangeWithValidation = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
    if (name === "primaryLocationId") {
      generateRegistrationId(value);
    }
  };

  const handleAgeChange = (e) => {
    const ageVal = e.target.value;
    const currentYear = new Date().getFullYear();
    if (ageVal === "") {
      setFormData({ ...formData, estimatedBirthYear: "" });
    } else {
      const age = parseInt(ageVal, 10);
      if (!isNaN(age)) {
        setFormData({
          ...formData,
          estimatedBirthYear: (currentYear - age).toString(),
        });
      }
    }
    if (formErrors.estimatedBirthYear) {
      setFormErrors({ ...formErrors, estimatedBirthYear: "" });
    }
  };

  const handleChildFormChange = (e) => {
    const { name, value } = e.target;
    setChildFormData({ ...childFormData, [name]: value });
    if (childFormErrors[name]) {
      setChildFormErrors({ ...childFormErrors, [name]: "" });
    }
  };

  const handleChildAgeChange = (e) => {
    const ageVal = e.target.value;
    const currentYear = new Date().getFullYear();
    if (ageVal === "") {
      setChildFormData({ ...childFormData, estimatedBirthYear: "" });
    } else {
      const age = parseInt(ageVal, 10);
      if (!isNaN(age)) {
        setChildFormData({
          ...childFormData,
          estimatedBirthYear: (currentYear - age).toString(),
        });
      }
    }
    if (childFormErrors.estimatedBirthYear) {
      setChildFormErrors({ ...childFormErrors, estimatedBirthYear: "" });
    }
  };

  const handleLocationFormChange = (e) => {
    const { name, value } = e.target;
    setLocationFormData({ ...locationFormData, [name]: value });
    if (locationFormErrors[name]) {
      setLocationFormErrors({ ...locationFormErrors, [name]: "" });
    }
  };

  // ===== FIX: Reset location form without closing it =====
  const resetLocationForm = () => {
    setEditingLocation(null);
    setLocationFormData({ name: "", description: "" });
    setLocationFormErrors({ name: "" });
    // DO NOT set showLocationForm(false) here
  };

  // ===== FIX: Add new location handler =====
  const handleAddNewLocation = () => {
    setEditingLocation(null);
    setLocationFormData({ name: "", description: "" });
    setLocationFormErrors({ name: "" });
    setShowLocationForm(true);
  };

  // ===== CAMERA FUNCTIONS =====
  const checkCameraSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast(
        "Your browser does not support camera access. Please use Chrome, Firefox, or Edge.",
        "error",
      );
      return false;
    }
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      showToast(
        "Camera access requires HTTPS. Please use HTTPS or localhost.",
        "error",
      );
      return false;
    }
    return true;
  };

  const startCamera = async (num) => {
    if (!checkCameraSupport()) return;
    let videoRef, setShowCamera;
    if (num === 1) {
      videoRef = videoRef1;
      setShowCamera = setShowCamera1;
    } else if (num === 2) {
      videoRef = videoRef2;
      setShowCamera = setShowCamera2;
    } else {
      videoRef = videoRef3;
      setShowCamera = setShowCamera3;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        showToast("Camera started successfully!", "success");
      }
    } catch (err) {
      console.error("Camera error:", err);
      showToast(
        `Unable to access camera: ${err.message || "Please check permissions."}`,
        "error",
      );
    }
  };

  const capturePhoto = (num) => {
    let canvas, video, setPreview, setShowCamera;
    if (num === 1) {
      canvas = canvasRef1.current;
      video = videoRef1.current;
      setPreview = setPreview1;
      setShowCamera = setShowCamera1;
    } else if (num === 2) {
      canvas = canvasRef2.current;
      video = videoRef2.current;
      setPreview = setPreview2;
      setShowCamera = setShowCamera2;
    } else {
      canvas = canvasRef3.current;
      video = videoRef3.current;
      setPreview = setPreview3;
      setShowCamera = setShowCamera3;
    }
    if (!video || !video.videoWidth || !video.videoHeight) {
      showToast("Camera not ready. Please wait and try again.", "error");
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(imageDataUrl);
    setShowCamera(false);
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    showToast(`Photo ${num} captured successfully!`, "success");
  };

  const stopCamera = (num) => {
    let video, setShowCamera;
    if (num === 1) {
      video = videoRef1.current;
      setShowCamera = setShowCamera1;
    } else if (num === 2) {
      video = videoRef2.current;
      setShowCamera = setShowCamera2;
    } else {
      video = videoRef3.current;
      setShowCamera = setShowCamera3;
    }
    setShowCamera(false);
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const handleFileUpload = (num, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (num === 1) setPreview1(reader.result);
      else if (num === 2) setPreview2(reader.result);
      else setPreview3(reader.result);
      showToast(`Photo ${num} uploaded successfully!`, "success");
    };
    reader.readAsDataURL(file);
  };

  // ===== CHILD CRUD OPERATIONS =====
  const fetchChildById = async (id) => {
    try {
      const data = await apiGetChildById(id);
      return data;
    } catch (error) {
      console.error("Error fetching child:", error);
      return null;
    }
  };

  const updateChild = async (id, childData) => {
    try {
      const data = await apiUpdateChild(id, {
        ...childData,
        createdByStaffId:
          childData.createdByStaffId || user?.id || user?.user_id,
      });
      return data;
    } catch (error) {
      console.error("Error updating child:", error);
      return null;
    }
  };

  const deleteChild = async (id) => {
    try {
      const success = await apiDeleteChild(id);
      return success;
    } catch (error) {
      console.error("Error deleting child:", error);
      return false;
    }
  };

  const addRegistration = async (newChild) => {
    try {
      const data = await apiRegisterChild({
        id: newChild.id || crypto.randomUUID(),
        customSerialId: generatedId,
        fullName: newChild.fullName,
        gender: newChild.gender,
        estimatedBirthYear: parseInt(newChild.estimatedBirthYear),
        primaryLocationId: newChild.primaryLocationId,
        image1: preview1 || null,
        image2: preview2 || null,
        image3: preview3 || null,
        createdByStaffId: user?.id || user?.user_id,
        createdAt: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error("Error adding registration:", error);
      return null;
    }
  };

  // ===== HANDLERS =====
  const handleViewChild = async (child) => {
    setIsLoading(true);
    try {
      const fullChild = await fetchChildById(child.id);
      setViewingChild(fullChild || child);
      navigateToPage('view_child');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChild = (child) => {
    setEditingChild(child);
    setChildFormData({
      fullName: child.fullName,
      estimatedBirthYear: child.estimatedBirthYear,
      gender: child.gender,
      primaryLocationId: child.primaryLocationId,
      customSerialId: child.customSerialId,
      image1: child.image1 || "",
      image2: child.image2 || "",
      image3: child.image3 || "",
    });
    navigateToPage("edit_child");
  };

  const handleSaveChild = async () => {
    if (!validateChildEditForm()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsSavingChild(true);
    try {
      const result = await updateChild(editingChild.id, childFormData);
      if (result) {
        showToast('Child updated successfully!', 'success');
        setEditingChild(null);
        setViewingChild(null);
        await fetchChildren();
        await fetchTodayRegistrations();
        generateRegistrationId();
        goBack();
      } else {
        showToast('Failed to update child', 'error');
      }
    } finally {
      setIsSavingChild(false);
    }
  };

  const handleDeleteChild = async (child) => {
    if (!window.confirm(`Are you sure you want to delete ${child.fullName}? This action cannot be undone.`)) {
      return;
    }
    setDeletingChildId(child.id);
    setIsDeleting(true);
    try {
      const success = await deleteChild(child.id);
      if (success) {
        showToast("Child deleted successfully!", "success");
        await fetchChildren();
        await fetchTodayRegistrations();
        generateRegistrationId();
      } else {
        showToast("Failed to delete child", "error");
      }
    } finally {
      setIsDeleting(false);
      setDeletingChildId(null);
    }
  };

  // ===== FINGERPRINT HANDLERS =====
  const handleEnrollFingerprint = (child) => {
    setEnrollingChild(child);
    setSelectedFinger(1);
    setFingerCaptures({});
    setFingerQuality({});
    setCapturedFingers([]);
    setIsCapturing(false);
    navigateToPage("enroll_fingerprint");
  };

  const handleSelectFinger = (fingerIndex) => {
    setSelectedFinger(fingerIndex);
  };

  const handleCaptureFingerprint = () => {
    if (!selectedFinger) {
      showToast("Please select a finger first", "error");
      return;
    }
    setIsCapturing(true);
    setTimeout(() => {
      const quality = Math.floor(Math.random() * 30) + 70;
      setFingerQuality((prev) => ({ ...prev, [selectedFinger]: quality }));
      setFingerCaptures((prev) => ({ ...prev, [selectedFinger]: true }));
      if (!capturedFingers.includes(selectedFinger)) {
        setCapturedFingers((prev) => [...prev, selectedFinger]);
      }
      setIsCapturing(false);
      showToast(
        `Finger ${fingerNames[selectedFinger].name} captured with ${quality}% quality!`,
        "success",
      );
    }, 2000);
  };

  const handleRemoveFingerprint = (fingerIndex) => {
    setFingerCaptures((prev) => {
      const newCaptures = { ...prev };
      delete newCaptures[fingerIndex];
      return newCaptures;
    });
    setFingerQuality((prev) => {
      const newQuality = { ...prev };
      delete newQuality[fingerIndex];
      return newQuality;
    });
    setCapturedFingers((prev) => prev.filter((f) => f !== fingerIndex));
    showToast(`Finger ${fingerNames[fingerIndex].name} removed`, "info");
  };

  const handleSaveFingerprints = async () => {
    if (capturedFingers.length === 0) {
      showToast("No fingerprints captured. You can skip this step.", "info");
      goBack();
      return;
    }
    setIsSavingFingerprints(true);
    let successCount = 0;

    try {
      for (const fingerIndex of capturedFingers) {
        try {
          const result = await apiEnrollBiometric({
            id: crypto.randomUUID(),
            childId: enrollingChild.id,
            fingerIndex: fingerIndex,
            templateBase64: `fingerprint_template_${fingerIndex}_base64`,
            qualityScore: fingerQuality[fingerIndex] || 80,
            createdAt: new Date().toISOString(),
            status: 'PENDING'
          });
          if (result) successCount++;
        } catch (error) {
          console.error("Error saving fingerprint:", error);
        }
      }
      if (successCount > 0) {
        showToast(`${successCount} fingerprint(s) enrolled successfully for ${enrollingChild.fullName}!`, 'success');
        await fetchChildren();
        await fetchTodayRegistrations();
        await fetchFingerprints();
        goBack();
        setEnrollingChild(null);
        setFingerCaptures({});
        setFingerQuality({});
        setCapturedFingers([]);
      } else {
        showToast('Failed to save fingerprints', 'error');
      }
    } finally {
      setIsSavingFingerprints(false);
    }
  };

  const handleSkipFingerprints = () => {
    goBack();
    setEnrollingChild(null);
    setFingerCaptures({});
    setFingerQuality({});
    setCapturedFingers([]);
  };

  const handleCancelEnrollment = () => {
    goBack();
    setEnrollingChild(null);
    setFingerCaptures({});
    setFingerQuality({});
    setCapturedFingers([]);
    setIsCapturing(false);
  };

  // ===== REGISTRATION FINGERPRINT HANDLERS =====
  const handleRegSelectFinger = (fingerIndex) => {
    setRegSelectedFinger(fingerIndex);
  };

  const handleRegCaptureFingerprint = () => {
    if (!regSelectedFinger) {
      showToast("Please select a finger first", "error");
      return;
    }
    setRegIsCapturing(true);
    setTimeout(() => {
      const quality = Math.floor(Math.random() * 30) + 70;
      setRegFingerQuality((prev) => ({
        ...prev,
        [regSelectedFinger]: quality,
      }));
      setRegFingerCaptures((prev) => ({ ...prev, [regSelectedFinger]: true }));
      if (!regCapturedFingers.includes(regSelectedFinger)) {
        setRegCapturedFingers((prev) => [...prev, regSelectedFinger]);
      }
      setRegIsCapturing(false);
      showToast(
        `Finger ${fingerNames[regSelectedFinger].name} captured with ${quality}% quality!`,
        "success",
      );
    }, 2000);
  };

  const handleRegRemoveFingerprint = (fingerIndex) => {
    setRegFingerCaptures((prev) => {
      const newCaptures = { ...prev };
      delete newCaptures[fingerIndex];
      return newCaptures;
    });
    setRegFingerQuality((prev) => {
      const newQuality = { ...prev };
      delete newQuality[fingerIndex];
      return newQuality;
    });
    setRegCapturedFingers((prev) => prev.filter((f) => f !== fingerIndex));
    showToast(`Finger ${fingerNames[fingerIndex].name} removed`, "info");
  };

  const handleRegSaveFingerprints = async () => {
    if (regCapturedFingers.length === 0) {
      setRegistrationStep(3);
      return;
    }

    setIsSavingFingerprints(true);
    setIsAddingChild(true);
    try {
      // First register the child
      const newChild = {
        fullName: formData.fullName,
        estimatedBirthYear: formData.estimatedBirthYear,
        gender: formData.gender,
        primaryLocationId: formData.primaryLocationId,
        createdByStaffId: user?.id || user?.user_id,
      };

      const result = await addRegistration(newChild);
      let childId = null;

      if (result && (result.child || result.id)) {
        childId = result.child?.id || result.id;
      }

      if (childId) {
        let successCount = 0;
        // Save fingerprints for this child
        for (const fingerIndex of regCapturedFingers) {
          try {
            const enrollResult = await apiEnrollBiometric({
              id: crypto.randomUUID(),
              childId: childId,
              fingerIndex: fingerIndex,
              templateBase64: `fingerprint_template_${fingerIndex}_base64`,
              qualityScore: regFingerQuality[fingerIndex] || 80,
              createdAt: new Date().toISOString(),
              status: "PENDING",
            });
            if (enrollResult) successCount++;
          } catch (error) {
            console.error("Error saving fingerprint:", error);
          }
        }

        if (successCount > 0) {
          showToast(
            `✓ ${successCount} fingerprint(s) enrolled successfully!`,
            "success",
          );
          await fetchChildren();
          await fetchTodayRegistrations();
          await fetchFingerprints();
          setRegistrationStep(3);
        } else {
          showToast(
            "Failed to save fingerprints. You can add them later.",
            "warning",
          );
          setRegistrationStep(3);
        }
      } else {
        showToast("Failed to register child. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsSavingFingerprints(false);
      setIsAddingChild(false);
    }
  };

  const handleRegSkipFingerprints = async () => {
    setIsAddingChild(true);
    try {
      // Register child without fingerprints
      const newChild = {
        fullName: formData.fullName,
        estimatedBirthYear: formData.estimatedBirthYear,
        gender: formData.gender,
        primaryLocationId: formData.primaryLocationId,
        createdByStaffId: user?.id || user?.user_id,
      };

      const result = await addRegistration(newChild);
      if (result) {
        showToast(
          `✓ Child registered successfully with ID: ${generatedId}!`,
          "success",
        );
        await fetchChildren();
        await fetchTodayRegistrations();
        await generateRegistrationId();
        setRegistrationStep(3);
      } else {
        showToast("Failed to register child. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error registering child without fingerprints:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsAddingChild(false);
    }
  };

  const handleRegComplete = () => {
    showToast(
      `✓ Child registered successfully with ID: ${generatedId}!`,
      "success",
    );
    goBack();
    setRegistrationStep(1);

    setFormData({
      fullName: "",
      estimatedBirthYear: "",
      gender: "",
      primaryLocationId: "",
    });
    setFormErrors({
      fullName: "",
      estimatedBirthYear: "",
      gender: "",
      primaryLocationId: "",
    });
    setPreview1(null);
    setPreview2(null);
    setPreview3(null);
    // Reset registration fingerprint state
    setRegFingerCaptures({});
    setRegFingerQuality({});
    setRegCapturedFingers([]);
    setRegSelectedFinger(null);
    setRegIsCapturing(false);
    fetchChildren();
    fetchTodayRegistrations();
    generateRegistrationId("");
  };

  // ===== LOCATION HANDLERS =====
  const addLocation = async (locationData) => {
    try {
      const response = await fetch(API_ENDPOINTS.locations, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: locationData.name,
          description: locationData.description || "",
        }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error adding location:", error);
      return null;
    }
    return null;
  };

  const updateLocation = async (id, locationData) => {
    try {
      const response = await fetch(API_ENDPOINTS.location(id), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: locationData.name,
          description: locationData.description || "",
        }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error updating location:", error);
      return null;
    }
    return null;
  };

  const deleteLocation = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.location(id), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error("Error deleting location:", error);
      return false;
    }
  };

  // ===== FIX: Edit location handler =====
  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationFormData({
      name: location.name,
      description: location.description || "",
    });
    setLocationFormErrors({ name: "" });
    setShowLocationForm(true);
  };

  // ===== FIX: Save location handler =====
  const handleSaveLocation = async () => {
    if (!validateLocationForm()) return;

    setIsAddingLocation(true);
    try {
      let result;
      if (editingLocation) {
        result = await updateLocation(editingLocation.id, locationFormData);
        if (result) {
          showToast('Location updated successfully!', 'success');
          await fetchLocations();
          // Close form after successful update
          setShowLocationForm(false);
          resetLocationForm();
        } else {
          showToast('Failed to update location', 'error');
        }
      } else {
        result = await addLocation(locationFormData);
        if (result) {
          showToast('Location added successfully!', 'success');
          await fetchLocations();
          // Close form after successful add
          setShowLocationForm(false);
          resetLocationForm();
        } else {
          showToast('Failed to add location', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving location:', error);
      showToast('An error occurred while saving location', 'error');
    } finally {
      setIsAddingLocation(false);
    }
  };

  // ===== FIX: Delete location handler =====
  const handleDeleteLocation = async (location) => {
    if (!window.confirm(`Are you sure you want to delete location "${location.name}"?`)) {
      return;
    }
    setIsAddingLocation(true);
    try {
      const success = await deleteLocation(location.id);
      if (success) {
        await fetchLocations();
        showToast('Location deleted successfully!', 'success');
      } else {
        showToast('Failed to delete location', 'error');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      showToast('An error occurred while deleting location', 'error');
    } finally {
      setIsAddingLocation(false);
    }
  };

  // ===== VERIFICATION HANDLERS =====
  const handleVerifyFingerprintScan = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const matchedChild = Array.isArray(childrenData) ? childrenData[0] : null;
      if (matchedChild) {
        setExistingChild({
          id: matchedChild.id,
          customSerialId: matchedChild.customSerialId,
          fullName: matchedChild.fullName,
          estimatedBirthYear: matchedChild.estimatedBirthYear,
          age: calculateAgeFromYear(matchedChild.estimatedBirthYear),
          gender: matchedChild.gender,
          locationName: getLocationName(matchedChild.primaryLocationId),
          createdAt: matchedChild.createdAt,
          registeredBy: matchedChild.createdByStaffId,
          images: {
            image1: matchedChild.image1,
            image2: matchedChild.image2,
            image3: matchedChild.image3,
          },
        });
        setExistingChildImages({
          image1: matchedChild.image1,
          image2: matchedChild.image2,
          image3: matchedChild.image3,
        });
        setFingerprintExists(true);
        showToast("✓ Fingerprint verified! Child found in system.", "success");
      } else {
        setFingerprintExists(false);
        setExistingChild(null);
        setExistingChildImages(null);
        showToast("✗ Fingerprint not found. No matching record.", "info");
      }
      setIsVerifying(false);
    }, 1500);
  };

  const handleLoadExistingRecord = () => {
    if (existingChild && existingChild.fullName) {
      sessionStorage.setItem("selectedChild", JSON.stringify(existingChild));
      navigate("/medical-records", { state: { child: existingChild } });
      setFingerprintExists(null);
      setExistingChild(null);
      setExistingChildImages(null);
    } else {
      showToast("No record selected", "error");
    }
  };

  // ===== OTHER HANDLERS =====
  const handleAddRegistrationClick = () => {
    setRegistrationStep(1);
    setFormData({
      fullName: "",
      estimatedBirthYear: "",
      gender: "",
      primaryLocationId: "",
    });
    setPreview1(null);
    setPreview2(null);
    setPreview3(null);
    // Reset registration fingerprint state
    setRegFingerCaptures({});
    setRegFingerQuality({});
    setRegCapturedFingers([]);
    setRegSelectedFinger(null);
    setRegIsCapturing(false);
    navigateToPage("register");
  };

  const handleVerifyFingerprintClick = () => {
    setFingerprintExists(null);
    setExistingChild(null);
    setExistingChildImages(null);
    setIsVerifying(false);
    navigateToPage("verify");
  };

  const handleSyncOfflineData = async () => {
    setIsSyncing(true);
    showToast("Starting synchronization...", "info");
    try {
      await triggerSync();
      const isOnline = navigator.onLine;
      setOfflineMode(!isOnline);
      showToast("✓ Synchronization completed successfully!", "success");
    } catch (error) {
      console.error("Error syncing:", error);
      showToast("Error occurred during synchronization", "error");
    } finally {
      setIsSyncing(false);
      await fetchChildren();
      await fetchTodayRegistrations();
      await fetchFingerprints();
      await generateRegistrationId();
    }
  };

  const handleStatClick = (page, title) => {
    showToast(`Viewing ${title}`, "info");
    navigateToPage(page);
  };

  const handleActionClick = (action) => {
    showToast(`Opening ${action}`, "info");
  };

  const handlePrintClick = (dataType) => {
    setPrintDataType(dataType);
    setPrintFilters({ 
      date_from: '', 
      date_to: '', 
      location: '', 
      fingerprint_status: '', 
      gender: '',
      age_group: ''
    });
    setShowPrintPage(true);
  };

  // ===== COMPLETE WORKING PRINT FUNCTION WITH ALL FILTERS =====
  const handlePrint = () => {
    let dataToPrint = [];
    let title = '';

    switch (printDataType) {
      case 'children':
        dataToPrint = [...filteredAllChildren];
        title = 'All Registered Patients Report';
        break;
      case 'today':
        dataToPrint = [...filteredTodayRegistrations];
        title = 'Today\'s Registrations Report';
        break;
      case 'fingerprints':
        dataToPrint = [...filteredFingerprintData];
        title = 'Fingerprints Captured Report';
        break;
      case 'young':
        dataToPrint = [...filteredYoungPatients];
        title = 'Young Patients Report (Under 18 Years)';
        break;
      case 'older':
        dataToPrint = [...filteredOlderPatients];
        title = 'Older Patients Report (18 Years and Above)';
        break;
      default:
        dataToPrint = [];
        title = 'Report';
    }

    let filteredData = [...dataToPrint];

    // Apply date filters
    if (printFilters.date_from) {
      const fromDate = new Date(printFilters.date_from);
      fromDate.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.createdAt || item.capturedAt || item.created_at);
        return itemDate >= fromDate;
      });
    }

    if (printFilters.date_to) {
      const toDate = new Date(printFilters.date_to);
      toDate.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.createdAt || item.capturedAt || item.created_at);
        return itemDate <= toDate;
      });
    }

    // Apply location filter
    if (printFilters.location) {
      filteredData = filteredData.filter(item => {
        const locationName = getLocationName(item.primaryLocationId);
        return locationName === printFilters.location;
      });
    }

    // Apply gender filter
    if (printFilters.gender) {
      filteredData = filteredData.filter(item => item.gender === printFilters.gender);
    }

    // Apply age group filter
    if (printFilters.age_group) {
      filteredData = filteredData.filter(item => {
        const age = calculateAgeValue(item.estimatedBirthYear);
        switch (printFilters.age_group) {
          case '0-5': return age >= 0 && age <= 5;
          case '6-12': return age >= 6 && age <= 12;
          case '13-17': return age >= 13 && age <= 17;
          case '18-35': return age >= 18 && age <= 35;
          case '36-60': return age >= 36 && age <= 60;
          case '60+': return age >= 60;
          default: return true;
        }
      });
    }

    // Apply fingerprint status filter
    if (printFilters.fingerprint_status) {
      const isCaptured = printFilters.fingerprint_status === 'captured';
      filteredData = filteredData.filter(item => {
        const childFingerprints = fingerprintData.filter(fp => fp.childId === item.id || fp.customSerialId === item.customSerialId);
        const fingerCount = childFingerprints.length;
        return isCaptured ? fingerCount > 0 : fingerCount === 0;
      });
    }

    if (filteredData.length === 0) {
      showToast('No data matches the selected filters', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      showToast('Please allow popups for this site', 'error');
      return;
    }

    const currentDate = new Date().toLocaleString();
    const currentUser = user?.username || user?.name || 'Unknown User';
    const totalRecords = filteredData.length;

    let tableRows = '';
    filteredData.forEach((item, index) => {
      const age = calculateAgeFromYear(item.estimatedBirthYear);
      const childFingerprints = fingerprintData.filter(fp => fp.childId === item.id || fp.customSerialId === item.customSerialId);
      const fingerCount = childFingerprints.length;
      
      tableRows += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${item.customSerialId || 'N/A'}</td>
          <td>${item.fullName || 'N/A'}</td>
          <td>${age}</td>
          <td>${item.gender || 'N/A'}</td>
          <td>${getLocationName(item.primaryLocationId) || 'N/A'}</td>
          <td>${item.createdAt ? item.createdAt.split('T')[0] : 'N/A'}</td>
          <td>${fingerCount > 0 ? `${fingerCount}/10` : '0/10'}</td>
          <td>${item.registeredByName || getStaffNameById(item.createdByStaffId) || 'N/A'}</td>
        </tr>
      `;
    });

    let filterText = '';
    if (printFilters.date_from) filterText += `Date From: ${printFilters.date_from} | `;
    if (printFilters.date_to) filterText += `Date To: ${printFilters.date_to} | `;
    if (printFilters.location) filterText += `Location: ${printFilters.location} | `;
    if (printFilters.gender) filterText += `Gender: ${printFilters.gender} | `;
    if (printFilters.age_group) {
      const ageLabels = {
        '0-5': '0-5 years',
        '6-12': '6-12 years',
        '13-17': '13-17 years',
        '18-35': '18-35 years',
        '36-60': '36-60 years',
        '60+': '60+ years'
      };
      filterText += `Age Group: ${ageLabels[printFilters.age_group] || printFilters.age_group} | `;
    }
    if (printFilters.fingerprint_status) {
      filterText += `Fingerprint: ${printFilters.fingerprint_status === 'captured' ? 'Captured' : 'Pending'} | `;
    }
    filterText = filterText || 'None';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 30px; background: #fff; }
            .print-container { max-width: 1400px; margin: 0 auto; background: white; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #667eea; }
            h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 5px; }
            .date-info { color: #999; font-size: 12px; margin-top: 10px; }
            .filters-applied { background: #f8f9fa; padding: 10px 15px; margin: 20px 0; border-left: 3px solid #667eea; font-size: 13px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            th { background: #667eea; color: white; padding: 12px; text-align: left; font-weight: 600; border: 1px solid #5a67d8; }
            td { border: 1px solid #e0e0e0; padding: 10px 12px; color: #333; }
            tr:nth-child(even) { background: #f8f9fa; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; }
            .age-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
            .age-child { background: #dbeafe; color: #1e40af; }
            .age-teen { background: #d1fae5; color: #065f46; }
            .age-adult { background: #fef3c7; color: #92400e; }
            .age-senior { background: #fce4ec; color: #9a3412; }
            @media print { body { padding: 10px; } th { background: #667eea !important; color: white !important; } }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>${title}</h1>
              <div class="subtitle">Field Outreach and Street Medicine System</div>
              <div class="date-info">Generated on: ${currentDate}</div>
              <div class="date-info">Generated by: ${currentUser}</div>
            </div>
            <div class="filters-applied">
              <strong>Filters Applied:</strong> ${filterText}
            </div>
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>ID</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Location</th>
                  <th>Registration Date</th>
                  <th>Fingerprints</th>
                  <th>Registered By</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="footer">
              <p>This is a system generated report from Medical System</p>
              <p>Total Records: ${totalRecords}</p>
            </div>
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(function() { 
                window.close(); 
              }, 1000);
            }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowPrintPage(false);
    showToast("Print job sent successfully!", "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  // ===== PRINT PAGE COMPONENT WITH ENHANCED FILTERS =====
  const PrintPage = () => {
    if (!showPrintPage) return null;
    
    const getTitle = () => {
      switch (printDataType) {
        case "children":
          return "All Registered Patients";
        case "today":
          return "Today's Registrations";
        case "fingerprints":
          return "Fingerprints Captured";
        case "young":
          return "Young Patients (Under 18)";
        case "older":
          return "Older Patients (18+)";
        default:
          return "Print Report";
      }
    };

    const handleResetFilters = () => {
      setPrintFilters({
        date_from: '',
        date_to: '',
        location: '',
        fingerprint_status: '',
        gender: '',
        age_group: ''
      });
      showToast('Filters reset successfully!', 'info');
    };

    const ageGroups = [
      { value: '', label: 'All Ages' },
      { value: '0-5', label: '0-5 years (Children)' },
      { value: '6-12', label: '6-12 years (Children)' },
      { value: '13-17', label: '13-17 years (Teens)' },
      { value: '18-35', label: '18-35 years (Young Adults)' },
      { value: '36-60', label: '36-60 years (Adults)' },
      { value: '60+', label: '60+ years (Seniors)' }
    ];

    return (
      <div className="child-reg-print-page">
        <div className="child-reg-print-header">
          <button
            className="child-reg-back-btn"
            onClick={() => setShowPrintPage(false)}
          >
            ← Back to Dashboard
          </button>
          <div className="child-reg-print-title-section">
            <h1>Print {getTitle()} Report</h1>
            <p>Select filters below to customize your report</p>
          </div>
        </div>
        <div className="child-reg-print-content">
          <div className="child-reg-filters-section">
            <div className="child-reg-filters-header">
              <h3>Report Filters</h3>
              <button className="child-reg-reset-filters-btn" onClick={handleResetFilters}>Reset Filters</button>
            </div>
            <div className="child-reg-filters-grid">
              {/* Date Filters */}
              <div className="child-reg-filter-field">
                <label>Date From</label>
                <input 
                  type="date" 
                  value={printFilters.date_from} 
                  onChange={(e) => setPrintFilters({...printFilters, date_from: e.target.value})} 
                />
              </div>
              <div className="child-reg-filter-field">
                <label>Date To</label>
                <input 
                  type="date" 
                  value={printFilters.date_to} 
                  onChange={(e) => setPrintFilters({...printFilters, date_to: e.target.value})} 
                />
              </div>
              
              {/* Location Filter */}
              <div className="child-reg-filter-field">
                <label>Location</label>
                <select 
                  value={printFilters.location} 
                  onChange={(e) => setPrintFilters({...printFilters, location: e.target.value})}
                >
                  <option value="">All Locations</option>
                  {Array.isArray(locations) && locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Gender Filter */}
              <div className="child-reg-filter-field">
                <label>Gender</label>
                <select 
                  value={printFilters.gender} 
                  onChange={(e) => setPrintFilters({...printFilters, gender: e.target.value})}
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Age Group Filter */}
              <div className="child-reg-filter-field">
                <label>Age Group</label>
                <select 
                  value={printFilters.age_group} 
                  onChange={(e) => setPrintFilters({...printFilters, age_group: e.target.value})}
                >
                  {ageGroups.map(group => (
                    <option key={group.value} value={group.value}>{group.label}</option>
                  ))}
                </select>
              </div>

              {/* Fingerprint Status Filter */}
              <div className="child-reg-filter-field">
                <label>Fingerprint Status</label>
                <select 
                  value={printFilters.fingerprint_status} 
                  onChange={(e) => setPrintFilters({...printFilters, fingerprint_status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="captured">Has Fingerprints</option>
                  <option value="pending">No Fingerprints</option>
                </select>
              </div>
            </div>
            <div className="child-reg-filters-actions">
              <button
                className="child-reg-cancel-btn"
                onClick={() => setShowPrintPage(false)}
              >
                Cancel
              </button>
              <button className="child-reg-generate-btn" onClick={handlePrint}>
                Generate & Print Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== FILTERED DATA =====
  const filteredAllChildren = Array.isArray(childrenData) ? childrenData.filter(child =>
    child.fullName?.toLowerCase().includes(searchAllChildren.toLowerCase()) ||
    child.customSerialId?.toLowerCase().includes(searchAllChildren.toLowerCase())
  ) : [];

  const filteredTodayRegistrations = Array.isArray(todayData) ? todayData.filter(child =>
    child.fullName?.toLowerCase().includes(searchTodayReg.toLowerCase()) ||
    child.customSerialId?.toLowerCase().includes(searchTodayReg.toLowerCase())
  ) : [];

  const filteredFingerprintData = Array.isArray(fingerprintData) ? fingerprintData.filter(fp =>
    fp.childName?.toLowerCase().includes(searchFingerprints.toLowerCase()) ||
    fp.customSerialId?.toLowerCase().includes(searchFingerprints.toLowerCase())
  ) : [];

  const filteredYoungPatients = Array.isArray(youngPatients) ? youngPatients.filter(child =>
    child.fullName?.toLowerCase().includes(searchYoung.toLowerCase()) ||
    child.customSerialId?.toLowerCase().includes(searchYoung.toLowerCase())
  ) : [];

  const filteredOlderPatients = Array.isArray(olderPatients) ? olderPatients.filter(child =>
    child.fullName?.toLowerCase().includes(searchOlder.toLowerCase()) ||
    child.customSerialId?.toLowerCase().includes(searchOlder.toLowerCase())
  ) : [];

  // ===== USE EFFECTS =====
  useEffect(() => {
    const initData = async () => {
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        await fetchStaffUsers();
        await fetchLocations();
        await fetchChildren();
        await fetchTodayRegistrations();
        await fetchFingerprints();
        await generateRegistrationId();
      } else {
        navigate("/login");
      }
      setLoading(false);
    };
    initData();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      generateRegistrationId();
    }
  }, [childrenData.length, user]);

  useEffect(() => {
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (loading)
    return (
      <div className="child-reg-dashboard-loading">
        <div className="child-reg-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  if (!user) return null;

  // ===== RENDER =====
  return (
    <Layout user={user} onLogout={handleLogout}>
      <ToastNotification />
      <div className="child-registration-container">
        {showPrintPage && <PrintPage />}
        {!showPrintPage && activePage === "list" && (
          <RenderListPage
            user={user}
            childrenData={childrenData}
            todayData={todayData}
            fingerprintData={fingerprintData}
            youngPatients={youngPatients}
            olderPatients={olderPatients}
            offlineMode={offlineMode}
            isSyncing={isSyncing}
            isLoading={isLoading || isDeleting || isAddingChild || isSavingChild}
            handleStatClick={handleStatClick}
            handleActionClick={handleActionClick}
            handleAddRegistrationClick={handleAddRegistrationClick}
            handleVerifyFingerprintClick={handleVerifyFingerprintClick}
            handleSyncOfflineData={handleSyncOfflineData}
            navigateToPage={navigateToPage}
            getUserDisplayName={getUserDisplayName}
          />
        )}
        {!showPrintPage && activePage === "register" && (
          <RenderRegistrationPage
            registrationStep={registrationStep}
            formData={formData}
            formErrors={formErrors}
            generatedId={generatedId}
            locations={locations}
            preview1={preview1}
            preview2={preview2}
            preview3={preview3}
            showCamera1={showCamera1}
            showCamera2={showCamera2}
            showCamera3={showCamera3}
            videoRef1={videoRef1}
            videoRef2={videoRef2}
            videoRef3={videoRef3}
            canvasRef1={canvasRef1}
            canvasRef2={canvasRef2}
            canvasRef3={canvasRef3}
            fileInputRef1={fileInputRef1}
            fileInputRef2={fileInputRef2}
            fileInputRef3={fileInputRef3}
            fingerNames={fingerNames}
            selectedFinger={regSelectedFinger}
            fingerCaptures={regFingerCaptures}
            fingerQuality={regFingerQuality}
            capturedFingers={regCapturedFingers}
            isCapturing={regIsCapturing}
            isSavingFingerprints={isSavingFingerprints}
            handleSelectFinger={handleRegSelectFinger}
            handleCaptureFingerprint={handleRegCaptureFingerprint}
            handleRemoveFingerprint={handleRegRemoveFingerprint}
            handleSkipFingerprints={handleRegSkipFingerprints}
            handleSaveFingerprints={handleRegSaveFingerprints}
            handleFormChangeWithValidation={handleFormChangeWithValidation}
            handleAgeChange={handleAgeChange}
            handleFileUpload={handleFileUpload}
            startCamera={startCamera}
            capturePhoto={capturePhoto}
            stopCamera={stopCamera}
            validateForm={validateForm}
            showToast={showToast}
            goBack={goBack}
            setRegistrationStep={setRegistrationStep}
            handleCompleteRegistration={handleRegComplete}
            isSubmitting={isSavingFingerprints}
            isAddingChild={isAddingChild}
          />
        )}
        {!showPrintPage && activePage === "verify" && (
          <RenderVerifyPage
            fingerprintExists={fingerprintExists}
            existingChild={existingChild}
            existingChildImages={existingChildImages}
            isVerifying={isVerifying}
            handleVerifyFingerprintScan={handleVerifyFingerprintScan}
            handleLoadExistingRecord={handleLoadExistingRecord}
            goBack={goBack}
            navigateToPage={navigateToPage}
            getLocationName={getLocationName}
            calculateAgeFromYear={calculateAgeFromYear}
            setFingerprintExists={setFingerprintExists}
            setExistingChild={setExistingChild}
            setExistingChildImages={setExistingChildImages}
          />
        )}
        {!showPrintPage && activePage === "childrenList" && (
          <RenderAllChildrenList
            childrenData={childrenData}
            fingerprintData={fingerprintData}
            searchAllChildren={searchAllChildren}
            setSearchAllChildren={setSearchAllChildren}
            handleViewChild={handleViewChild}
            handleEditChild={handleEditChild}
            handleEnrollFingerprint={handleEnrollFingerprint}
            handleDeleteChild={handleDeleteChild}
            calculateAgeFromYear={calculateAgeFromYear}
            getLocationName={getLocationName}
            getStaffNameById={getStaffNameById}
            goBack={goBack}
            handleVerifyFingerprintClick={handleVerifyFingerprintClick}
            handleAddRegistrationClick={handleAddRegistrationClick}
            handlePrintClick={handlePrintClick}
            isDeleting={isDeleting}
            deletingChildId={deletingChildId}
          />
        )}
        {!showPrintPage && activePage === "todayList" && (
          <RenderTodayRegistrations
            todayData={todayData}
            fingerprintData={fingerprintData}
            searchTodayReg={searchTodayReg}
            setSearchTodayReg={setSearchTodayReg}
            handleViewChild={handleViewChild}
            handleEditChild={handleEditChild}
            handleEnrollFingerprint={handleEnrollFingerprint}
            handleDeleteChild={handleDeleteChild}
            calculateAgeFromYear={calculateAgeFromYear}
            getLocationName={getLocationName}
            getStaffNameById={getStaffNameById}
            goBack={goBack}
            handleVerifyFingerprintClick={handleVerifyFingerprintClick}
            handleAddRegistrationClick={handleAddRegistrationClick}
            handlePrintClick={handlePrintClick}
            isLoading={isLoading || isSavingChild}
            isDeleting={isDeleting}
            deletingChildId={deletingChildId}
          />
        )}
        {!showPrintPage && activePage === "fingerprintsList" && (
          <RenderFingerprintsList
            fingerprintData={fingerprintData}
            searchFingerprints={searchFingerprints}
            setSearchFingerprints={setSearchFingerprints}
            handleViewChild={handleViewChild}
            childrenData={childrenData}
            showToast={showToast}
            goBack={goBack}
            handleVerifyFingerprintClick={handleVerifyFingerprintClick}
            handleAddRegistrationClick={handleAddRegistrationClick}
            handlePrintClick={handlePrintClick}
            getStaffNameById={getStaffNameById}
            isLoading={isLoading || isDeleting}
          />
        )}
        {!showPrintPage && activePage === "locations" && (
          <RenderLocationsManagement
            locations={locations}
            searchLocations={searchLocations}
            setSearchLocations={setSearchLocations}
            showLocationForm={showLocationForm}
            locationFormData={locationFormData}
            locationFormErrors={locationFormErrors}
            editingLocation={editingLocation}
            handleLocationFormChange={handleLocationFormChange}
            resetLocationForm={resetLocationForm}
            handleSaveLocation={handleSaveLocation}
            handleEditLocation={handleEditLocation}
            handleDeleteLocation={handleDeleteLocation}
            goBack={goBack}
            handleAddNewLocation={handleAddNewLocation}
            isAddingLocation={isAddingLocation}
            setShowLocationForm={setShowLocationForm}
          />
        )}
        {!showPrintPage && activePage === "enroll_fingerprint" && (
          <RenderFingerprintEnrollment
            enrollingChild={enrollingChild}
            isCapturing={isCapturing}
            selectedFinger={selectedFinger}
            fingerCaptures={fingerCaptures}
            fingerQuality={fingerQuality}
            capturedFingers={capturedFingers}
            fingerNames={fingerNames}
            handleCancelEnrollment={handleCancelEnrollment}
            handleSelectFinger={handleSelectFinger}
            handleCaptureFingerprint={handleCaptureFingerprint}
            handleRemoveFingerprint={handleRemoveFingerprint}
            handleSkipFingerprints={handleSkipFingerprints}
            handleSaveFingerprints={handleSaveFingerprints}
            isSavingFingerprints={isSavingFingerprints}
          />
        )}
        {!showPrintPage && activePage === "view_child" && (
          <RenderChildViewPage
            viewingChild={viewingChild}
            fingerprintData={fingerprintData}
            calculateAgeFromYear={calculateAgeFromYear}
            getLocationName={getLocationName}
            getStaffNameById={getStaffNameById}
            handleEditChild={handleEditChild}
            goBack={goBack}
            isLoading={isLoading || isSavingChild || isDeleting}
          />
        )}
        {!showPrintPage && activePage === "edit_child" && (
          <RenderChildEditPage
            editingChild={editingChild}
            childFormData={childFormData}
            childFormErrors={childFormErrors}
            locations={locations}
            handleChildFormChange={handleChildFormChange}
            handleChildAgeChange={handleChildAgeChange}
            handleSaveChild={handleSaveChild}
            goBack={goBack}
            isSavingChild={isSavingChild}
          />
        )}
        {!showPrintPage && activePage === "youngPatients" && (
          <RenderYoungPatientsList
            youngPatients={youngPatients}
            searchYoung={searchYoung}
            setSearchYoung={setSearchYoung}
            fingerprintData={fingerprintData}
            handleViewChild={handleViewChild}
            handleEditChild={handleEditChild}
            handleEnrollFingerprint={handleEnrollFingerprint}
            handleDeleteChild={handleDeleteChild}
            calculateAgeFromYear={calculateAgeFromYear}
            getLocationName={getLocationName}
            getStaffNameById={getStaffNameById}
            goBack={goBack}
            handleVerifyFingerprintClick={handleVerifyFingerprintClick}
            handleAddRegistrationClick={handleAddRegistrationClick}
            handlePrintClick={handlePrintClick}
            isLoading={isLoading || isSavingChild}
            isDeleting={isDeleting}
            deletingChildId={deletingChildId}
          />
        )}
        {!showPrintPage && activePage === "olderPatients" && (
          <RenderOlderPatientsList
            olderPatients={olderPatients}
            searchOlder={searchOlder}
            setSearchOlder={setSearchOlder}
            fingerprintData={fingerprintData}
            handleViewChild={handleViewChild}
            handleEditChild={handleEditChild}
            handleEnrollFingerprint={handleEnrollFingerprint}
            handleDeleteChild={handleDeleteChild}
            calculateAgeFromYear={calculateAgeFromYear}
            getLocationName={getLocationName}
            getStaffNameById={getStaffNameById}
            goBack={goBack}
            handleVerifyFingerprintClick={handleVerifyFingerprintClick}
            handleAddRegistrationClick={handleAddRegistrationClick}
            handlePrintClick={handlePrintClick}
            isLoading={isLoading || isSavingChild}
            isDeleting={isDeleting}
            deletingChildId={deletingChildId}
          />
        )}
      </div>
    </Layout>
  );
};

export default ChildRegistration;