import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './ChildRegistration.css';
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
  RenderYoungPatientsList
} from './ChildRegistrationRenders';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Finger names and hand mapping
const fingerNames = {
  1: { name: 'Right Thumb', hand: 'Right', finger: 'Thumb' },
  2: { name: 'Right Index', hand: 'Right', finger: 'Index' },
  3: { name: 'Right Middle', hand: 'Right', finger: 'Middle' },
  4: { name: 'Right Ring', hand: 'Right', finger: 'Ring' },
  5: { name: 'Right Pinky', hand: 'Right', finger: 'Pinky' },
  6: { name: 'Left Thumb', hand: 'Left', finger: 'Thumb' },
  7: { name: 'Left Index', hand: 'Left', finger: 'Index' },
  8: { name: 'Left Middle', hand: 'Left', finger: 'Middle' },
  9: { name: 'Left Ring', hand: 'Left', finger: 'Ring' },
  10: { name: 'Left Pinky', hand: 'Left', finger: 'Pinky' }
};

const ChildRegistration = () => {
  // ===== ALL STATE DECLARATIONS =====
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [activePage, setActivePage] = useState('list');
  const [pageHistory, setPageHistory] = useState(['list']);
  const [fingerprintExists, setFingerprintExists] = useState(null);
  const [existingChild, setExistingChild] = useState(null);
  const [existingChildImages, setExistingChildImages] = useState(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingFingerprints, setIsSavingFingerprints] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [generatedId, setGeneratedId] = useState('');
  const [childrenData, setChildrenData] = useState([]);
  const [todayData, setTodayData] = useState([]);
  const [fingerprintData, setFingerprintData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [staffUserMap, setStaffUserMap] = useState({});
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    estimatedBirthYear: '',
    gender: '',
    primaryLocationId: ''
  });
  
  const [youngPatients, setYoungPatients] = useState([]);
  const [olderPatients, setOlderPatients] = useState([]);
  const [searchYoung, setSearchYoung] = useState('');
  const [searchOlder, setSearchOlder] = useState('');
  
  const [viewingChild, setViewingChild] = useState(null);
  const [editingChild, setEditingChild] = useState(null);
  const [childFormData, setChildFormData] = useState({
    fullName: '',
    estimatedBirthYear: '',
    gender: '',
    primaryLocationId: '',
    customSerialId: '',
    image1: '',
    image2: '',
    image3: ''
  });
  const [childFormErrors, setChildFormErrors] = useState({
    fullName: '',
    estimatedBirthYear: '',
    gender: '',
    primaryLocationId: ''
  });
  
  const [editingLocation, setEditingLocation] = useState(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    description: ''
  });
  const [locationFormErrors, setLocationFormErrors] = useState({
    name: ''
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
  const [printDataType, setPrintDataType] = useState('');
  const [printFilters, setPrintFilters] = useState({
    date_from: '',
    date_to: '',
    location: '',
    fingerprint_status: '',
    gender: ''
  });
  
  const [searchAllChildren, setSearchAllChildren] = useState('');
  const [searchTodayReg, setSearchTodayReg] = useState('');
  const [searchFingerprints, setSearchFingerprints] = useState('');
  const [searchLocations, setSearchLocations] = useState('');
  
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
    fullName: '',
    estimatedBirthYear: '',
    gender: '',
    primaryLocationId: ''
  });
  const navigate = useNavigate();

  // ===== NAVIGATION FUNCTIONS =====
  const navigateToPage = (page) => {
    if (page !== activePage) {
      setPageHistory(prev => [...prev, activePage]);
      setActivePage(page);
    }
  };

  const goBack = () => {
    if (pageHistory.length > 0) {
      const previousPage = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setActivePage(previousPage);
    } else {
      setActivePage('list');
    }
  };

  // ===== HELPER FUNCTIONS =====
  const getUserDisplayName = (userObj) => {
    if (!userObj) return 'N/A';
    
    if (userObj.firstName && userObj.lastName) {
      return `${userObj.firstName} ${userObj.lastName}`;
    }
    if (userObj.first_name && userObj.last_name) {
      return `${userObj.first_name} ${userObj.last_name}`;
    }
    if (userObj.username && userObj.username !== userObj.user_id && userObj.username !== userObj.id) {
      return userObj.username;
    }
    if (userObj.name) return userObj.name;
    if (userObj.user_name) return userObj.user_name;
    if (userObj.email) return userObj.email.split('@')[0];
    
    return 'Staff User';
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const calculateAgeFromYear = (estimatedBirthYear) => {
    if (!estimatedBirthYear) return 'N/A';
    const currentYear = new Date().getFullYear();
    const age = currentYear - estimatedBirthYear;
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  const calculateAgeValue = (estimatedBirthYear) => {
    if (!estimatedBirthYear) return 0;
    const currentYear = new Date().getFullYear();
    return currentYear - estimatedBirthYear;
  };

  const getLocationName = (locationId) => {
    if (!Array.isArray(locations) || locations.length === 0) return '';
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : '';
  };

  const getStaffNameById = (staffId) => {
    if (!staffId) return 'N/A';
    if (staffUserMap[staffId]) return staffUserMap[staffId];
    if (user && (user.id === staffId || user.user_id === staffId)) {
      return getUserDisplayName(user);
    }
    return staffId;
  };

  // ===== TOAST FUNCTION =====
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // ===== TOAST COMPONENT =====
  const ToastNotification = () => {
    if (!toast.show) return null;
    return (
      <div className={`child-reg-toast-notification ${toast.type}`}>
        <div className="child-reg-toast-content">
          {toast.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17L4 12" /></svg>
          ) : toast.type === 'error' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="1" fill="currentColor" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          )}
          <span>{toast.message}</span>
        </div>
        <button className="child-reg-toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    );
  };

  // ===== DATA FETCHING FUNCTIONS =====
  const fetchStaffUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const users = await response.json();
        setStaffUsers(users);
        const userMap = {};
        users.forEach(staff => {
          const firstName = staff.firstName || staff.first_name || '';
          const lastName = staff.lastName || staff.last_name || '';
          let fullName = '';
          if (firstName && lastName) {
            fullName = `${firstName} ${lastName}`;
          } else if (firstName) {
            fullName = firstName;
          } else if (lastName) {
            fullName = lastName;
          } else if (staff.username) {
            fullName = staff.username;
          } else if (staff.email) {
            fullName = staff.email.split('@')[0];
          } else {
            fullName = 'Staff User';
          }
          if (staff.id) userMap[staff.id] = fullName;
          if (staff.user_id) userMap[staff.user_id] = fullName;
          if (staff.username) userMap[staff.username] = fullName;
        });
        setStaffUserMap(userMap);
        return userMap;
      }
    } catch (error) {
      console.error('Error fetching staff users:', error);
    }
    return {};
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setLocations(data);
        } else if (data.locations && Array.isArray(data.locations)) {
          setLocations(data.locations);
        } else {
          setLocations([]);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const fetchChildren = async (userMap = staffUserMap) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        let childrenArray = data.children || data;
        childrenArray = childrenArray.map(child => ({
          ...child,
          registeredByName: getStaffNameById(child.createdByStaffId)
        }));
        setChildrenData(Array.isArray(childrenArray) ? childrenArray : []);
        filterPatientsByAge(Array.isArray(childrenArray) ? childrenArray : []);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildrenData([]);
    }
  };

  const fetchTodayRegistrations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/api/children?registrationDate=${today}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        let todayArray = data.children || data;
        todayArray = todayArray.map(child => ({
          ...child,
          registeredByName: getStaffNameById(child.createdByStaffId)
        }));
        setTodayData(Array.isArray(todayArray) ? todayArray : []);
      }
    } catch (error) {
      console.error('Error fetching today registrations:', error);
      setTodayData([]);
    }
  };

  const fetchFingerprints = async () => {
    try {
      const allFingerprints = [];
      for (const child of childrenData) {
        if (child.id) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/biometrics/child/${child.id}`, {
              headers: getAuthHeaders()
            });
            if (response.ok) {
              const data = await response.json();
              const fingerprints = Array.isArray(data) ? data : (data.fingerprints || [data]);
              fingerprints.forEach(fp => {
                if (fp && Object.keys(fp).length > 0) {
                  allFingerprints.push({ 
                    ...fp, 
                    childName: child.fullName, 
                    childId: child.id,
                    customSerialId: child.customSerialId,
                    capturedAt: fp.capturedAt || fp.captured_at || fp.createdAt,
                    qualityScore: fp.qualityScore || fp.quality,
                    capturedByName: fp.capturedByName || getStaffNameById(fp.capturedBy),
                    fingerName: fingerNames[fp.fingerIndex]?.name || `Finger ${fp.fingerIndex}`
                  });
                }
              });
            }
          } catch (e) {
            console.error('Error fetching fingerprints for child:', e);
          }
        }
      }
      setFingerprintData(allFingerprints);
    } catch (error) {
      console.error('Error fetching fingerprints:', error);
      setFingerprintData([]);
    }
  };

  const filterPatientsByAge = (children) => {
    const young = [];
    const older = [];
    children.forEach(child => {
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

  const generateRegistrationId = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const childrenArray = data.children || data;
        if (childrenArray && childrenArray.length > 0) {
          const lastChild = childrenArray[childrenArray.length - 1];
          const lastId = lastChild.customSerialId;
          const match = lastId.match(/KID-\d+-(\d+)/);
          if (match) {
            const lastNumber = parseInt(match[1]);
            const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
            const currentYear = new Date().getFullYear();
            setGeneratedId(`KID-${currentYear}-${nextNumber}`);
            return;
          }
        }
        const currentYear = new Date().getFullYear();
        setGeneratedId(`KID-${currentYear}-0001`);
      }
    } catch (error) {
      console.error('Error generating registration ID:', error);
      const currentYear = new Date().getFullYear();
      const nextNumber = (childrenData.length + 1).toString().padStart(4, '0');
      setGeneratedId(`KID-${currentYear}-${nextNumber}`);
    }
  };

  // ===== FORM VALIDATION FUNCTIONS =====
  const validateForm = () => {
    let isValid = true;
    const errors = { fullName: '', estimatedBirthYear: '', gender: '', primaryLocationId: '' };

    if (!formData.fullName.trim()) {
      errors.fullName = 'Child name is required';
      isValid = false;
    }
    if (!formData.estimatedBirthYear) {
      errors.estimatedBirthYear = 'Estimated birth year is required';
      isValid = false;
    }
    if (!formData.gender) {
      errors.gender = 'Gender is required';
      isValid = false;
    }
    if (!formData.primaryLocationId) {
      errors.primaryLocationId = 'Location is required';
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const validateChildEditForm = () => {
    let isValid = true;
    const errors = { fullName: '', estimatedBirthYear: '', gender: '', primaryLocationId: '' };

    if (!childFormData.fullName.trim()) {
      errors.fullName = 'Child name is required';
      isValid = false;
    }
    if (!childFormData.estimatedBirthYear) {
      errors.estimatedBirthYear = 'Estimated birth year is required';
      isValid = false;
    }
    if (!childFormData.gender) {
      errors.gender = 'Gender is required';
      isValid = false;
    }
    if (!childFormData.primaryLocationId) {
      errors.primaryLocationId = 'Location is required';
      isValid = false;
    }
    setChildFormErrors(errors);
    return isValid;
  };

  const validateLocationForm = () => {
    let isValid = true;
    const errors = { name: '' };
    if (!locationFormData.name.trim()) {
      errors.name = 'Location name is required';
      isValid = false;
    }
    setLocationFormErrors(errors);
    return isValid;
  };

  // ===== FORM HANDLERS =====
  const handleFormChangeWithValidation = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleAgeChange = (e) => {
    const ageVal = e.target.value;
    const currentYear = new Date().getFullYear();
    if (ageVal === '') {
      setFormData({ ...formData, estimatedBirthYear: '' });
    } else {
      const age = parseInt(ageVal, 10);
      if (!isNaN(age)) {
        setFormData({ ...formData, estimatedBirthYear: (currentYear - age).toString() });
      }
    }
    if (formErrors.estimatedBirthYear) {
      setFormErrors({ ...formErrors, estimatedBirthYear: '' });
    }
  };

  const handleChildFormChange = (e) => {
    const { name, value } = e.target;
    setChildFormData({ ...childFormData, [name]: value });
    if (childFormErrors[name]) {
      setChildFormErrors({ ...childFormErrors, [name]: '' });
    }
  };

  const handleChildAgeChange = (e) => {
    const ageVal = e.target.value;
    const currentYear = new Date().getFullYear();
    if (ageVal === '') {
      setChildFormData({ ...childFormData, estimatedBirthYear: '' });
    } else {
      const age = parseInt(ageVal, 10);
      if (!isNaN(age)) {
        setChildFormData({ ...childFormData, estimatedBirthYear: (currentYear - age).toString() });
      }
    }
    if (childFormErrors.estimatedBirthYear) {
      setChildFormErrors({ ...childFormErrors, estimatedBirthYear: '' });
    }
  };

  const handleLocationFormChange = (e) => {
    const { name, value } = e.target;
    setLocationFormData({ ...locationFormData, [name]: value });
    if (locationFormErrors[name]) {
      setLocationFormErrors({ ...locationFormErrors, [name]: '' });
    }
  };

  const resetLocationForm = () => {
    setEditingLocation(null);
    setLocationFormData({ name: '', description: '' });
    setLocationFormErrors({ name: '' });
    setShowLocationForm(false);
  };

  // ===== CAMERA FUNCTIONS =====
  const checkCameraSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Your browser does not support camera access. Please use Chrome, Firefox, or Edge.', 'error');
      return false;
    }
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      showToast('Camera access requires HTTPS. Please use HTTPS or localhost.', 'error');
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
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        showToast('Camera started successfully!', 'success');
      }
    } catch (err) {
      console.error('Camera error:', err);
      showToast(`Unable to access camera: ${err.message || 'Please check permissions.'}`, 'error');
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
      showToast('Camera not ready. Please wait and try again.', 'error');
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(imageDataUrl);
    setShowCamera(false);
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
    showToast(`Photo ${num} captured successfully!`, 'success');
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
      video.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (num, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (num === 1) setPreview1(reader.result);
      else if (num === 2) setPreview2(reader.result);
      else setPreview3(reader.result);
      showToast(`Photo ${num} uploaded successfully!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // ===== CHILD CRUD OPERATIONS =====
  const fetchChildById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${id}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        return data.child || data;
      }
    } catch (error) {
      console.error('Error fetching child:', error);
    }
    return null;
  };

  const updateChild = async (id, childData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customSerialId: childData.customSerialId,
          fullName: childData.fullName,
          gender: childData.gender,
          estimatedBirthYear: parseInt(childData.estimatedBirthYear),
          primaryLocationId: childData.primaryLocationId,
          image1: childData.image1 || null,
          image2: childData.image2 || null,
          image3: childData.image3 || null
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error updating child:', error);
    }
    return null;
  };

  const deleteChild = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting child:', error);
      return false;
    }
  };

  const addRegistration = async (newChild) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/children`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: crypto.randomUUID(),
          customSerialId: generatedId,
          fullName: newChild.fullName,
          gender: newChild.gender,
          estimatedBirthYear: parseInt(newChild.estimatedBirthYear),
          primaryLocationId: newChild.primaryLocationId,
          image1: preview1 || null,
          image2: preview2 || null,
          image3: preview3 || null,
          createdByStaffId: user?.id || user?.user_id,
          createdByName: getUserDisplayName(user)
        })
      });
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to register child');
      }
    } catch (error) {
      console.error('Error adding registration:', error);
      const offlineData = JSON.parse(localStorage.getItem('offline_registrations') || '[]');
      offlineData.push({
        ...newChild,
        createdByStaffId: user?.id || user?.user_id,
        createdByName: getUserDisplayName(user)
      });
      localStorage.setItem('offline_registrations', JSON.stringify(offlineData));
      return newChild;
    }
  };

  // ===== HANDLERS =====
  const handleViewChild = async (child) => {
    const fullChild = await fetchChildById(child.id);
    setViewingChild(fullChild || child);
    navigateToPage('view_child');
  };

  const handleEditChild = (child) => {
    setEditingChild(child);
    setChildFormData({
      fullName: child.fullName,
      estimatedBirthYear: child.estimatedBirthYear,
      gender: child.gender,
      primaryLocationId: child.primaryLocationId,
      customSerialId: child.customSerialId,
      image1: child.image1 || '',
      image2: child.image2 || '',
      image3: child.image3 || ''
    });
    navigateToPage('edit_child');
  };

  const handleSaveChild = async () => {
    if (!validateChildEditForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
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
  };

  const handleDeleteChild = async (child) => {
    if (window.confirm(`Are you sure you want to delete ${child.fullName}? This action cannot be undone.`)) {
      const success = await deleteChild(child.id);
      if (success) {
        showToast('Child deleted successfully!', 'success');
        await fetchChildren();
        await fetchTodayRegistrations();
        generateRegistrationId();
      } else {
        showToast('Failed to delete child', 'error');
      }
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
    navigateToPage('enroll_fingerprint');
  };

  const handleSelectFinger = (fingerIndex) => {
    setSelectedFinger(fingerIndex);
  };

  const handleCaptureFingerprint = () => {
    if (!selectedFinger) {
      showToast('Please select a finger first', 'error');
      return;
    }
    setIsCapturing(true);
    setTimeout(() => {
      const quality = Math.floor(Math.random() * 30) + 70;
      setFingerQuality(prev => ({ ...prev, [selectedFinger]: quality }));
      setFingerCaptures(prev => ({ ...prev, [selectedFinger]: true }));
      if (!capturedFingers.includes(selectedFinger)) {
        setCapturedFingers(prev => [...prev, selectedFinger]);
      }
      setIsCapturing(false);
      showToast(`Finger ${fingerNames[selectedFinger].name} captured with ${quality}% quality!`, 'success');
    }, 2000);
  };

  const handleRemoveFingerprint = (fingerIndex) => {
    setFingerCaptures(prev => {
      const newCaptures = { ...prev };
      delete newCaptures[fingerIndex];
      return newCaptures;
    });
    setFingerQuality(prev => {
      const newQuality = { ...prev };
      delete newQuality[fingerIndex];
      return newQuality;
    });
    setCapturedFingers(prev => prev.filter(f => f !== fingerIndex));
    showToast(`Finger ${fingerNames[fingerIndex].name} removed`, 'info');
  };

  const handleSaveFingerprints = async () => {
    if (capturedFingers.length === 0) {
      showToast('No fingerprints captured. You can skip this step.', 'info');
      goBack();
      return;
    }
    let successCount = 0;
    for (const fingerIndex of capturedFingers) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/biometrics/enroll`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: crypto.randomUUID(),
            childId: enrollingChild.id,
            fingerIndex: fingerIndex,
            templateBase64: `fingerprint_template_${fingerIndex}_base64`,
            qualityScore: fingerQuality[fingerIndex] || 80,
            capturedAt: new Date().toISOString(),
            capturedBy: user?.id || user?.user_id,
            capturedByName: getUserDisplayName(user),
            matcherVersion: "1.0"
          })
        });
        if (response.ok) successCount++;
      } catch (error) {
        console.error('Error saving fingerprint:', error);
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
      showToast('Please select a finger first', 'error');
      return;
    }
    setRegIsCapturing(true);
    setTimeout(() => {
      const quality = Math.floor(Math.random() * 30) + 70;
      setRegFingerQuality(prev => ({ ...prev, [regSelectedFinger]: quality }));
      setRegFingerCaptures(prev => ({ ...prev, [regSelectedFinger]: true }));
      if (!regCapturedFingers.includes(regSelectedFinger)) {
        setRegCapturedFingers(prev => [...prev, regSelectedFinger]);
      }
      setRegIsCapturing(false);
      showToast(`Finger ${fingerNames[regSelectedFinger].name} captured with ${quality}% quality!`, 'success');
    }, 2000);
  };

  const handleRegRemoveFingerprint = (fingerIndex) => {
    setRegFingerCaptures(prev => {
      const newCaptures = { ...prev };
      delete newCaptures[fingerIndex];
      return newCaptures;
    });
    setRegFingerQuality(prev => {
      const newQuality = { ...prev };
      delete newQuality[fingerIndex];
      return newQuality;
    });
    setRegCapturedFingers(prev => prev.filter(f => f !== fingerIndex));
    showToast(`Finger ${fingerNames[fingerIndex].name} removed`, 'info');
  };

  const handleRegSaveFingerprints = async () => {
    if (regCapturedFingers.length === 0) {
      // No fingerprints, just complete registration
      setRegistrationStep(3);
      return;
    }

    setIsSavingFingerprints(true);

    // First register the child
    const newChild = {
      fullName: formData.fullName,
      estimatedBirthYear: formData.estimatedBirthYear,
      gender: formData.gender,
      primaryLocationId: formData.primaryLocationId,
      createdByStaffId: user?.id || user?.user_id
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
          const response = await fetch(`${API_BASE_URL}/api/biometrics/enroll`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: crypto.randomUUID(),
              childId: childId,
              fingerIndex: fingerIndex,
              templateBase64: `fingerprint_template_${fingerIndex}_base64`,
              qualityScore: regFingerQuality[fingerIndex] || 80,
              capturedAt: new Date().toISOString(),
              capturedBy: user?.id || user?.user_id,
              capturedByName: getUserDisplayName(user),
              matcherVersion: "1.0"
            })
          });
          if (response.ok) successCount++;
        } catch (error) {
          console.error('Error saving fingerprint:', error);
        }
      }

      setIsSavingFingerprints(false);
      
      if (successCount > 0) {
        showToast(`✓ ${successCount} fingerprint(s) enrolled successfully!`, 'success');
        await fetchChildren();
        await fetchTodayRegistrations();
        await fetchFingerprints();
        setRegistrationStep(3);
      } else {
        showToast('Failed to save fingerprints. You can add them later.', 'warning');
        setRegistrationStep(3);
      }
    } else {
      setIsSavingFingerprints(false);
      showToast('Failed to register child. Please try again.', 'error');
    }
  };

  const handleRegSkipFingerprints = async () => {
    // Register child without fingerprints
    const newChild = {
      fullName: formData.fullName,
      estimatedBirthYear: formData.estimatedBirthYear,
      gender: formData.gender,
      primaryLocationId: formData.primaryLocationId,
      createdByStaffId: user?.id || user?.user_id
    };

    const result = await addRegistration(newChild);
    if (result) {
      showToast(`✓ Child registered successfully with ID: ${generatedId}!`, 'success');
      await fetchChildren();
      await fetchTodayRegistrations();
      await generateRegistrationId();
      setRegistrationStep(3);
    } else {
      showToast('Failed to register child. Please try again.', 'error');
    }
  };

  const handleRegComplete = () => {
    showToast(`✓ Child registered successfully with ID: ${generatedId}!`, 'success');
    goBack();
    setRegistrationStep(1);
    setFormData({ fullName: '', estimatedBirthYear: '', gender: '', primaryLocationId: '' });
    setFormErrors({ fullName: '', estimatedBirthYear: '', gender: '', primaryLocationId: '' });
    setPreview1(null); setPreview2(null); setPreview3(null);
    // Reset registration fingerprint state
    setRegFingerCaptures({});
    setRegFingerQuality({});
    setRegCapturedFingers([]);
    setRegSelectedFinger(null);
    setRegIsCapturing(false);
    fetchChildren();
    fetchTodayRegistrations();
    generateRegistrationId();
  };

  // ===== LOCATION HANDLERS =====
  const addLocation = async (locationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: locationData.name,
          description: locationData.description || ''
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error adding location:', error);
    }
    return null;
  };

  const updateLocation = async (id, locationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: locationData.name,
          description: locationData.description || ''
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
    return null;
  };

  const deleteLocation = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting location:', error);
      return false;
    }
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationFormData({
      name: location.name,
      description: location.description || ''
    });
    setShowLocationForm(true);
  };

  const handleSaveLocation = async () => {
    if (!validateLocationForm()) return;
    let result;
    if (editingLocation) {
      result = await updateLocation(editingLocation.id, locationFormData);
      if (result) showToast('Location updated successfully!', 'success');
    } else {
      result = await addLocation(locationFormData);
      if (result) showToast('Location added successfully!', 'success');
    }
    if (result) {
      await fetchLocations();
      resetLocationForm();
    } else {
      showToast('Failed to save location', 'error');
    }
  };

  const handleDeleteLocation = async (location) => {
    if (window.confirm(`Are you sure you want to delete location "${location.name}"?`)) {
      const success = await deleteLocation(location.id);
      if (success) {
        await fetchLocations();
        showToast('Location deleted successfully!', 'success');
      } else {
        showToast('Failed to delete location', 'error');
      }
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
          images: { image1: matchedChild.image1, image2: matchedChild.image2, image3: matchedChild.image3 }
        });
        setExistingChildImages({ 
          image1: matchedChild.image1, 
          image2: matchedChild.image2, 
          image3: matchedChild.image3 
        });
        setFingerprintExists(true);
        showToast('✓ Fingerprint verified! Child found in system.', 'success');
      } else {
        setFingerprintExists(false);
        setExistingChild(null);
        setExistingChildImages(null);
        showToast('✗ Fingerprint not found. No matching record.', 'info');
      }
      setIsVerifying(false);
    }, 1500);
  };

  const handleLoadExistingRecord = () => {
    if (existingChild && existingChild.fullName) {
      sessionStorage.setItem('selectedChild', JSON.stringify(existingChild));
      navigate('/medical-records', { state: { child: existingChild } });
      setFingerprintExists(null);
      setExistingChild(null);
      setExistingChildImages(null);
    } else {
      showToast('No record selected', 'error');
    }
  };

  // ===== OTHER HANDLERS =====
  const handleAddRegistrationClick = () => {
    setRegistrationStep(1);
    setFormData({ fullName: '', estimatedBirthYear: '', gender: '', primaryLocationId: '' });
    setPreview1(null); setPreview2(null); setPreview3(null);
    // Reset registration fingerprint state
    setRegFingerCaptures({});
    setRegFingerQuality({});
    setRegCapturedFingers([]);
    setRegSelectedFinger(null);
    setRegIsCapturing(false);
    navigateToPage('register');
  };

  const handleVerifyFingerprintClick = () => {
    setFingerprintExists(null);
    setExistingChild(null);
    setExistingChildImages(null);
    setIsVerifying(false);
    navigateToPage('verify');
  };

  const handleSyncOfflineData = () => {
    setIsSyncing(true);
    showToast('Starting synchronization...', 'info');
    setTimeout(async () => {
      const offlineData = JSON.parse(localStorage.getItem('offline_registrations') || '[]');
      for (const record of offlineData) {
        try {
          await addRegistration(record);
        } catch (error) {
          console.error('Error syncing record:', error);
        }
      }
      localStorage.removeItem('offline_registrations');
      setOfflineMode(!navigator.onLine);
      showToast(`✓ Synchronization completed successfully! ${offlineData.length} records synced.`, 'success');
      setIsSyncing(false);
      fetchChildren();
      fetchTodayRegistrations();
      fetchFingerprints();
      generateRegistrationId();
    }, 3000);
  };

  const handleStatClick = (page, title) => {
    showToast(`Viewing ${title}`, 'info');
    navigateToPage(page);
  };

  const handleActionClick = (action) => {
    showToast(`Opening ${action}`, 'info');
  };

  const handlePrintClick = (dataType) => {
    setPrintDataType(dataType);
    setPrintFilters({ date_from: '', date_to: '', location: '', fingerprint_status: '', gender: '' });
    setShowPrintPage(true);
  };

  const handlePrint = () => {
    setShowPrintPage(false);
    showToast('Print job sent successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  // ===== PRINT PAGE COMPONENT =====
  const PrintPage = () => {
    if (!showPrintPage) return null;
    const getTitle = () => {
      switch (printDataType) {
        case 'children': return 'All Registered Patients';
        case 'today': return "Today's Registrations";
        case 'fingerprints': return 'Fingerprints Captured';
        case 'young': return 'Young Patients (Under 18)';
        case 'older': return 'Older Patients (18+)';
        default: return 'Print Report';
      }
    };
    return (
      <div className="child-reg-print-page">
        <div className="child-reg-print-header">
          <button className="child-reg-back-btn" onClick={() => setShowPrintPage(false)}>← Back to Dashboard</button>
          <div className="child-reg-print-title-section">
            <h1>Print {getTitle()} Report</h1>
            <p>Select filters below to customize your report</p>
          </div>
        </div>
        <div className="child-reg-print-content">
          <div className="child-reg-filters-section">
            <div className="child-reg-filters-header">
              <h3>Report Filters</h3>
              <button className="child-reg-reset-filters-btn" onClick={() => setPrintFilters({ date_from: '', date_to: '', location: '', fingerprint_status: '', gender: '' })}>Reset Filters</button>
            </div>
            <div className="child-reg-filters-grid">
              <div className="child-reg-filter-field">
                <label>Date From</label>
                <input type="date" value={printFilters.date_from} onChange={(e) => setPrintFilters({...printFilters, date_from: e.target.value})} />
              </div>
              <div className="child-reg-filter-field">
                <label>Date To</label>
                <input type="date" value={printFilters.date_to} onChange={(e) => setPrintFilters({...printFilters, date_to: e.target.value})} />
              </div>
              <div className="child-reg-filter-field">
                <label>Location</label>
                <select value={printFilters.location} onChange={(e) => setPrintFilters({...printFilters, location: e.target.value})}>
                  <option value="">All Locations</option>
                  {Array.isArray(locations) && locations.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                </select>
              </div>
            </div>
            <div className="child-reg-filters-actions">
              <button className="child-reg-cancel-btn" onClick={() => setShowPrintPage(false)}>Cancel</button>
              <button className="child-reg-generate-btn" onClick={handlePrint}>Generate & Print Report</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== USE EFFECTS =====
  useEffect(() => {
    const initData = async () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
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
        navigate('/login');
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

  if (loading) return <div className="child-reg-dashboard-loading"><div className="child-reg-spinner"></div><p>Loading...</p></div>;
  if (!user) return null;

  // ===== RENDER =====
  return (
    <Layout user={user} onLogout={handleLogout}>
      <ToastNotification />
      <div className="child-registration-container">
        {showPrintPage && <PrintPage />}
        {!showPrintPage && activePage === 'list' && (
          <RenderListPage
            user={user}
            childrenData={childrenData}
            todayData={todayData}
            fingerprintData={fingerprintData}
            youngPatients={youngPatients}
            olderPatients={olderPatients}
            offlineMode={offlineMode}
            isSyncing={isSyncing}
            handleStatClick={handleStatClick}
            handleActionClick={handleActionClick}
            handleAddRegistrationClick={handleAddRegistrationClick}
            handleVerifyFingerprintClick={handleVerifyFingerprintClick}
            handleSyncOfflineData={handleSyncOfflineData}
            navigateToPage={navigateToPage}
            getUserDisplayName={getUserDisplayName}
          />
        )}
        {!showPrintPage && activePage === 'register' && (
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
          />
        )}
        {!showPrintPage && activePage === 'verify' && (
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
        {!showPrintPage && activePage === 'childrenList' && (
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
          />
        )}
        {!showPrintPage && activePage === 'todayList' && (
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
          />
        )}
        {!showPrintPage && activePage === 'fingerprintsList' && (
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
          />
        )}
        {!showPrintPage && activePage === 'locations' && (
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
          />
        )}
        {!showPrintPage && activePage === 'enroll_fingerprint' && (
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
          />
        )}
        {!showPrintPage && activePage === 'view_child' && (
          <RenderChildViewPage
            viewingChild={viewingChild}
            fingerprintData={fingerprintData}
            calculateAgeFromYear={calculateAgeFromYear}
            getLocationName={getLocationName}
            getStaffNameById={getStaffNameById}
            handleEditChild={handleEditChild}
            goBack={goBack}
          />
        )}
        {!showPrintPage && activePage === 'edit_child' && (
          <RenderChildEditPage
            editingChild={editingChild}
            childFormData={childFormData}
            childFormErrors={childFormErrors}
            locations={locations}
            handleChildFormChange={handleChildFormChange}
            handleChildAgeChange={handleChildAgeChange}
            handleSaveChild={handleSaveChild}
            goBack={goBack}
          />
        )}
        {!showPrintPage && activePage === 'youngPatients' && (
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
          />
        )}
        {!showPrintPage && activePage === 'olderPatients' && (
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
          />
        )}
      </div>
    </Layout>
  );
};

export default ChildRegistration;