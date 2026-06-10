import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './ChildRegistration.css';

// API base URL
const API_BASE_URL = 'http://localhost:9865';

const ChildRegistration = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [activePage, setActivePage] = useState('list');
  const [pageHistory, setPageHistory] = useState(['list']); // Navigation history
  const [fingerprintExists, setFingerprintExists] = useState(null);
  const [existingChild, setExistingChild] = useState(null);
  const [existingChildImages, setExistingChildImages] = useState(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
  
  // Child View/Edit Page States
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
  
  // Location Management States
  const [editingLocation, setEditingLocation] = useState(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    description: ''
  });
  const [locationFormErrors, setLocationFormErrors] = useState({
    name: ''
  });
  
  // Fingerprint Enrollment Page States
  const [enrollingChild, setEnrollingChild] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [fingerprintQuality, setFingerprintQuality] = useState(null);
  
  // Print page states
  const [showPrintPage, setShowPrintPage] = useState(false);
  const [printDataType, setPrintDataType] = useState('');
  const [printFilters, setPrintFilters] = useState({
    date_from: '',
    date_to: '',
    location: '',
    fingerprint_status: '',
    gender: ''
  });
  
  // Search states
  const [searchAllChildren, setSearchAllChildren] = useState('');
  const [searchTodayReg, setSearchTodayReg] = useState('');
  const [searchFingerprints, setSearchFingerprints] = useState('');
  const [searchRecent, setSearchRecent] = useState('');
  const [searchLocations, setSearchLocations] = useState('');
  
  const [picture1, setPicture1] = useState(null);
  const [picture2, setPicture2] = useState(null);
  const [picture3, setPicture3] = useState(null);
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

  // Navigation functions with history
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

  // Helper function to get user display name
  const getUserDisplayName = () => {
    if (!user) return 'N/A';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.username && user.username !== user.user_id && user.username !== user.id) {
      return user.username;
    }
    if (user.name) return user.name;
    if (user.user_name) return user.user_name;
    if (user.email) return user.email.split('@')[0];
    
    return 'Staff User';
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Check camera support
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

  // Fetch staff users for mapping
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

  // Get staff name from user ID
  const getStaffNameById = (staffId, userMap = staffUserMap) => {
    if (!staffId) return 'N/A';
    
    if (userMap[staffId]) {
      return userMap[staffId];
    }
    
    if (user && (user.id === staffId || user.user_id === staffId || user.username === staffId)) {
      return getUserDisplayName();
    }
    
    const staff = staffUsers.find(s => s.id === staffId || s.user_id === staffId || s.username === staffId);
    if (staff) {
      const firstName = staff.firstName || staff.first_name || '';
      const lastName = staff.lastName || staff.last_name || '';
      if (firstName && lastName) return `${firstName} ${lastName}`;
      if (firstName) return firstName;
      if (lastName) return lastName;
      return staff.username || staff.email || 'Staff';
    }
    
    if (staffId && (staffId.includes('-') || staffId.length > 20)) {
      return 'Unknown Staff';
    }
    
    if (staffId && !staffId.includes('-') && staffId.length < 30) {
      return staffId;
    }
    
    return staffId;
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const errors = {
      fullName: '',
      estimatedBirthYear: '',
      gender: '',
      primaryLocationId: ''
    };

    if (!formData.fullName.trim()) {
      errors.fullName = 'Child name is required';
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Child name must be at least 2 characters';
      isValid = false;
    }

    if (!formData.estimatedBirthYear) {
      errors.estimatedBirthYear = 'Estimated birth year is required';
      isValid = false;
    } else {
      const year = parseInt(formData.estimatedBirthYear);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        errors.estimatedBirthYear = `Year must be between 1900 and ${currentYear}`;
        isValid = false;
      }
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

  // Clear specific error when field changes
  const handleFormChangeWithValidation = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Validate child edit form
  const validateChildEditForm = () => {
    let isValid = true;
    const errors = {
      fullName: '',
      estimatedBirthYear: '',
      gender: '',
      primaryLocationId: ''
    };

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

  const handleChildFormChange = (e) => {
    const { name, value } = e.target;
    setChildFormData({ ...childFormData, [name]: value });
    if (childFormErrors[name]) {
      setChildFormErrors({ ...childFormErrors, [name]: '' });
    }
  };

  // Generate registration ID
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
      } else {
        const currentYear = new Date().getFullYear();
        const nextNumber = (childrenData.length + 1).toString().padStart(4, '0');
        setGeneratedId(`KID-${currentYear}-${nextNumber}`);
      }
    } catch (error) {
      console.error('Error generating registration ID:', error);
      const currentYear = new Date().getFullYear();
      const nextNumber = (childrenData.length + 1).toString().padStart(4, '0');
      setGeneratedId(`KID-${currentYear}-${nextNumber}`);
    }
  };

  // Child CRUD Operations
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

  // View child details page
  const handleViewChild = async (child) => {
    const fullChild = await fetchChildById(child.id);
    setViewingChild(fullChild || child);
    navigateToPage('view_child');
  };

  // Edit child page
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
    setChildFormErrors({
      fullName: '',
      estimatedBirthYear: '',
      gender: '',
      primaryLocationId: ''
    });
    navigateToPage('edit_child');
  };

  // Save edited child
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

  // Delete child handler
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

  // Fingerprint Enrollment
  const handleEnrollFingerprint = (child) => {
    setEnrollingChild(child);
    setFingerprintQuality(null);
    setIsCapturing(false);
    navigateToPage('enroll_fingerprint');
  };

  const handleCaptureFingerprint = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const quality = Math.floor(Math.random() * 30) + 70;
      setFingerprintQuality(quality);
      setIsCapturing(false);
      showToast(`Fingerprint captured with ${quality}% quality!`, 'success');
    }, 2000);
  };

  const handleSaveFingerprint = async () => {
    if (!fingerprintQuality) {
      showToast('Please capture fingerprint first', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/biometrics/enroll`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: crypto.randomUUID(),
          childId: enrollingChild.id,
          fingerIndex: 1,
          templateBase64: "sample_fingerprint_template_base64",
          qualityScore: fingerprintQuality,
          capturedAt: new Date().toISOString(),
          capturedBy: user?.id || user?.user_id,
          capturedByName: getUserDisplayName(),
          matcherVersion: "1.0"
        })
      });

      if (response.ok) {
        showToast(`Fingerprint enrolled successfully for ${enrollingChild.fullName}!`, 'success');
        await fetchChildren();
        await fetchTodayRegistrations();
        await fetchFingerprints();
        goBack();
        setEnrollingChild(null);
        setFingerprintQuality(null);
      } else {
        showToast('Failed to save fingerprint', 'error');
      }
    } catch (error) {
      console.error('Error saving fingerprint:', error);
      showToast('Error saving fingerprint', 'error');
    }
  };

  const handleCancelEnrollment = () => {
    goBack();
    setEnrollingChild(null);
    setFingerprintQuality(null);
    setIsCapturing(false);
  };

  // Location CRUD Operations
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
        } else if (data.data && Array.isArray(data.data)) {
          setLocations(data.data);
        } else {
          console.error('Unexpected locations response format:', data);
          setLocations([]);
        }
      } else {
        console.error('Failed to fetch locations:', response.status);
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

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
      } else {
        throw new Error('Failed to add location');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      return null;
    }
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
      } else {
        throw new Error('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      return null;
    }
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
      if (result) {
        showToast('Location updated successfully!', 'success');
      }
    } else {
      result = await addLocation(locationFormData);
      if (result) {
        showToast('Location added successfully!', 'success');
      }
    }

    if (result) {
      await fetchLocations();
      resetLocationForm();
    } else {
      showToast('Failed to save location', 'error');
    }
  };

  const handleDeleteLocation = async (location) => {
    if (window.confirm(`Are you sure you want to delete location "${location.name}"? This may affect children registered with this location.`)) {
      const success = await deleteLocation(location.id);
      if (success) {
        await fetchLocations();
        showToast('Location deleted successfully!', 'success');
      } else {
        showToast('Failed to delete location', 'error');
      }
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
          registeredByName: getStaffNameById(child.createdByStaffId, userMap)
        }));
        
        setChildrenData(Array.isArray(childrenArray) ? childrenArray : []);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildrenData([]);
    }
  };

  const fetchTodayRegistrations = async (userMap = staffUserMap) => {
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
          registeredByName: getStaffNameById(child.createdByStaffId, userMap)
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
                    capturedByName: fp.capturedByName || getStaffNameById(fp.capturedBy)
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

  const addRegistration = async (newChild) => {
    const creatorName = getUserDisplayName();
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
          createdByName: creatorName
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
        createdByName: creatorName
      });
      localStorage.setItem('offline_registrations', JSON.stringify(offlineData));
      return newChild;
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const getLocationName = (locationId) => {
    if (!Array.isArray(locations) || locations.length === 0) return '';
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : '';
  };

  // Camera Functions
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
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        showToast('Camera started successfully!', 'success');
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast('Camera permission denied. Please click the camera icon in the address bar and allow access, then refresh the page.', 'error');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        showToast('No camera found on your device. Please connect a camera.', 'error');
      } else {
        showToast(`Unable to access camera: ${err.message || 'Please check permissions.'}`, 'error');
      }
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
      if (num === 1) {
        setPreview1(reader.result);
      } else if (num === 2) {
        setPreview2(reader.result);
      } else {
        setPreview3(reader.result);
      }
      showToast(`Photo ${num} uploaded successfully!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleFingerprintCapture = () => {
    if (Math.random() > 0.2) {
      showToast('✓ Fingerprint captured successfully!', 'success');
      setFingerprintCaptured(true);
      setRegistrationStep(3);
    } else {
      showToast('✗ Fingerprint capture failed. Please try again.', 'error');
    }
  };

  const handleVerifyFingerprintScan = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const matchedChild = Array.isArray(childrenData) ? childrenData.find(child => child.customSerialId === 'KID-2024-0001') || childrenData[0] : null;
      
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
          fingerprintCaptured: matchedChild.fingerprintCaptured,
          medicalHistory: matchedChild.medicalHistory || 'No known allergies',
          lastVisit: new Date().toLocaleDateString(),
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

  const handleCompleteRegistration = async () => {
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const newChild = {
      fullName: formData.fullName,
      estimatedBirthYear: formData.estimatedBirthYear,
      gender: formData.gender,
      primaryLocationId: formData.primaryLocationId,
      fingerprintCaptured: fingerprintCaptured,
      createdByStaffId: user?.id || user?.user_id
    };

    const result = await addRegistration(newChild);
    
    if (result) {
      showToast(offlineMode 
        ? `✓ Child registered in OFFLINE mode with ID: ${generatedId}. Data will sync when online.` 
        : `✓ Child registered successfully with ID: ${generatedId}!`, 
        'success'
      );
      
      goBack();
      setRegistrationStep(1);
      setFingerprintCaptured(false);
      setFormData({ fullName: '', estimatedBirthYear: '', gender: '', primaryLocationId: '' });
      setFormErrors({ fullName: '', estimatedBirthYear: '', gender: '', primaryLocationId: '' });
      setPreview1(null); setPreview2(null); setPreview3(null);
      await fetchChildren();
      await fetchTodayRegistrations();
      await generateRegistrationId();
    }
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
      const isOnline = navigator.onLine;
      setOfflineMode(!isOnline);
      
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

  const calculateAgeFromYear = (estimatedBirthYear) => {
    if (!estimatedBirthYear) return 'N/A';
    const currentYear = new Date().getFullYear();
    const age = currentYear - estimatedBirthYear;
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  // Handle Add Registration button click - navigates to registration page
  const handleAddRegistrationClick = () => {
    setRegistrationStep(1);
    setFingerprintCaptured(false);
    setFormData({ fullName: '', estimatedBirthYear: '', gender: '', primaryLocationId: '' });
    setPreview1(null); setPreview2(null); setPreview3(null);
    showToast('Starting new child registration', 'info');
    navigateToPage('register');
  };

  // Handle Verify Fingerprint button click - navigates to verify page
  const handleVerifyFingerprintClick = () => {
    setFingerprintExists(null);
    setExistingChild(null);
    setExistingChildImages(null);
    setIsVerifying(false);
    showToast('Opening fingerprint verification', 'info');
    navigateToPage('verify');
  };

  const handlePrint = () => {
    let dataToPrint = [];
    let title = '';

    switch (printDataType) {
      case 'children':
        dataToPrint = [...filteredAllChildren];
        title = 'All Registered Children Report';
        break;
      case 'today':
        dataToPrint = [...filteredTodayRegistrations];
        title = 'Today\'s Registrations Report';
        break;
      case 'fingerprints':
        dataToPrint = [...filteredFingerprintData];
        title = 'Fingerprints Captured Report';
        break;
      default:
        dataToPrint = [];
    }

    const printWindow = window.open('', '_blank');
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
            .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
            .status-captured { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            @media print { body { padding: 0; } th { background: #667eea !important; color: white !important; } }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <h1>${title}</h1>
              <div class="subtitle">Field Outreach and Street Medicine System</div>
              <div class="date-info">Generated on: ${new Date().toLocaleString()}</div>
              <div class="date-info">Generated by: ${user?.username || user?.name || 'Unknown User'}</div>
            </div>
            <div class="filters-applied">
              <strong>Filters Applied:</strong> 
              ${printFilters.date_from ? `Date From: ${printFilters.date_from} | ` : ''}
              ${printFilters.date_to ? `Date To: ${printFilters.date_to} | ` : ''}
              ${printFilters.location ? `Location: ${printFilters.location} | ` : ''}
              ${printFilters.gender ? `Gender: ${printFilters.gender} | ` : ''}
              ${printFilters.fingerprint_status ? `Fingerprint: ${printFilters.fingerprint_status === 'captured' ? 'Captured' : 'Pending'} | ` : ''}
              ${!printFilters.date_from && !printFilters.date_to && !printFilters.location && !printFilters.gender && !printFilters.fingerprint_status ? 'None' : ''}
            </div>
            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  ${printDataType === 'children' || printDataType === 'today' ? `
                    <th>ID</th>
                    <th>Child Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Location</th>
                    <th>Registration Date</th>
                    <th>Fingerprint</th>
                    <th>Registered By</th>
                  ` : ''}
                  ${printDataType === 'fingerprints' ? `
                    <th>Child ID</th>
                    <th>Child Name</th>
                    <th>Capture Date</th>
                    <th>Quality</th>
                    <th>Captured By</th>
                  ` : ''}
                </tr>
              </thead>
              <tbody>
                ${dataToPrint.map((item, index) => {
                  if (printDataType === 'children' || printDataType === 'today') {
                    const age = calculateAgeFromYear(item.estimatedBirthYear);
                    return `
                      <tr>
                        <td style="text-align: center;">${index + 1}</td>
                        <td>${item.customSerialId || 'N/A'}</td>
                        <td>${item.fullName || 'N/A'}</td>
                        <td>${age}</td>
                        <td>${item.gender || 'N/A'}</td>
                        <td>${getLocationName(item.primaryLocationId) || 'N/A'}</td>
                        <td>${item.createdAt ? item.createdAt.split('T')[0] : 'N/A'}</td>
                        <td><span class="status-badge status-pending">Pending</span></td>
                        <td>${item.registeredByName || 'N/A'}</td>
                      </tr>
                    `;
                  } else if (printDataType === 'fingerprints') {
                    const formattedDate = item.capturedAt ? new Date(item.capturedAt).toLocaleString() : 'N/A';
                    const quality = item.qualityScore || 0;
                    const capturedByName = item.capturedByName || 'N/A';
                    return `
                      <tr>
                        <td style="text-align: center;">${index + 1}</td>
                        <td>${item.customSerialId || 'N/A'}</td>
                        <td>${item.childName || 'N/A'}</td>
                        <td>${formattedDate}</td>
                        <td><span class="status-badge ${quality >= 70 ? 'status-captured' : 'status-pending'}">${quality || 'Good'}%</span></td>
                        <td>${capturedByName}</td>
                      </tr>
                    `;
                  }
                  return '';
                }).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>This is a system generated report from Medical System</p>
              <p>Total Records: ${dataToPrint.length}</p>
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
    showToast('Print job sent successfully!', 'success');
  };

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

  const filteredLocations = Array.isArray(locations) ? locations.filter(location =>
    location.name?.toLowerCase().includes(searchLocations.toLowerCase())
  ) : [];

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

  const PrintPage = () => {
    if (!showPrintPage) return null;
    
    const getTitle = () => {
      switch (printDataType) {
        case 'children': return 'All Registered Children';
        case 'today': return "Today's Registrations";
        case 'fingerprints': return 'Fingerprints Captured';
        default: return 'Print Report';
      }
    };

    const handleResetFilters = () => {
      setPrintFilters({
        date_from: '',
        date_to: '',
        location: '',
        fingerprint_status: '',
        gender: ''
      });
      showToast('Filters reset successfully!', 'info');
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
              <button className="child-reg-reset-filters-btn" onClick={handleResetFilters}>Reset Filters</button>
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
              {printDataType !== 'fingerprints' && (
                <>
                  <div className="child-reg-filter-field">
                    <label>Gender</label>
                    <div className="child-reg-gender-buttons">
                      <button className={`child-reg-gender-btn ${printFilters.gender === 'Male' ? 'active' : ''}`} onClick={() => setPrintFilters({...printFilters, gender: printFilters.gender === 'Male' ? '' : 'Male'})}>Male</button>
                      <button className={`child-reg-gender-btn ${printFilters.gender === 'Female' ? 'active' : ''}`} onClick={() => setPrintFilters({...printFilters, gender: printFilters.gender === 'Female' ? '' : 'Female'})}>Female</button>
                    </div>
                  </div>
                  <div className="child-reg-filter-field">
                    <label>Fingerprint Status</label>
                    <div className="child-reg-status-buttons">
                      <button className={`child-reg-status-btn ${printFilters.fingerprint_status === 'captured' ? 'active captured' : ''}`} onClick={() => setPrintFilters({...printFilters, fingerprint_status: printFilters.fingerprint_status === 'captured' ? '' : 'captured'})}>Captured</button>
                      <button className={`child-reg-status-btn ${printFilters.fingerprint_status === 'pending' ? 'active pending' : ''}`} onClick={() => setPrintFilters({...printFilters, fingerprint_status: printFilters.fingerprint_status === 'pending' ? '' : 'pending'})}>Pending</button>
                    </div>
                  </div>
                </>
              )}
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

  // Child View Page
  const renderChildViewPage = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Child Details</h1>
        </div>
      </div>

      <div className="child-reg-view-container">
        <div className="child-reg-view-images-section">
          <h3>Child Photos</h3>
          <div className="child-reg-view-images-grid">
            {viewingChild?.image1 && (
              <div className="child-reg-view-image-card">
                <img src={viewingChild.image1} alt="Child photo 1" />
                <span>Photo 1</span>
              </div>
            )}
            {viewingChild?.image2 && (
              <div className="child-reg-view-image-card">
                <img src={viewingChild.image2} alt="Child photo 2" />
                <span>Photo 2</span>
              </div>
            )}
            {viewingChild?.image3 && (
              <div className="child-reg-view-image-card">
                <img src={viewingChild.image3} alt="Child photo 3" />
                <span>Photo 3</span>
              </div>
            )}
            {!viewingChild?.image1 && !viewingChild?.image2 && !viewingChild?.image3 && (
              <div className="child-reg-no-images-message">
                <p>No photos available for this child</p>
              </div>
            )}
          </div>
        </div>

        <div className="child-reg-view-info-section">
          <div className="child-reg-info-grid">
            <div className="child-reg-info-item">
              <label>ID:</label>
              <span>{viewingChild?.customSerialId || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Full Name:</label>
              <span>{viewingChild?.fullName || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Estimated Birth Year:</label>
              <span>{viewingChild?.estimatedBirthYear || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Age:</label>
              <span>{calculateAgeFromYear(viewingChild?.estimatedBirthYear)}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Gender:</label>
              <span>{viewingChild?.gender || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Location:</label>
              <span>{getLocationName(viewingChild?.primaryLocationId)}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Registration Date:</label>
              <span>{viewingChild?.createdAt ? viewingChild.createdAt.split('T')[0] : 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Fingerprint Status:</label>
              <span className="child-reg-status-badge child-reg-status-pending">
                {viewingChild?.fingerprintCaptured ? 'Captured' : 'Pending'}
              </span>
            </div>
            <div className="child-reg-info-item">
              <label>Registered By:</label>
              <span>{viewingChild?.registeredByName || getStaffNameById(viewingChild?.createdByStaffId) || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Version:</label>
              <span>{viewingChild?.version || 1}</span>
            </div>
          </div>
        </div>

        <div className="child-reg-view-actions">
          <button 
            className="child-reg-btn-primary" 
            onClick={() => {
              handleEditChild(viewingChild);
            }}
          >
            Edit Child
          </button>
          <button 
            className="child-reg-btn-secondary" 
            onClick={goBack}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Child Edit Page
  const renderChildEditPage = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Edit Child</h1>
        </div>
        <p>Editing: <strong>{editingChild?.fullName}</strong> (ID: {editingChild?.customSerialId})</p>
      </div>

      <div className="child-reg-edit-container">
        <div className="child-reg-form-grid">
          <div className="child-reg-form-group">
            <label>Child's Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={childFormData.fullName}
              onChange={handleChildFormChange}
              placeholder="Enter child's full name"
              className={childFormErrors.fullName ? 'error-input' : ''}
            />
            {childFormErrors.fullName && <span className="error-message">{childFormErrors.fullName}</span>}
          </div>
          <div className="child-reg-form-group">
            <label>Estimated Birth Year *</label>
            <input
              type="number"
              name="estimatedBirthYear"
              value={childFormData.estimatedBirthYear}
              onChange={handleChildFormChange}
              placeholder="e.g., 2020"
              className={childFormErrors.estimatedBirthYear ? 'error-input' : ''}
            />
            {childFormErrors.estimatedBirthYear && <span className="error-message">{childFormErrors.estimatedBirthYear}</span>}
          </div>
          <div className="child-reg-form-group">
            <label>Gender *</label>
            <select
              name="gender"
              value={childFormData.gender}
              onChange={handleChildFormChange}
              className={childFormErrors.gender ? 'error-input' : ''}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {childFormErrors.gender && <span className="error-message">{childFormErrors.gender}</span>}
          </div>
          <div className="child-reg-form-group">
            <label>Primary Location *</label>
            <select
              name="primaryLocationId"
              value={childFormData.primaryLocationId}
              onChange={handleChildFormChange}
              className={childFormErrors.primaryLocationId ? 'error-input' : ''}
            >
              <option value="">Select Location</option>
              {Array.isArray(locations) && locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {childFormErrors.primaryLocationId && <span className="error-message">{childFormErrors.primaryLocationId}</span>}
          </div>
        </div>

        <div className="child-reg-form-actions">
          <button className="child-reg-btn-secondary" onClick={goBack}>Cancel</button>
          <button className="child-reg-btn-primary" onClick={handleSaveChild}>Save Changes</button>
        </div>
      </div>
    </div>
  );

  const renderFingerprintEnrollment = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={handleCancelEnrollment}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Enroll Fingerprint</h1>
        </div>
        <p className="child-reg-page-subtitle">
          Enrolling fingerprint for: <strong>{enrollingChild?.fullName}</strong> (ID: {enrollingChild?.customSerialId})
        </p>
      </div>

      <div className="child-reg-enrollment-container">
        <div className="child-reg-fingerprint-scanner">
          <div className="child-reg-scanner-area">
            {!fingerprintQuality ? (
              <>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.5">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                  <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
                  <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"/>
                  <path d="M18 12C18 8.69 15.31 6 12 6"/>
                </svg>
                <p>Place finger on the scanner and click Capture</p>
                {isCapturing && (
                  <div className="child-reg-scanning-animation">
                    <div className="child-reg-scan-line"></div>
                    <p>Scanning fingerprint...</p>
                  </div>
                )}
                <button 
                  className="child-reg-btn-primary" 
                  onClick={handleCaptureFingerprint}
                  disabled={isCapturing}
                >
                  {isCapturing ? 'Capturing...' : 'Capture Fingerprint'}
                </button>
              </>
            ) : (
              <div className="child-reg-capture-success">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2">
                  <path d="M20 6L9 17L4 12" />
                </svg>
                <h3>Fingerprint Captured!</h3>
                <p>Quality Score: <strong>{fingerprintQuality}%</strong></p>
                <div className="child-reg-quality-bar">
                  <div 
                    className={`child-reg-quality-fill ${fingerprintQuality >= 80 ? 'excellent' : fingerprintQuality >= 60 ? 'good' : 'poor'}`}
                    style={{ width: `${fingerprintQuality}%` }}
                  ></div>
                </div>
                <div className="child-reg-enrollment-actions">
                  <button className="child-reg-btn-secondary" onClick={() => setFingerprintQuality(null)}>
                    Recapture
                  </button>
                  <button className="child-reg-btn-primary" onClick={handleSaveFingerprint}>
                    Save Fingerprint
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="child-reg-enrollment-info">
          <h3>Enrollment Instructions</h3>
          <ul>
            <li>Place your finger flat on the scanner</li>
            <li>Keep your finger still while scanning</li>
            <li>Ensure the finger is clean and dry</li>
            <li>Center your fingerprint on the sensor</li>
            <li>Quality score above 70% is recommended</li>
          </ul>
          <div className="child-reg-fingerprint-tips">
            <h4>Tips for best results:</h4>
            <p>✓ Press firmly but not too hard</p>
            <p>✓ Position finger at the center</p>
            <p>✓ Avoid sideways or angled placement</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationsManagement = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Manage Locations</h1>
          <button className="child-reg-add-btn" onClick={() => {
            resetLocationForm();
            setShowLocationForm(true);
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Location
          </button>
        </div>
        <p className="child-reg-page-subtitle">Total locations: {Array.isArray(locations) ? locations.length : 0}</p>
      </div>
      
      {showLocationForm && (
        <div className="child-reg-location-form-container">
          <h3>{editingLocation ? 'Edit Location' : 'Add New Location'}</h3>
          <div className="child-reg-form-grid">
            <div className="child-reg-form-group">
              <label>Location Name *</label>
              <input
                type="text"
                name="name"
                value={locationFormData.name}
                onChange={handleLocationFormChange}
                placeholder="e.g., Arusha, Dar es Salaam - Ilala, Mwanza"
                className={locationFormErrors.name ? 'error-input' : ''}
              />
              {locationFormErrors.name && <span className="error-message">{locationFormErrors.name}</span>}
            </div>
            <div className="child-reg-form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={locationFormData.description}
                onChange={handleLocationFormChange}
                placeholder="Additional information about this location"
                rows="3"
              />
            </div>
          </div>
          <div className="child-reg-form-actions">
            <button className="child-reg-btn-secondary" onClick={resetLocationForm}>Cancel</button>
            <button className="child-reg-btn-primary" onClick={handleSaveLocation}>
              {editingLocation ? 'Update Location' : 'Add Location'}
            </button>
          </div>
        </div>
      )}
      
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input 
          type="text" 
          placeholder="Search by location name..." 
          value={searchLocations} 
          onChange={(e) => setSearchLocations(e.target.value)} 
        />
      </div>
      
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Location Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.map((location, index) => (
              <tr key={location.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td><strong>{location.name}</strong></td>
                <td>{location.description || '—'}</td>
                <td>
                  <button 
                    className="child-reg-action-btn child-reg-edit-btn" 
                    onClick={() => handleEditLocation(location)}
                    title="Edit Location"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3L21 7L7 21H3V17L17 3Z" />
                    </svg>
                  </button>
                  <button 
                    className="child-reg-action-btn child-reg-delete-btn" 
                    onClick={() => handleDeleteLocation(location)}
                    title="Delete Location"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7H20" strokeWidth="2" />
                      <path d="M10 11V17" strokeWidth="2" />
                      <path d="M14 11V17" strokeWidth="2" />
                      <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2" />
                      <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLocations.length === 0 && (
          <div className="child-reg-no-data">
            <p>No locations found. Click "Add New Location" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );

  // All Children List with Add Registration and Verify Fingerprint Buttons
  const renderAllChildrenList = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">All Registered Children</h1>
          <div className="child-reg-header-button-group">
            <button className="child-reg-verify-btn-header" onClick={handleVerifyFingerprintClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
              </svg>
              Verify Fingerprint
            </button>
            <button className="child-reg-add-registration-btn" onClick={handleAddRegistrationClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Registration
            </button>
            <button className="child-reg-print-btn-page" onClick={() => handlePrintClick('children')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3H18V9" /><path d="M6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21Z" /><path d="M18 15H6" /></svg>
              Print Report
            </button>
          </div>
        </div>
        <p className="child-reg-page-subtitle">Total: {Array.isArray(childrenData) ? childrenData.length : 0} children registered in the system</p>
      </div>
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input type="text" placeholder="Search by name or ID..." value={searchAllChildren} onChange={(e) => setSearchAllChildren(e.target.value)} />
      </div>
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>ID</th>
              <th>Child Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Location</th>
              <th>Registration Date</th>
              <th>Fingerprint</th>
              <th>Registered By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAllChildren.map((child, index) => (
              <tr key={child.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>{child.customSerialId}</td>
                <td>{child.fullName}</td>
                <td>{calculateAgeFromYear(child.estimatedBirthYear)}</td>
                <td>{child.gender}</td>
                <td>{getLocationName(child.primaryLocationId)}</td>
                <td>{child.createdAt ? child.createdAt.split('T')[0] : 'N/A'}</td>
                <td>
                  <span className={`child-reg-status-badge ${child.fingerprintCaptured ? 'child-reg-status-completed' : 'child-reg-status-pending'}`}>
                    {child.fingerprintCaptured ? 'Captured' : 'Pending'}
                  </span>
                </td>
                <td>{child.registeredByName || getStaffNameById(child.createdByStaffId) || 'N/A'}</td>
                <td>
                  <div className="child-reg-action-buttons">
                    <button 
                      className="child-reg-action-icon-btn child-reg-view-btn" 
                      onClick={() => handleViewChild(child)}
                      title="View Details"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button 
                      className="child-reg-action-icon-btn child-reg-edit-btn" 
                      onClick={() => handleEditChild(child)}
                      title="Edit Child"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3L21 7L7 21H3V17L17 3Z" />
                      </svg>
                    </button>
                    {!child.fingerprintCaptured && (
                      <button 
                        className="child-reg-action-icon-btn child-reg-fingerprint-btn" 
                        onClick={() => handleEnrollFingerprint(child)}
                        title="Add Fingerprint"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      </button>
                    )}
                    <button 
                      className="child-reg-action-icon-btn child-reg-delete-btn" 
                      onClick={() => handleDeleteChild(child)}
                      title="Delete Child"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7H20" strokeWidth="2" />
                        <path d="M10 11V17" strokeWidth="2" />
                        <path d="M14 11V17" strokeWidth="2" />
                        <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2" />
                        <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Today's Registrations with Add Registration and Verify Fingerprint Buttons
  const renderTodayRegistrations = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Today's Registrations</h1>
          <div className="child-reg-header-button-group">
            <button className="child-reg-verify-btn-header" onClick={handleVerifyFingerprintClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
              </svg>
              Verify Fingerprint
            </button>
            <button className="child-reg-add-registration-btn" onClick={handleAddRegistrationClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Registration
            </button>
            <button className="child-reg-print-btn-page" onClick={() => handlePrintClick('today')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3H18V9" /><path d="M6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21Z" /><path d="M18 15H6" /></svg>
              Print Report
            </button>
          </div>
        </div>
        <p className="child-reg-page-subtitle">Date: {new Date().toLocaleDateString()} | Total: {Array.isArray(todayData) ? todayData.length : 0} children registered today</p>
      </div>
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input type="text" placeholder="Search by name or ID..." value={searchTodayReg} onChange={(e) => setSearchTodayReg(e.target.value)} />
      </div>
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>ID</th>
              <th>Child Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Location</th>
              <th>Registration Time</th>
              <th>Fingerprint</th>
              <th>Registered By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTodayRegistrations.map((child, index) => (
              <tr key={child.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>{child.customSerialId}</td>
                <td>{child.fullName}</td>
                <td>{calculateAgeFromYear(child.estimatedBirthYear)}</td>
                <td>{child.gender}</td>
                <td>{getLocationName(child.primaryLocationId)}</td>
                <td>{child.createdAt ? child.createdAt.split('T')[0] : 'N/A'}</td>
                <td>
                  <span className={`child-reg-status-badge ${child.fingerprintCaptured ? 'child-reg-status-completed' : 'child-reg-status-pending'}`}>
                    {child.fingerprintCaptured ? 'Captured' : 'Pending'}
                  </span>
                </td>
                <td>{child.registeredByName || getStaffNameById(child.createdByStaffId) || 'N/A'}</td>
                <td>
                  <div className="child-reg-action-buttons">
                    <button 
                      className="child-reg-action-icon-btn child-reg-view-btn" 
                      onClick={() => handleViewChild(child)}
                      title="View Details"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button 
                      className="child-reg-action-icon-btn child-reg-edit-btn" 
                      onClick={() => handleEditChild(child)}
                      title="Edit Child"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3L21 7L7 21H3V17L17 3Z" />
                      </svg>
                    </button>
                    {!child.fingerprintCaptured && (
                      <button 
                        className="child-reg-action-icon-btn child-reg-fingerprint-btn" 
                        onClick={() => handleEnrollFingerprint(child)}
                        title="Add Fingerprint"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      </button>
                    )}
                    <button 
                      className="child-reg-action-icon-btn child-reg-delete-btn" 
                      onClick={() => handleDeleteChild(child)}
                      title="Delete Child"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7H20" strokeWidth="2" />
                        <path d="M10 11V17" strokeWidth="2" />
                        <path d="M14 11V17" strokeWidth="2" />
                        <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2" />
                        <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTodayRegistrations.length === 0 && (
          <div className="child-reg-no-data">
            <p>No registrations today. Click "Add Registration" to register a new child.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Fingerprints List with Add Registration and Verify Fingerprint Buttons
  const renderFingerprintsList = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Fingerprints Captured</h1>
          <div className="child-reg-header-button-group">
            <button className="child-reg-verify-btn-header" onClick={handleVerifyFingerprintClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
              </svg>
              Verify Fingerprint
            </button>
            <button className="child-reg-add-registration-btn" onClick={handleAddRegistrationClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Registration
            </button>
            <button className="child-reg-print-btn-page" onClick={() => handlePrintClick('fingerprints')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V3H18V9" />
                <path d="M6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21Z" />
                <path d="M18 15H6" />
              </svg>
              Print Report
            </button>
          </div>
        </div>
        <p className="child-reg-page-subtitle">Total fingerprints captured: {Array.isArray(fingerprintData) ? fingerprintData.length : 0}</p>
      </div>
      
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input 
          type="text" 
          placeholder="Search by name or ID..." 
          value={searchFingerprints} 
          onChange={(e) => setSearchFingerprints(e.target.value)} 
        />
      </div>
      
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Child ID</th>
              <th>Child Name</th>
              <th>Capture Date & Time</th>
              <th>Quality</th>
              <th>Captured By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFingerprintData.map((fp, index) => {
              let formattedDate = 'N/A';
              if (fp.capturedAt) {
                const date = new Date(fp.capturedAt);
                formattedDate = date.toLocaleString();
              }
              
              const quality = fp.qualityScore || 0;
              
              let qualityClass = 'child-reg-quality-good';
              if (quality >= 80) qualityClass = 'child-reg-quality-excellent';
              else if (quality >= 60) qualityClass = 'child-reg-quality-good';
              else if (quality >= 40) qualityClass = 'child-reg-quality-fair';
              else qualityClass = 'child-reg-quality-poor';
              
              const capturedByName = fp.capturedByName || getStaffNameById(fp.capturedBy) || 'N/A';
              const childDisplayId = fp.customSerialId || fp.childId || 'N/A';
              
              return (
                <tr key={index}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>{childDisplayId}</td>
                  <td>{fp.childName || 'N/A'}</td>
                  <td>{formattedDate}</td>
                  <td>
                    <span className={`child-reg-quality-badge ${qualityClass}`}>
                      {quality ? `${quality}%` : 'Good'}
                    </span>
                  </td>
                  <td>{capturedByName}</td>
                  <td>
                    <div className="child-reg-action-buttons">
                      <button 
                        className="child-reg-action-icon-btn child-reg-view-btn" 
                        onClick={() => {
                          const childRecord = childrenData.find(c => c.id === fp.childId || c.customSerialId === fp.customSerialId);
                          if (childRecord) {
                            handleViewChild(childRecord);
                          } else {
                            showToast('Child record not found', 'error');
                          }
                        }}
                        title="View Child Details"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredFingerprintData.length === 0 && (
          <div className="child-reg-no-data">
            <p>No fingerprints captured yet. Click "Add Registration" to register a new child.</p>
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    const initData = async () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        const userMap = await fetchStaffUsers();
        await fetchLocations();
        await fetchChildren(userMap);
        await fetchTodayRegistrations(userMap);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const handlePrintClick = (dataType) => {
    setPrintDataType(dataType);
    setPrintFilters({ 
      date_from: '', 
      date_to: '', 
      location: '', 
      fingerprint_status: '', 
      gender: '' 
    });
    setShowPrintPage(true);
  };

  if (loading) return <div className="child-reg-dashboard-loading"><div className="child-reg-spinner"></div><p>Loading...</p></div>;
  if (!user) return null;

  const renderListPage = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <h1 className="child-reg-page-title">Child Registration</h1>
        <p className="child-reg-page-subtitle">Register new children and capture fingerprint data</p>
        {user && (
          <div className="child-reg-user-info">
            <span>Logged in as: <strong>{getUserDisplayName()}</strong> ({user.role || 'Staff'})</span>
          </div>
        )}
      </div>
      
      <div className="child-reg-stats-grid">
        <div className="child-reg-stat-card" onClick={() => handleStatClick('childrenList', 'All Children')}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/></svg></div>
            <div className="child-reg-stat-info"><h3>{Array.isArray(childrenData) ? childrenData.length : 0}</h3><p>Total Children</p></div>
          </div>
        </div>
        <div className="child-reg-stat-card" onClick={() => handleStatClick('todayList', 'Today\'s Registrations')}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/><path d="M14 2V8H20"/></svg></div>
            <div className="child-reg-stat-info"><h3>{Array.isArray(todayData) ? todayData.length : 0}</h3><p>Registered Today</p></div>
          </div>
        </div>
        <div className="child-reg-stat-card" onClick={() => handleStatClick('fingerprintsList', 'Fingerprints Captured')}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/><path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/><path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"/><path d="M18 12C18 8.69 15.31 6 12 6"/></svg></div>
            <div className="child-reg-stat-info"><h3>{Array.isArray(fingerprintData) ? fingerprintData.length : 0}</h3><p>Fingerprints Captured</p></div>
          </div>
        </div>
      </div>

      {offlineMode && (
        <div className="child-reg-offline-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="#856404"/></svg>
          You are in Offline Mode. Data will sync when connection is restored.
        </div>
      )}

      <div className="child-reg-section-title">Quick Actions</div>
      <div className="child-reg-actions-grid">
        <div className="child-reg-action-card" onClick={() => { handleActionClick('Register New Child'); navigateToPage('register'); }}>
          <div className="child-reg-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/></svg></div>
          <div className="child-reg-action-info"><h4>Register New Child</h4><p>Capture child information and details</p></div>
        </div>
        <div className="child-reg-action-card" onClick={() => { handleActionClick('Verify Fingerprint'); handleVerifyFingerprintClick(); }}>
          <div className="child-reg-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/><path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/></svg></div>
          <div className="child-reg-action-info"><h4>Verify Fingerprint</h4><p>Verify existing fingerprint records</p></div>
        </div>
        <div className="child-reg-action-card" onClick={() => { handleActionClick('Manage Locations'); navigateToPage('locations'); }}>
          <div className="child-reg-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg></div>
          <div className="child-reg-action-info"><h4>Manage Locations</h4><p>Add, edit, or delete locations</p></div>
        </div>
        <div className="child-reg-action-card" onClick={() => { if (!isSyncing) { handleActionClick('Sync Offline Data'); handleSyncOfflineData(); } }}>
          <div className="child-reg-action-icon">
            {isSyncing ? <div className="child-reg-sync-spinner"></div> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12H22"/><path d="M12 2V22"/><circle cx="12" cy="12" r="10"/></svg>}
          </div>
          <div className="child-reg-action-info"><h4>{isSyncing ? 'Syncing...' : 'Sync Offline Data'}</h4><p>{isSyncing ? 'Please wait while syncing...' : 'Synchronize local records with central database'}</p></div>
        </div>
      </div>

      <div className="child-reg-section-title">Registration Workflow</div>
      <div className="child-reg-workflow-steps">
        <div className="child-reg-workflow-step"><div className="child-reg-step-number">1</div><div className="child-reg-step-content"><h4>Register Child</h4><p>Enter child information & optional photos</p></div></div>
        <div className="child-reg-workflow-arrow">→</div>
        <div className="child-reg-workflow-step"><div className="child-reg-step-number">2</div><div className="child-reg-step-content"><h4>Capture Fingerprint</h4><p>Scan fingerprint</p></div></div>
        <div className="child-reg-workflow-arrow">→</div>
        <div className="child-reg-workflow-step"><div className="child-reg-step-number">3</div><div className="child-reg-step-content"><h4>Verify</h4><p>Check for duplicates</p></div></div>
        <div className="child-reg-workflow-arrow">→</div>
        <div className="child-reg-workflow-step"><div className="child-reg-step-number">4</div><div className="child-reg-step-content"><h4>Save</h4><p>{offlineMode ? 'Save to Offline DB' : 'Save to Online DB'}</p></div></div>
      </div>
    </div>
  );

  const renderRegistrationPage = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <h1 className="child-reg-page-title">Register New Child</h1>
        <p className="child-reg-page-subtitle">Enter child information and capture fingerprint</p>
        {generatedId && <div className="child-reg-generated-id"><strong>Registration ID:</strong> {generatedId}</div>}
      </div>

      {registrationStep === 1 && (
        <div className="child-reg-registration-form-container">
          <h3 className="child-reg-form-step-title">Step 1: Child Information <span style={{ color: 'red' }}>*Required fields</span></h3>
          <div className="child-reg-form-grid">
            <div className="child-reg-form-group">
              <label>Child's Full Name *</label>
              <input 
                type="text" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleFormChangeWithValidation} 
                placeholder="Enter child's name" 
                required 
                className={formErrors.fullName ? 'error-input' : ''}
              />
              {formErrors.fullName && <span className="error-message">{formErrors.fullName}</span>}
            </div>
            <div className="child-reg-form-group">
              <label>Estimated Birth Year *</label>
              <input 
                type="number" 
                name="estimatedBirthYear" 
                value={formData.estimatedBirthYear} 
                onChange={handleFormChangeWithValidation} 
                placeholder="e.g., 2016" 
                required 
                className={formErrors.estimatedBirthYear ? 'error-input' : ''}
              />
              {formErrors.estimatedBirthYear && <span className="error-message">{formErrors.estimatedBirthYear}</span>}
            </div>
            <div className="child-reg-form-group">
              <label>Gender *</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleFormChangeWithValidation} 
                required 
                className={formErrors.gender ? 'error-input' : ''}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {formErrors.gender && <span className="error-message">{formErrors.gender}</span>}
            </div>
            <div className="child-reg-form-group">
              <label>Primary Location *</label>
              <select 
                name="primaryLocationId" 
                value={formData.primaryLocationId} 
                onChange={handleFormChangeWithValidation} 
                required 
                className={formErrors.primaryLocationId ? 'error-input' : ''}
              >
                <option value="">Select Location</option>
                {Array.isArray(locations) && locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {formErrors.primaryLocationId && <span className="error-message">{formErrors.primaryLocationId}</span>}
            </div>
          </div>

          <div className="child-reg-pictures-section">
            <h3>Child Pictures (Optional - 3 photos)</h3>
            <p className="child-reg-optional-note">* Pictures are optional. You can skip or add later.</p>
            <div className="child-reg-pictures-grid">
              {[1, 2, 3].map(num => {
                const preview = num === 1 ? preview1 : num === 2 ? preview2 : preview3;
                const showCam = num === 1 ? showCamera1 : num === 2 ? showCamera2 : showCamera3;
                const videoR = num === 1 ? videoRef1 : num === 2 ? videoRef2 : videoRef3;
                const canvasR = num === 1 ? canvasRef1 : num === 2 ? canvasRef2 : canvasRef3;
                const fileR = num === 1 ? fileInputRef1 : num === 2 ? fileInputRef2 : fileInputRef3;
                return (
                  <div key={num} className="child-reg-picture-upload">
                    <div className="child-reg-picture-preview">
                      {preview ? (
                        <img src={preview} alt={`Child ${num}`} className="child-reg-preview-image" />
                      ) : (
                        <div className="child-reg-picture-placeholder">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="2" width="20" height="20" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="2.5"/>
                            <path d="M21 15L16 10L5 21"/>
                          </svg>
                          <span>Photo {num}</span>
                        </div>
                      )}
                    </div>
                    {showCam ? (
                      <div className="child-reg-camera-preview">
                        <video 
                          ref={videoR} 
                          autoPlay 
                          playsInline 
                          className="child-reg-camera-video" 
                          style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', background: '#000' }}
                        />
                        <canvas ref={canvasR} style={{ display: 'none' }} />
                        <div className="child-reg-camera-controls">
                          <button className="child-reg-btn-capture" onClick={() => capturePhoto(num)} title="Capture">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button className="child-reg-btn-cancel" onClick={() => stopCamera(num)} title="Cancel">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="child-reg-upload-options">
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(num, e.target.files[0])} style={{ display: 'none' }} ref={fileR} />
                        <button className="child-reg-btn-upload" onClick={() => fileR.current.click()} title="Upload Photo">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                        </button>
                        <button className="child-reg-btn-camera" onClick={() => startCamera(num)} title="Take Photo">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                        </button>
                        {preview && (
                          <button className="child-reg-btn-remove" onClick={() => {
                            if (num === 1) { setPreview1(null); setPicture1(null); }
                            else if (num === 2) { setPreview2(null); setPicture2(null); }
                            else { setPreview3(null); setPicture3(null); }
                          }} title="Remove Photo">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 7h16"/>
                              <path d="M10 11v6"/>
                              <path d="M14 11v6"/>
                              <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/>
                              <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="child-reg-form-actions">
            <button className="child-reg-btn-secondary" onClick={goBack}>Cancel</button>
            <button className="child-reg-btn-primary" onClick={() => {
              if (validateForm()) {
                setRegistrationStep(2);
              } else {
                showToast('Please fill in all required fields', 'error');
              }
            }}>Next: Capture Fingerprint</button>
          </div>
        </div>
      )}

      {registrationStep === 2 && (
        <div className="child-reg-fingerprint-section">
          <h3>Step 2: Capture Fingerprint</h3>
          <div className="child-reg-fingerprint-area">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
              <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"/>
              <path d="M18 12C18 8.69 15.31 6 12 6"/>
            </svg>
            <p>Place finger on the scanner</p>
            <button className="child-reg-btn-primary" onClick={handleFingerprintCapture}>Capture Fingerprint</button>
          </div>
          <div className="child-reg-form-actions">
            <button className="child-reg-btn-secondary" onClick={() => setRegistrationStep(1)}>Back</button>
            <button className="child-reg-btn-secondary" onClick={goBack}>Cancel</button>
          </div>
        </div>
      )}

      {fingerprintCaptured && registrationStep === 3 && (
        <div className="child-reg-success-message">
          <h3>✓ Fingerprint Captured Successfully!</h3>
          <p>Registration ID: <strong>{generatedId}</strong></p>
          <div className="child-reg-form-actions">
            <button className="child-reg-btn-primary" onClick={handleCompleteRegistration}>Complete Registration</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderVerifyPage = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <h1 className="child-reg-page-title">Verify Fingerprint</h1>
        <p className="child-reg-page-subtitle">Verify existing child records using fingerprint</p>
      </div>

      {!fingerprintExists && !isVerifying && (
        <div className="child-reg-verify-fingerprint-area">
          <div className="child-reg-fingerprint-area">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
            </svg>
            <p>Place finger on the scanner to verify</p>
            <button className="child-reg-btn-primary" onClick={handleVerifyFingerprintScan}>Verify Fingerprint</button>
          </div>
          <button className="child-reg-btn-secondary" onClick={goBack}>Cancel</button>
        </div>
      )}

      {isVerifying && (<div className="child-reg-verifying-state"><div className="child-reg-spinner"></div><p>Verifying fingerprint...</p></div>)}

      {fingerprintExists === true && existingChild && existingChild.fullName && (
        <div className="child-reg-verification-result">
          <div className="child-reg-success-message">
            <h3>✓ Fingerprint Found!</h3>
            <p>Child already registered in the system.</p>
            <div className="child-reg-child-details-card">
              <div className="child-reg-child-header"><h4>{existingChild.fullName}</h4><span className="child-reg-child-id">ID: {existingChild.customSerialId}</span></div>
              <div className="child-reg-verify-images">
                <h5>Child Photos</h5>
                {(existingChildImages?.image1 || existingChildImages?.image2 || existingChildImages?.image3) ? (
                  <div className="child-reg-verify-images-grid">
                    {existingChildImages.image1 && <div className="child-reg-verify-image"><img src={existingChildImages.image1} alt="Child photo 1" /></div>}
                    {existingChildImages.image2 && <div className="child-reg-verify-image"><img src={existingChildImages.image2} alt="Child photo 2" /></div>}
                    {existingChildImages.image3 && <div className="child-reg-verify-image"><img src={existingChildImages.image3} alt="Child photo 3" /></div>}
                  </div>
                ) : (<div className="child-reg-no-images-message"><p>No photos available for this child</p></div>)}
              </div>
              <div className="child-reg-info-grid">
                <div className="child-reg-info-item"><label>Full Name:</label><span>{existingChild.fullName}</span></div>
                <div className="child-reg-info-item"><label>Estimated Birth Year:</label><span>{existingChild.estimatedBirthYear}</span></div>
                <div className="child-reg-info-item"><label>Age:</label><span>{existingChild.age}</span></div>
                <div className="child-reg-info-item"><label>Gender:</label><span>{existingChild.gender}</span></div>
                <div className="child-reg-info-item"><label>Location:</label><span>{existingChild.locationName}</span></div>
                <div className="child-reg-info-item"><label>Registration Date:</label><span>{existingChild.createdAt ? existingChild.createdAt.split('T')[0] : 'N/A'}</span></div>
                <div className="child-reg-info-item"><label>Last Visit:</label><span>{existingChild.lastVisit}</span></div>
                <div className="child-reg-info-item"><label>Medical History:</label><span>{existingChild.medicalHistory || 'None'}</span></div>
                <div className="child-reg-info-item"><label>Registered By:</label><span>{existingChild.registeredBy || 'N/A'}</span></div>
              </div>
              <div className="child-reg-fingerprint-status"><span className="child-reg-status-badge child-reg-status-pending">Pending</span></div>
            </div>
            <div className="child-reg-form-actions">
              {/* <button className="child-reg-btn-primary" onClick={handleLoadExistingRecord}>Add Records</button> */}
              <button className="child-reg-btn-secondary" onClick={() => { setFingerprintExists(null); setExistingChild(null); setExistingChildImages(null); goBack(); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {fingerprintExists === false && (
        <div className="child-reg-verification-result">
          <div className="child-reg-info-message">
            <h3>ℹ Fingerprint Not Found</h3>
            <p>This fingerprint does not match any existing record.</p>
            <p>Would you like to register this child as a new patient?</p>
            <div className="child-reg-form-actions">
              <button className="child-reg-btn-primary" onClick={() => { setFingerprintExists(null); navigateToPage('register'); }}>Register New Child</button>
              <button className="child-reg-btn-secondary" onClick={() => { setFingerprintExists(null); goBack(); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout user={user} onLogout={handleLogout}>
      <ToastNotification />
      <div className="child-registration-container">
        {showPrintPage && <PrintPage />}
        {!showPrintPage && activePage === 'list' && renderListPage()}
        {!showPrintPage && activePage === 'register' && renderRegistrationPage()}
        {!showPrintPage && activePage === 'verify' && renderVerifyPage()}
        {!showPrintPage && activePage === 'childrenList' && renderAllChildrenList()}
        {!showPrintPage && activePage === 'todayList' && renderTodayRegistrations()}
        {!showPrintPage && activePage === 'fingerprintsList' && renderFingerprintsList()}
        {!showPrintPage && activePage === 'locations' && renderLocationsManagement()}
        {!showPrintPage && activePage === 'enroll_fingerprint' && renderFingerprintEnrollment()}
        {!showPrintPage && activePage === 'view_child' && renderChildViewPage()}
        {!showPrintPage && activePage === 'edit_child' && renderChildEditPage()}
      </div>
    </Layout>
  );
};

export default ChildRegistration;