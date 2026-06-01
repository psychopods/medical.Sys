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
  const [formErrors, setFormErrors] = useState({
    child_name: '',
    date_of_birth: '',
    gender: '',
    location_id: ''
  });
  
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
    child_name: '',
    date_of_birth: '',
    gender: '',
    location_id: ''
  });
  const navigate = useNavigate();


  // Validate form
  const validateForm = () => {
    let isValid = true;
    const errors = {
      child_name: '',
      date_of_birth: '',
      gender: '',
      location_id: ''
    };

    if (!formData.child_name.trim()) {
      errors.child_name = 'Child name is required';
      isValid = false;
    } else if (formData.child_name.trim().length < 2) {
      errors.child_name = 'Child name must be at least 2 characters';
      isValid = false;
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
      isValid = false;
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future';
        isValid = false;
      }
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required';
      isValid = false;
    }

    if (!formData.location_id) {
      errors.location_id = 'Location is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Clear specific error when field changes
  const handleFormChangeWithValidation = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Fetch locations from database
  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/child_locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch children from database
  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/children_profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChildrenData(data);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  // Fetch today's registrations
  const fetchTodayRegistrations = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/api/children_profiles?registration_date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodayData(data);
      }
    } catch (error) {
      console.error('Error fetching today registrations:', error);
    }
  };

  // Fetch fingerprints
  const fetchFingerprints = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/biometric_fingerprints`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFingerprintData(data);
      }
    } catch (error) {
      console.error('Error fetching fingerprints:', error);
    }
  };

  // Function to generate registration ID
  const generateRegistrationId = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/children_profiles/generate_id`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedId(data.child_id);
      } else {
        // Fallback ID generation
        const currentYear = new Date().getFullYear();
        const yearPrefix = `CH-${currentYear}-`;
        const nextNumber = (childrenData.length + 1).toString().padStart(3, '0');
        setGeneratedId(`${yearPrefix}${nextNumber}`);
      }
    } catch (error) {
      console.error('Error generating ID:', error);
    }
  };

  // Function to add registration with user tracking and images
  const addRegistration = async (newChild) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/children_profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          child_id: generatedId,
          child_name: newChild.child_name,
          date_of_birth: newChild.date_of_birth,
          gender: newChild.gender,
          location_id: parseInt(newChild.location_id),
          registration_date: newChild.registration_date,
          fingerprint_captured: newChild.fingerprint_captured,
          registered_by: user?.user_id || 1,
          image1: preview1,
          image2: preview2,
          image3: preview3
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to register child');
      }
    } catch (error) {
      console.error('Error adding registration:', error);
      // Offline mode - save to local storage
      const offlineData = JSON.parse(localStorage.getItem('offline_registrations') || '[]');
      offlineData.push(newChild);
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

  const defaultLocations = [
    'Arusha', 'Dar es Salaam - Ilala', 'Dar es Salaam - Kinondoni',
    'Dar es Salaam - Temeke', 'Dar es Salaam - Ubungo', 'Dar es Salaam - Kigamboni',
    'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro',
    'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza',
    'Njombe', 'Pemba North', 'Pemba South', 'Pwani', 'Rukwa', 'Ruvuma',
    'Shinyanga', 'Simiyu', 'Singida', 'Tabora', 'Tanga', 'Zanzibar North',
    'Zanzibar South', 'Zanzibar West'
  ];

  // Use locations from API or fallback to default
  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.location_id === locationId);
    return location ? location.location_name : '';
  };

  const filteredAllChildren = childrenData.filter(child =>
    child.child_name?.toLowerCase().includes(searchAllChildren.toLowerCase()) ||
    child.child_id?.toLowerCase().includes(searchAllChildren.toLowerCase())
  );

  const filteredTodayRegistrations = todayData.filter(child =>
    child.child_name?.toLowerCase().includes(searchTodayReg.toLowerCase()) ||
    child.child_id?.toLowerCase().includes(searchTodayReg.toLowerCase())
  );

  const filteredFingerprintData = fingerprintData.filter(fp =>
    fp.child_name?.toLowerCase().includes(searchFingerprints.toLowerCase()) ||
    fp.child_id?.toLowerCase().includes(searchFingerprints.toLowerCase())
  );

  const filteredRecentRegistrations = childrenData.slice(0, 5).filter(child =>
    child.child_name?.toLowerCase().includes(searchRecent.toLowerCase()) ||
    getLocationName(child.location_id)?.toLowerCase().includes(searchRecent.toLowerCase())
  );

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

    if (printFilters.date_from) {
      dataToPrint = dataToPrint.filter(item => item.registration_date >= printFilters.date_from);
    }
    if (printFilters.date_to) {
      dataToPrint = dataToPrint.filter(item => item.registration_date <= printFilters.date_to);
    }
    if (printFilters.location) {
      dataToPrint = dataToPrint.filter(item => getLocationName(item.location_id) === printFilters.location);
    }
    if (printFilters.fingerprint_status && printDataType !== 'fingerprints') {
      dataToPrint = dataToPrint.filter(item => 
        printFilters.fingerprint_status === 'captured' ? item.fingerprint_captured : !item.fingerprint_captured
      );
    }
    if (printFilters.gender && printDataType !== 'fingerprints') {
      dataToPrint = dataToPrint.filter(item => item.gender === printFilters.gender);
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
              <div class="subtitle">Medical System - Child Registration Report</div>
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
                  ${printDataType === 'children' ? '<th>ID</th><th>Child Name</th><th>Age</th><th>Gender</th><th>Location</th><th>Registration Date</th><th>Fingerprint</th><th>Registered By</th>' : ''}
                  ${printDataType === 'today' ? '<th>ID</th><th>Child Name</th><th>Age</th><th>Gender</th><th>Location</th><th>Registration Date</th><th>Fingerprint</th><th>Registered By</th>' : ''}
                  ${printDataType === 'fingerprints' ? '<th>Child ID</th><th>Child Name</th><th>Capture Date</th><th>Quality</th><th>Captured By</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${dataToPrint.map((item, index) => {
                  const age = calculateAge(item.date_of_birth);
                  if (printDataType === 'children' || printDataType === 'today') {
                    return `<tr>
                      <td style="text-align: center;">${index + 1}</td>
                      <td>${item.child_id}</td>
                      <td>${item.child_name}</td>
                      <td>${age}</td>
                      <td>${item.gender}</td>
                      <td>${getLocationName(item.location_id)}</td>
                      <td>${item.registration_date}</td>
                      <td><span class="status-badge ${item.fingerprint_captured ? 'status-captured' : 'status-pending'}">${item.fingerprint_captured ? 'Captured' : 'Pending'}</span></td>
                      <td>${item.registered_by_name || 'N/A'}</td>
                    </tr>`;
                  } else {
                    return `<tr>
                      <td style="text-align: center;">${index + 1}</td>
                      <td>${item.child_id}</td>
                      <td>${item.child_name}</td>
                      <td>${item.capture_date}</td>
                      <td>${item.quality}</td>
                      <td>${item.captured_by}</td>
                    </tr>`;
                  }
                }).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>This is a system generated report from Medical System</p>
              <p>Total Records: ${dataToPrint.length}</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowPrintPage(false);
    showToast('Print job sent successfully!', 'success');
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchLocations();
      fetchChildren();
      fetchTodayRegistrations();
      fetchFingerprints();
      generateRegistrationId();
    } else {
      navigate('/login');
    }
    setLoading(false);
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

  const startCamera = async (num) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (num === 1) { videoRef1.current.srcObject = stream; setShowCamera1(true); }
      else if (num === 2) { videoRef2.current.srcObject = stream; setShowCamera2(true); }
      else { videoRef3.current.srcObject = stream; setShowCamera3(true); }
    } catch (err) { showToast('Unable to access camera. Please check permissions.', 'error'); }
  };

  const capturePhoto = (num) => {
    let canvas, video;
    if (num === 1) { canvas = canvasRef1.current; video = videoRef1.current; }
    else if (num === 2) { canvas = canvasRef2.current; video = videoRef2.current; }
    else { canvas = canvasRef3.current; video = videoRef3.current; }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (num === 1) { setPreview1(reader.result); setShowCamera1(false); }
        else if (num === 2) { setPreview2(reader.result); setShowCamera2(false); }
        else { setPreview3(reader.result); setShowCamera3(false); }
        showToast(`Photo ${num} captured successfully!`, 'success');
      };
      reader.readAsDataURL(blob);
      video.srcObject.getTracks().forEach(track => track.stop());
    }, 'image/jpeg');
  };

  const stopCamera = (num) => {
    let video;
    if (num === 1) { video = videoRef1.current; setShowCamera1(false); }
    else if (num === 2) { video = videoRef2.current; setShowCamera2(false); }
    else { video = videoRef3.current; setShowCamera3(false); }
    if (video && video.srcObject) video.srcObject.getTracks().forEach(track => track.stop());
  };

  const handleFileUpload = (num, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (num === 1) { setPreview1(reader.result); }
      else if (num === 2) { setPreview2(reader.result); }
      else { setPreview3(reader.result); }
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
      const matchedChild = childrenData.find(child => child.child_id === 'CH-2024-004') || childrenData[0];
      
      if (matchedChild) {
        setExistingChild({
          child_id: matchedChild.child_id,
          child_name: matchedChild.child_name,
          date_of_birth: matchedChild.date_of_birth,
          age: calculateAge(matchedChild.date_of_birth),
          gender: matchedChild.gender,
          location_name: getLocationName(matchedChild.location_id),
          registration_date: matchedChild.registration_date,
          fingerprint_captured: matchedChild.fingerprint_captured,
          medical_history: matchedChild.medical_history || 'No known allergies',
          last_visit: new Date().toLocaleDateString(),
          registered_by: matchedChild.registered_by_name,
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
    if (existingChild && existingChild.child_name) {
      showToast(`Loading complete record for: ${existingChild.child_name}`, 'info');
    } else {
      showToast('No record selected', 'error');
    }
    setActivePage('list');
    setFingerprintExists(null);
    setExistingChild(null);
    setExistingChildImages(null);
  };

  const handleCompleteRegistration = async () => {
    // Validate form before proceeding
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const newChild = {
      child_name: formData.child_name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      location_id: formData.location_id,
      registration_date: new Date().toISOString().split('T')[0],
      fingerprint_captured: fingerprintCaptured,
      registered_by: user?.user_id || 1
    };

    const result = await addRegistration(newChild);
    
    if (result) {
      showToast(offlineMode 
        ? `✓ Child registered in OFFLINE mode with ID: ${generatedId}. Data will sync when online.` 
        : `✓ Child registered successfully with ID: ${generatedId}!`, 
        'success'
      );
      
      setActivePage('list');
      setRegistrationStep(1);
      setFingerprintCaptured(false);
      setFormData({ child_name: '', date_of_birth: '', gender: '', location_id: '' });
      setFormErrors({ child_name: '', date_of_birth: '', gender: '', location_id: '' });
      setPreview1(null); setPreview2(null); setPreview3(null);
      generateRegistrationId();
      fetchChildren();
      fetchTodayRegistrations();
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
    }, 3000);
  };

  const handleStatClick = (page, title) => {
    showToast(`Viewing ${title}`, 'info');
    setActivePage(page);
  };

  const handleActionClick = (action) => {
    showToast(`Opening ${action}`, 'info');
  };

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
                  {locations.map(loc => <option key={loc.location_id} value={loc.location_name}>{loc.location_name}</option>)}
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

  const renderAllChildrenList = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={() => setActivePage('list')}>← Back to Dashboard</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">All Registered Children</h1>
          <button className="child-reg-print-btn-page" onClick={() => handlePrintClick('children')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3H18V9" /><path d="M6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21Z" /><path d="M18 15H6" /></svg>
            Print Report
          </button>
        </div>
        <p className="child-reg-page-subtitle">Total: {childrenData.length} children registered in the system</p>
      </div>
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input type="text" placeholder="Search by name or ID..." value={searchAllChildren} onChange={(e) => setSearchAllChildren(e.target.value)} />
      </div>
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead><tr><th>S/N</th><th>ID</th><th>Child Name</th><th>Age</th><th>Gender</th><th>Location</th><th>Registration Date</th><th>Fingerprint</th><th>Registered By</th></tr></thead>
          <tbody>
            {filteredAllChildren.map((child, index) => (
              <tr key={child.child_id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>{child.child_id}</td>
                <td>{child.child_name}</td>
                <td>{calculateAge(child.date_of_birth)}</td>
                <td>{child.gender}</td>
                <td>{getLocationName(child.location_id)}</td>
                <td>{child.registration_date}</td>
                <td><span className={`child-reg-status-badge ${child.fingerprint_captured ? 'child-reg-status-completed' : 'child-reg-status-pending'}`}>{child.fingerprint_captured ? 'Captured' : 'Pending'}</span></td>
                <td>{child.registered_by_name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTodayRegistrations = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={() => setActivePage('list')}>← Back to Dashboard</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Today's Registrations</h1>
          <button className="child-reg-print-btn-page" onClick={() => handlePrintClick('today')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3H18V9" /><path d="M6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21Z" /><path d="M18 15H6" /></svg>
            Print Report
          </button>
        </div>
        <p className="child-reg-page-subtitle">Date: {new Date().toLocaleDateString()} | Total: {todayData.length} children registered today</p>
      </div>
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input type="text" placeholder="Search by name or ID..." value={searchTodayReg} onChange={(e) => setSearchTodayReg(e.target.value)} />
      </div>
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead><tr><th>S/N</th><th>ID</th><th>Child Name</th><th>Age</th><th>Gender</th><th>Location</th><th>Registration Time</th><th>Fingerprint</th><th>Registered By</th></tr></thead>
          <tbody>
            {filteredTodayRegistrations.map((child, index) => (
              <tr key={child.child_id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>{child.child_id}</td>
                <td>{child.child_name}</td>
                <td>{calculateAge(child.date_of_birth)}</td>
                <td>{child.gender}</td>
                <td>{getLocationName(child.location_id)}</td>
                <td>{child.registration_date}</td>
                <td><span className={`child-reg-status-badge ${child.fingerprint_captured ? 'child-reg-status-completed' : 'child-reg-status-pending'}`}>{child.fingerprint_captured ? 'Captured' : 'Pending'}</span></td>
                <td>{child.registered_by_name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFingerprintsList = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={() => setActivePage('list')}>← Back to Dashboard</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Fingerprints Captured</h1>
          <button className="child-reg-print-btn-page" onClick={() => handlePrintClick('fingerprints')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3H18V9" /><path d="M6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21Z" /><path d="M18 15H6" /></svg>
            Print Report
          </button>
        </div>
        <p className="child-reg-page-subtitle">Total fingerprints captured: {fingerprintData.length}</p>
      </div>
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input type="text" placeholder="Search by name or ID..." value={searchFingerprints} onChange={(e) => setSearchFingerprints(e.target.value)} />
      </div>
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead><tr><th>S/N</th><th>Child ID</th><th>Child Name</th><th>Capture Date & Time</th><th>Quality</th><th>Captured By</th></tr></thead>
          <tbody>
            {filteredFingerprintData.map((fp, index) => (
              <tr key={fp.fingerprint_id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>{fp.child_id}</td>
                <td>{fp.child_name}</td>
                <td>{fp.capture_date}</td>
                <td><span className={`child-reg-quality-badge child-reg-quality-${fp.quality?.toLowerCase()}`}>{fp.quality || 'Good'}</span></td>
                <td>{fp.captured_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) return <div className="child-reg-dashboard-loading"><div className="child-reg-spinner"></div><p>Loading...</p></div>;
  if (!user) return null;

  const renderListPage = () => (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <h1 className="child-reg-page-title">Child Registration</h1>
        <p className="child-reg-page-subtitle">Register new children and capture fingerprint data</p>
        {user && (
          <div className="child-reg-user-info">
            <span>Logged in as: <strong>{user.username || user.name}</strong> ({user.role_name || 'Staff'})</span>
          </div>
        )}
      </div>
      
      <div className="child-reg-stats-grid">
        <div className="child-reg-stat-card" onClick={() => handleStatClick('childrenList', 'All Children')}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/></svg></div>
            <div className="child-reg-stat-info"><h3>{childrenData.length}</h3><p>Total Children</p></div>
          </div>
        </div>
        <div className="child-reg-stat-card" onClick={() => handleStatClick('todayList', 'Today\'s Registrations')}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/><path d="M14 2V8H20"/></svg></div>
            <div className="child-reg-stat-info"><h3>{todayData.length}</h3><p>Registered Today</p></div>
          </div>
        </div>
        <div className="child-reg-stat-card" onClick={() => handleStatClick('fingerprintsList', 'Fingerprints Captured')}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/><path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/><path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"/><path d="M18 12C18 8.69 15.31 6 12 6"/></svg></div>
            <div className="child-reg-stat-info"><h3>{fingerprintData.length}</h3><p>Fingerprints Captured</p></div>
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
        <div className="child-reg-action-card" onClick={() => { handleActionClick('Register New Child'); setActivePage('register'); }}>
          <div className="child-reg-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/></svg></div>
          <div className="child-reg-action-info"><h4>Register New Child</h4><p>Capture child information and details</p></div>
        </div>
        <div className="child-reg-action-card" onClick={() => { handleActionClick('Verify Fingerprint'); setActivePage('verify'); }}>
          <div className="child-reg-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/><path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/></svg></div>
          <div className="child-reg-action-info"><h4>Verify Fingerprint</h4><p>Verify existing fingerprint records</p></div>
        </div>
        <div className="child-reg-action-card" onClick={() => { if (!isSyncing) { handleActionClick('Sync Offline Data'); handleSyncOfflineData(); } }}>
          <div className="child-reg-action-icon">
            {isSyncing ? <div className="child-reg-sync-spinner"></div> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12H22"/><path d="M12 2V22"/><circle cx="12" cy="12" r="10"/></svg>}
          </div>
          <div className="child-reg-action-info"><h4>{isSyncing ? 'Syncing...' : 'Sync Offline Data'}</h4><p>{isSyncing ? 'Please wait while syncing...' : 'Synchronize local records with central database'}</p></div>
        </div>
      </div>

      <div className="child-reg-section-title">Recent Registrations</div>
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input type="text" placeholder="Search recent registrations..." value={searchRecent} onChange={(e) => setSearchRecent(e.target.value)} />
      </div>
      <div className="child-reg-recent-table">
        <table>
          <thead><tr><th>S/N</th><th>Child Name</th><th>Age</th><th>Location</th><th>Registration Date</th><th>Fingerprint Status</th><th>Registered By</th></tr></thead>
          <tbody>
            {filteredRecentRegistrations.map((child, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td>{child.child_name}</td>
                <td>{calculateAge(child.date_of_birth)}</td>
                <td>{getLocationName(child.location_id)}</td>
                <td>{child.registration_date}</td>
                <td><span className="child-reg-status-badge child-reg-status-completed">{child.fingerprint_captured ? 'Captured' : 'Pending'}</span></td>
                <td>{child.registered_by_name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <button className="child-reg-back-btn" onClick={() => setActivePage('list')}>← Back to List</button>
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
                name="child_name" 
                value={formData.child_name} 
                onChange={handleFormChangeWithValidation} 
                placeholder="Enter child's name" 
                required 
                className={formErrors.child_name ? 'error-input' : ''}
              />
              {formErrors.child_name && <span className="error-message">{formErrors.child_name}</span>}
            </div>
            <div className="child-reg-form-group">
              <label>Date of Birth *</label>
              <input 
                type="date" 
                name="date_of_birth" 
                value={formData.date_of_birth} 
                onChange={handleFormChangeWithValidation} 
                required 
                className={formErrors.date_of_birth ? 'error-input' : ''}
              />
              {formErrors.date_of_birth && <span className="error-message">{formErrors.date_of_birth}</span>}
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
              <label>Location *</label>
              <select 
                name="location_id" 
                value={formData.location_id} 
                onChange={handleFormChangeWithValidation} 
                required 
                className={formErrors.location_id ? 'error-input' : ''}
              >
                <option value="">Select Location</option>
                {locations.map(loc => <option key={loc.location_id} value={loc.location_id}>{loc.location_name}</option>)}
              </select>
              {formErrors.location_id && <span className="error-message">{formErrors.location_id}</span>}
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
              <video ref={videoR} autoPlay playsInline className="child-reg-camera-video" />
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
            <button className="child-reg-btn-secondary" onClick={() => setActivePage('list')}>Cancel</button>
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
            <button className="child-reg-btn-secondary" onClick={() => setActivePage('list')}>Cancel</button>
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
        <button className="child-reg-back-btn" onClick={() => setActivePage('list')}>← Back to List</button>
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
          <button className="child-reg-btn-secondary" onClick={() => setActivePage('list')}>Cancel</button>
        </div>
      )}

      {isVerifying && (<div className="child-reg-verifying-state"><div className="child-reg-spinner"></div><p>Verifying fingerprint...</p></div>)}

      {fingerprintExists === true && existingChild && existingChild.child_name && (
        <div className="child-reg-verification-result">
          <div className="child-reg-success-message">
            <h3>✓ Fingerprint Found!</h3>
            <p>Child already registered in the system.</p>
            <div className="child-reg-child-details-card">
              <div className="child-reg-child-header"><h4>{existingChild.child_name}</h4><span className="child-reg-child-id">ID: {existingChild.child_id}</span></div>
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
                <div className="child-reg-info-item"><label>Full Name:</label><span>{existingChild.child_name}</span></div>
                <div className="child-reg-info-item"><label>Date of Birth:</label><span>{existingChild.date_of_birth}</span></div>
                <div className="child-reg-info-item"><label>Age:</label><span>{existingChild.age}</span></div>
                <div className="child-reg-info-item"><label>Gender:</label><span>{existingChild.gender}</span></div>
                <div className="child-reg-info-item"><label>Location:</label><span>{existingChild.location_name}</span></div>
                <div className="child-reg-info-item"><label>Registration Date:</label><span>{existingChild.registration_date}</span></div>
                <div className="child-reg-info-item"><label>Last Visit:</label><span>{existingChild.last_visit}</span></div>
                <div className="child-reg-info-item"><label>Medical History:</label><span>{existingChild.medical_history || 'None'}</span></div>
                <div className="child-reg-info-item"><label>Registered By:</label><span>{existingChild.registered_by || 'N/A'}</span></div>
              </div>
              <div className="child-reg-fingerprint-status"><span className="child-reg-status-badge child-reg-status-completed">✓ Fingerprint Registered</span></div>
            </div>
            <div className="child-reg-form-actions">
              <button className="child-reg-btn-primary" onClick={handleLoadExistingRecord}>Load Full Record</button>
              <button className="child-reg-btn-secondary" onClick={() => { setActivePage('list'); setFingerprintExists(null); setExistingChild(null); setExistingChildImages(null); }}>Close</button>
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
              <button className="child-reg-btn-primary" onClick={() => { setActivePage('register'); setFingerprintExists(null); }}>Register New Child</button>
              <button className="child-reg-btn-secondary" onClick={() => { setActivePage('list'); setFingerprintExists(null); }}>Cancel</button>
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
      </div>
    </Layout>
  );
};

export default ChildRegistration;