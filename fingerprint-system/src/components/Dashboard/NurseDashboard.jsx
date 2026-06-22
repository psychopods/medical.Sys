import React, { useState, useEffect, useRef } from "react";
import "./NurseDashboard.css";
import {
  getLocations,
  getChildren,
  registerChild,
  enrollBiometric,
  getBiometricsForChild,
  registerSyncListener,
  triggerSync,
  initSyncWorker,
} from "../../services/api.js";
import { executeQuery } from "../../services/db.js";

// API base URL
import { API_ENDPOINTS, API_BASE_URL } from '../../config/endpoints.js';

const NurseDashboard = ({ user, onLogout }) => {
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [syncState, setSyncState] = useState({
    state: "idle",
    message: "Ready",
  });
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showFingerprintCapture, setShowFingerprintCapture] = useState(false);
  const [showVerifyFingerprint, setShowVerifyFingerprint] = useState(false);
  const [fingerprintExists, setFingerprintExists] = useState(null);
  const [existingChild, setExistingChild] = useState(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [locations, setLocations] = useState([]);
  const [childrenData, setChildrenData] = useState([]);
  const [fingerprintData, setFingerprintData] = useState([]);
  const [formErrors, setFormErrors] = useState({
    fullName: "",
    estimatedBirthYear: "",
    gender: "",
    primaryLocationId: "",
  });

  // ===== AUTO-REFRESH STATE =====
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");

  // Stats data
  const [statsData, setStatsData] = useState({
    totalChildren: 0,
    todayRegistrations: 0,
    fingerprintsCaptured: 0,
    pendingFingerprints: 0,
    totalLocations: 0,
    youngPatients: 0,
    olderPatients: 0,
  });

  // Recent activities
  const [recentActivities, setRecentActivities] = useState([]);

  // Location distribution data (calculated from actual data)
  const [locationStats, setLocationStats] = useState([]);

  // Monthly registrations (calculated from actual data)
  const [monthlyRegistrations, setMonthlyRegistrations] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    estimatedBirthYear: "",
    gender: "",
    primaryLocationId: "",
  });

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // Helper function to calculate age value
  const calculateAgeValue = (estimatedBirthYear) => {
    if (!estimatedBirthYear) return 0;
    const currentYear = new Date().getFullYear();
    return currentYear - estimatedBirthYear;
  };

  // Helper function to check if a date is today or in the future
  const isTodayOrFuture = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // Helper function to format date with time
  const formatDateTimeWithTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Helper function to get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDateTimeWithTime(dateString);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get user's first name
  const getUserFirstName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.first_name) return user.first_name;
    if (user?.username) return user.username;
    return "Nurse";
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setGreeting(getGreeting());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Fetch locations for dropdown
  const fetchLocations = async () => {
    try {
      const locationsArray = await getLocations();
      setLocations(locationsArray);
      setStatsData((prev) => ({
        ...prev,
        totalLocations: locationsArray.length,
      }));
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // Fetch children and calculate stats
  const fetchChildren = async () => {
    try {
      const childrenArray = await getChildren();
      setChildrenData(childrenArray);

      const today = new Date().toISOString().split("T")[0];
      const todayRegistrations = childrenArray.filter((child) => {
        const childDate = child.createdAt?.split("T")[0];
        return childDate === today;
      }).length;

      // Calculate age distribution
      let youngCount = 0;
      let olderCount = 0;
      
      childrenArray.forEach(child => {
        const age = calculateAgeValue(child.estimatedBirthYear);
        if (age < 18) {
          youngCount++;
        } else {
          olderCount++;
        }
      });

      setStatsData((prev) => ({
        ...prev,
        totalChildren: childrenArray.length,
        todayRegistrations: todayRegistrations,
        youngPatients: youngCount,
        olderPatients: olderCount,
      }));

      // Calculate location statistics
      calculateLocationStats(childrenArray);

      // Calculate monthly registrations
      calculateMonthlyRegistrations(childrenArray);

      // Generate recent activities from children data (only today and future)
      generateRecentActivities(childrenArray);
      
      // Update fingerprint stats after children data is loaded
      await fetchFingerprints();
    } catch (error) {
      console.error("Error fetching children:", error);
      setChildrenData([]);
    }
  };

  // Generate recent activities from children data (only today and future)
  const generateRecentActivities = (children) => {
    // Filter children to only show today and future registrations
    const todayAndFutureChildren = children.filter(child => 
      child.createdAt && isTodayOrFuture(child.createdAt)
    );

    // Sort by date and time (most recent first - newest to oldest)
    const sortedActivities = todayAndFutureChildren
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Newest first
      })
      .slice(0, 20) // Show up to 20 most recent activities
      .map((child) => {
        const date = new Date(child.createdAt);
        return {
          id: child.id,
          childName: child.fullName,
          activity: "New Registration",
          date: date.toLocaleDateString(),
          time: date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          fullDateTime: date,
          relativeTime: getRelativeTime(child.createdAt),
          status: "completed",
        };
      });

    setRecentActivities(sortedActivities);
  };

  // Calculate location statistics from children data
  const calculateLocationStats = (children) => {
    const locationCount = {};
    children.forEach((child) => {
      const locationId = child.primaryLocationId;
      if (locationId) {
        locationCount[locationId] = (locationCount[locationId] || 0) + 1;
      }
    });

    const stats = Object.entries(locationCount)
      .map(([locationId, count]) => {
        const location = locations.find((loc) => loc.id === locationId);
        return {
          location: location?.name || locationId,
          name: location?.name || locationId,
          count: count,
          percentage: (count / children.length) * 100,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    setLocationStats(stats);
  };

  // Calculate monthly registrations from children data
  const calculateMonthlyRegistrations = (children) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyCount = {};

    children.forEach((child) => {
      if (child.createdAt) {
        const date = new Date(child.createdAt);
        const month = months[date.getMonth()];
        monthlyCount[month] = (monthlyCount[month] || 0) + 1;
      }
    });

    const chartData = months.map((month) => ({
      month: month,
      count: monthlyCount[month] || 0,
    }));

    setMonthlyRegistrations(chartData);
  };

  // ===== FETCH FINGERPRINTS - FIXED TO GET FROM API AND SQLITE =====
  const fetchFingerprints = async () => {
    try {
      let totalFingerprints = 0;
      const isOnline = navigator.onLine;

      // Try to get from API first if online
      if (isOnline) {
        try {
          // Fetch all children to get their fingerprints
          const children = await getChildren();
          let apiCount = 0;
          
          for (const child of children) {
            if (child.id) {
              try {
                const fingerprints = await getBiometricsForChild(child.id);
                if (fingerprints && fingerprints.length > 0) {
                  apiCount += fingerprints.length;
                }
              } catch (e) {
                console.error('Error fetching fingerprints for child:', e);
              }
            }
          }
          
          totalFingerprints = apiCount;
        } catch (apiError) {
          console.warn('API fingerprint fetch failed, using SQLite fallback:', apiError);
          // Fallback to SQLite
          const result = await executeQuery(
            "SELECT COUNT(*) as count FROM biometric_fingerprints",
          );
          totalFingerprints = result[0]?.count || 0;
        }
      } else {
        // Offline - use SQLite
        const result = await executeQuery(
          "SELECT COUNT(*) as count FROM biometric_fingerprints",
        );
        totalFingerprints = result[0]?.count || 0;
      }

      setStatsData((prev) => ({
        ...prev,
        fingerprintsCaptured: totalFingerprints,
        pendingFingerprints: Math.max(0, childrenData.length - totalFingerprints),
      }));
    } catch (error) {
      console.error("Error fetching fingerprints:", error);
      // Fallback to SQLite
      try {
        const result = await executeQuery(
          "SELECT COUNT(*) as count FROM biometric_fingerprints",
        );
        const count = result[0]?.count || 0;
        setStatsData((prev) => ({
          ...prev,
          fingerprintsCaptured: count,
          pendingFingerprints: Math.max(0, childrenData.length - count),
        }));
      } catch (dbError) {
        console.error("SQLite fallback failed:", dbError);
      }
    }
  };

  // ===== BACKGROUND REFRESH FUNCTION =====
  const refreshAllData = async (showSpinner = false) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    
    if (showSpinner) {
      setRefreshing(true);
    }
    
    try {
      await fetchChildren();
      await fetchLocations();
      // fetchChildren already calls fetchFingerprints, but we call it again to be safe
      await fetchFingerprints();
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Background refresh error:', error);
    } finally {
      isRefreshingRef.current = false;
      if (showSpinner) {
        setRefreshing(false);
      }
    }
  };

  // ===== MANUAL REFRESH WITH SPINNER =====
  const handleManualRefresh = async () => {
    await refreshAllData(true);
  };

  // ===== START BACKGROUND REFRESH =====
  const startBackgroundRefresh = () => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set up background refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      refreshAllData(false);
    }, 30000);
  };

  // ===== STOP BACKGROUND REFRESH =====
  const stopBackgroundRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // Generate registration ID
  const generateRegistrationId = async () => {
    const currentYear = new Date().getFullYear();
    const nextNumber = (childrenData.length + 1).toString().padStart(4, "0");
    setGeneratedId(`KID-${currentYear}-${nextNumber}`);
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const errors = {
      fullName: "",
      estimatedBirthYear: "",
      gender: "",
      primaryLocationId: "",
    };

    if (!formData.fullName.trim()) {
      errors.fullName = "Patient name is required";
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = "Patient name must be at least 2 characters";
      isValid = false;
    }

    if (!formData.estimatedBirthYear) {
      errors.estimatedBirthYear = "Estimated birth year is required";
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

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  // Add registration to API
  const addRegistration = async (newChild) => {
    try {
      const res = await registerChild({
        customSerialId: generatedId,
        fullName: newChild.fullName,
        gender: newChild.gender,
        estimatedBirthYear: newChild.estimatedBirthYear,
        primaryLocationId: newChild.primaryLocationId,
      });
      return res.child;
    } catch (error) {
      console.error("Error adding registration:", error);
      throw error;
    }
  };

  // Enroll fingerprint
  const enrollFingerprint = async (childId, qualityScore) => {
    try {
      const res = await enrollBiometric({
        childId: childId,
        fingerIndex: 1,
        templateBase64: "sample_fingerprint_template_base64",
        qualityScore: qualityScore,
        status: "PENDING",
      });
      return res.biometric;
    } catch (error) {
      console.error("Error enrolling fingerprint:", error);
    }
    return null;
  };

  // Verify fingerprint (simulated for now)
  const verifyFingerprint = async () => {
    setIsVerifying(true);
    setTimeout(() => {
      const matched = Math.random() > 0.5;
      if (matched && childrenData.length > 0) {
        const child = childrenData[0];
        setExistingChild({
          id: child.id,
          customSerialId: child.customSerialId,
          fullName: child.fullName,
          estimatedBirthYear: child.estimatedBirthYear,
          age: calculateAgeFromYear(child.estimatedBirthYear),
          gender: child.gender,
          locationName: getLocationName(child.primaryLocationId),
          createdAt: child.createdAt,
          lastVisit: new Date().toLocaleDateString(),
        });
        setFingerprintExists(true);
      } else {
        setFingerprintExists(false);
      }
      setIsVerifying(false);
    }, 1500);
  };

  // Get location name
  const getLocationName = (locationId) => {
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.name : "";
  };

  // Calculate age from year
  const calculateAgeFromYear = (estimatedBirthYear) => {
    if (!estimatedBirthYear) return "N/A";
    const currentYear = new Date().getFullYear();
    const age = currentYear - estimatedBirthYear;
    return `${age} year${age !== 1 ? "s" : ""}`;
  };

  // Handle fingerprint capture
  const handleFingerprintCapture = () => {
    const quality = Math.floor(Math.random() * 30) + 70;
    alert(`Fingerprint captured with ${quality}% quality!`);
    setShowFingerprintCapture(true);
    sessionStorage.setItem(
      "captured_fingerprint",
      JSON.stringify({
        quality: quality,
        timestamp: new Date().toISOString(),
      }),
    );
  };

  // Handle continue registration
  const handleContinueRegistration = async () => {
    if (!validateForm()) {
      alert("Please fill in all required fields");
      return;
    }

    const capturedFingerprint = JSON.parse(
      sessionStorage.getItem("captured_fingerprint") || "{}",
    );

    const newChild = {
      fullName: formData.fullName,
      estimatedBirthYear: formData.estimatedBirthYear,
      gender: formData.gender,
      primaryLocationId: formData.primaryLocationId,
    };

    const result = await addRegistration(newChild);

    if (result) {
      if (capturedFingerprint.quality) {
        await enrollFingerprint(
          result.child?.id || result.id,
          capturedFingerprint.quality,
        );
      }

      alert(
        offlineMode
          ? `✓ Patient registered in OFFLINE mode with ID: ${generatedId}. Data will sync when online.`
          : `✓ Patient registered successfully with ID: ${generatedId}!`,
      );

      setShowRegistrationForm(false);
      setShowFingerprintCapture(false);
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

      // Refresh data
      await refreshAllData(true);
      generateRegistrationId();
      sessionStorage.removeItem("captured_fingerprint");
    }
  };

  // Handle load existing record
  const handleLoadExistingRecord = () => {
    alert(`Loading record for: ${existingChild?.fullName}`);
    setShowVerifyFingerprint(false);
    setFingerprintExists(null);
    setExistingChild(null);
  };

  // Sync offline data
  const handleSyncOfflineData = async () => {
    setIsSyncing(true);
    try {
      await triggerSync();
      await refreshAllData(true);
    } catch (error) {
      console.error("Error triggering sync:", error);
    }
    setIsSyncing(false);
  };

  // Get max count for Y-axis
  const getMaxCount = () => {
    return Math.max(...monthlyRegistrations.map((m) => m.count), 1);
  };

  // Format last refreshed time
  const getLastRefreshedText = () => {
    if (!lastRefreshed) return 'Never refreshed';
    const date = new Date(lastRefreshed);
    return `Data updated: ${date.toLocaleTimeString()}`;
  };

  // Initialize data and sync worker on mount
  useEffect(() => {
    const initData = async () => {
      await fetchLocations();
      await fetchChildren();
      await fetchFingerprints();
      generateRegistrationId();
      setLastRefreshed(new Date());
    };

    initData();
    setGreeting(getGreeting());
    initSyncWorker();

    // Start background refresh
    startBackgroundRefresh();

    const unsubscribe = registerSyncListener((state) => {
      setSyncState(state);
      setIsSyncing(state.state === "running");
    });

    return () => {
      unsubscribe();
      stopBackgroundRefresh();
    };
  }, []);

  // Update UI stats when children data changes
  useEffect(() => {
    if (childrenData.length > 0) {
      fetchFingerprints();
    }
  }, [childrenData]);

  // Update location stats when locations or children data changes
  useEffect(() => {
    if (childrenData.length > 0 && locations.length > 0) {
      calculateLocationStats(childrenData);
      calculateMonthlyRegistrations(childrenData);
    }
  }, [childrenData, locations]);

  // Network status listener
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

  // Sync completion listener: refresh lists
  useEffect(() => {
    if (syncState.state === "idle" && syncState.message.includes("complete")) {
      refreshAllData(false);
    }
  }, [syncState]);

  // Stats cards data (7 stats including age distribution)
  const stats = [
    {
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
      value: statsData.totalChildren,
      label: "Total Patients Registered",
    },
    {
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 2v4M8 4l2 2M16 4l-2 2"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
      value: statsData.youngPatients,
      label: "Young Patients",
      subLabel: "< 18 years",
    },
    {
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M17 3.5a4 4 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
      value: statsData.olderPatients,
      label: "Older Patients",
      subLabel: "≥ 18 years",
    },
    {
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M18 12C18 8.69 15.31 6 12 6"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ),
      value: statsData.fingerprintsCaptured,
      label: "Fingerprints Captured",
    },
    {
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" />
          <line
            x1="12"
            y1="18"
            x2="12"
            y2="12"
            stroke="currentColor"
            strokeWidth="2"
          />
          <line
            x1="9"
            y1="15"
            x2="15"
            y2="15"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
      value: statsData.pendingFingerprints,
      label: "Pending Fingerprints",
    },
    {
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      value: statsData.todayRegistrations,
      label: "Today's Registrations",
    },
  ];

  return (
    <div className="nurse-dashboard-wrapper">
      {/* Refresh Indicator */}
      <div className="nd-refresh-section">
        <div className="nd-refresh-indicator">
          {refreshing ? (
            <span className="nd-refreshing">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nd-spinning">
                <path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Refreshing...
            </span>
          ) : lastRefreshed ? (
            <span className="nd-last-refreshed">
              {getLastRefreshedText()}
            </span>
          ) : null}
        </div>
        <button 
          className="nd-refresh-btn" 
          onClick={handleManualRefresh} 
          disabled={refreshing || isSyncing}
          title="Refresh data"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Network & Sync Status Banner */}
      {(offlineMode ||
        syncState.state === "running" ||
        syncState.message.includes("complete") ||
        syncState.message.includes("Error") ||
        syncState.message.includes("error")) && (
        <div
          className="nurse-dashboard-offline-banner"
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
              className="nurse-dashboard-sync-btn"
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
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </div>
      )}

      {/* Welcome Section with Greeting and DateTime */}
      <div className="nurse-dashboard-welcome-section">
        <div className="nurse-dashboard-welcome-header">
          <div className="nurse-dashboard-greeting">
            <h1>
              {greeting}, {getUserFirstName()}!
            </h1>
            <p>Welcome to Street Medicine System Dashboard</p>
          </div>
          <div className="nurse-dashboard-datetime">
            <div className="nurse-dashboard-date">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="16"
                  y1="2"
                  x2="16"
                  y2="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="3"
                  y1="10"
                  x2="21"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              {formatDate(currentTime)}
            </div>
            <div className="nurse-dashboard-time">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <polyline
                  points="12 6 12 12 16 14"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="nurse-dashboard-stats-grid">
        {stats.map((stat, index) => (
          <div className="nurse-dashboard-stat-card" key={index}>
            <div className="nurse-dashboard-stat-icon">{stat.icon}</div>
            <div className="nurse-dashboard-stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              {stat.subLabel && <small>{stat.subLabel}</small>}
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout for Charts */}
      <div className="nurse-dashboard-two-column-layout">
        {/* Location Distribution */}
        <div className="nurse-dashboard-data-card">
          <div className="nurse-dashboard-data-card-header">
            <h3>Registrations by Location</h3>
            <span className="nurse-dashboard-data-card-subtitle">
              All locations
            </span>
          </div>
          <div className="nurse-dashboard-location-list">
            {locationStats.length > 0 ? (
              locationStats.map((loc, index) => (
                <div className="nurse-dashboard-location-item" key={index}>
                  <div className="nurse-dashboard-location-info">
                    <span className="nurse-dashboard-location-name">
                      {loc.location || loc.name}
                    </span>
                    <span className="nurse-dashboard-location-count">
                      {loc.count} Patients
                    </span>
                  </div>
                  <div className="nurse-dashboard-progress-bar">
                    <div
                      className="nurse-dashboard-progress-fill"
                      style={{ width: `${loc.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="nurse-dashboard-loading-text">
                No registration data available
              </div>
            )}
          </div>
        </div>

        {/* Monthly Registrations Chart with Y-Axis */}
        <div className="nurse-dashboard-data-card">
          <div className="nurse-dashboard-data-card-header">
            <h3>Monthly Registrations</h3>
            <span className="nurse-dashboard-data-card-subtitle">Overview</span>
          </div>
          <div className="nurse-dashboard-monthly-chart-container">
            <div className="nurse-dashboard-monthly-chart">
              {/* Y-Axis Labels */}
              <div className="nurse-dashboard-chart-y-axis">
                <span>{getMaxCount()}</span>
                <span>{Math.round(getMaxCount() * 0.75)}</span>
                <span>{Math.round(getMaxCount() * 0.5)}</span>
                <span>{Math.round(getMaxCount() * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Y-Axis Line */}
              <div className="nurse-dashboard-chart-y-axis-line"></div>

              {/* X-Axis Line */}
              <div className="nurse-dashboard-chart-x-axis-line"></div>

              {/* Bars */}
              {monthlyRegistrations.length > 0 ? (
                monthlyRegistrations.map((month, index) => {
                  const maxCount = getMaxCount();
                  const barHeight =
                    maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                  return (
                    <div
                      className="nurse-dashboard-chart-bar-container"
                      key={index}
                    >
                      <div className="nurse-dashboard-chart-bar-wrapper">
                        <div
                          className="nurse-dashboard-chart-bar"
                          style={{ height: `${barHeight}%` }}
                        >
                          {month.count > 0 && (
                            <span className="nurse-dashboard-chart-value">
                              {month.count}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="nurse-dashboard-chart-label">
                        {month.month}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="nurse-dashboard-loading-text">
                  No registration data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities - Updated with time filtering and sorting */}
      <div className="nurse-dashboard-section-title">
        Recent Activities
      </div>
      <div className="nurse-dashboard-recent-table">
        <table>
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Activity</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className="nurse-dashboard-patient-name">
                    {activity.childName}
                  </td>
                  <td>
                    <span className="nurse-dashboard-activity-type">
                      {activity.activity}
                    </span>
                  </td>
                  <td>{activity.date}</td>
                  <td>{activity.time}</td>
                  <td>
                    <span
                      className={`nurse-dashboard-status-badge nurse-dashboard-status-${activity.status}`}
                    >
                      {activity.status === "completed"
                        ? "✓ Completed"
                        : "⏳ Pending"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                  <div className="nurse-dashboard-no-activities">
                    <p>No recent activities today</p>
                    <small>New registrations will appear here</small>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Child Registration Form Modal */}
      {showRegistrationForm && (
        <div className="nurse-dashboard-modal-overlay">
          <div className="nurse-dashboard-modal-content">
            <div className="nurse-dashboard-modal-header">
              <h2>Register New Patient</h2>
              <button
                className="nurse-dashboard-modal-close"
                onClick={() => setShowRegistrationForm(false)}
              >
                ×
              </button>
            </div>

            {registrationStep === 1 && (
              <div className="nurse-dashboard-registration-form">
                <h3>Step 1: Child Information</h3>
                <div className="nurse-dashboard-form-grid">
                  <div className="nurse-dashboard-form-group">
                    <label>Patient's Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="Enter child's name"
                      className={formErrors.fullName ? "error-input" : ""}
                    />
                    {formErrors.fullName && (
                      <span className="error-message">
                        {formErrors.fullName}
                      </span>
                    )}
                  </div>
                  <div className="nurse-dashboard-form-group">
                    <label>Estimated Birth Year *</label>
                    <input
                      type="number"
                      name="estimatedBirthYear"
                      value={formData.estimatedBirthYear}
                      onChange={handleFormChange}
                      placeholder="e.g., 2020"
                      className={
                        formErrors.estimatedBirthYear ? "error-input" : ""
                      }
                    />
                    {formErrors.estimatedBirthYear && (
                      <span className="error-message">
                        {formErrors.estimatedBirthYear}
                      </span>
                    )}
                  </div>
                  <div className="nurse-dashboard-form-group">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                      className={formErrors.gender ? "error-input" : ""}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {formErrors.gender && (
                      <span className="error-message">{formErrors.gender}</span>
                    )}
                  </div>
                  <div className="nurse-dashboard-form-group">
                    <label>Location *</label>
                    <select
                      name="primaryLocationId"
                      value={formData.primaryLocationId}
                      onChange={handleFormChange}
                      className={
                        formErrors.primaryLocationId ? "error-input" : ""
                      }
                    >
                      <option value="">Select Location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.primaryLocationId && (
                      <span className="error-message">
                        {formErrors.primaryLocationId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="nurse-dashboard-modal-actions">
                  <button
                    className="nurse-dashboard-btn-secondary"
                    onClick={() => setShowRegistrationForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="nurse-dashboard-btn-primary"
                    onClick={() => setRegistrationStep(2)}
                  >
                    Next: Capture Fingerprint
                  </button>
                </div>
              </div>
            )}

            {registrationStep === 2 && (
              <div className="nurse-dashboard-fingerprint-section">
                <h3>Step 2: Capture Fingerprint</h3>
                <div className="nurse-dashboard-fingerprint-area">
                  <svg
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
                      stroke="#667eea"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"
                      stroke="#667eea"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"
                      stroke="#667eea"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M18 12C18 8.69 15.31 6 12 6"
                      stroke="#667eea"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <p>Place finger on the scanner</p>
                  <button
                    className="nurse-dashboard-btn-primary"
                    onClick={handleFingerprintCapture}
                  >
                    Capture Fingerprint
                  </button>
                </div>
                <div className="nurse-dashboard-modal-actions">
                  <button
                    className="nurse-dashboard-btn-secondary"
                    onClick={() => setRegistrationStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="nurse-dashboard-btn-secondary"
                    onClick={() => setShowRegistrationForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showFingerprintCapture && registrationStep === 2 && (
              <div className="nurse-dashboard-success-message">
                <h3>✓ Fingerprint Captured Successfully!</h3>
                <div className="nurse-dashboard-modal-actions">
                  <button
                    className="nurse-dashboard-btn-primary"
                    onClick={handleContinueRegistration}
                  >
                    Complete Registration
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verify Fingerprint Modal */}
      {showVerifyFingerprint && (
        <div className="nurse-dashboard-modal-overlay">
          <div className="nurse-dashboard-modal-content">
            <div className="nurse-dashboard-modal-header">
              <h2>Verify Fingerprint</h2>
              <button
                className="nurse-dashboard-modal-close"
                onClick={() => setShowVerifyFingerprint(false)}
              >
                ×
              </button>
            </div>
            <div className="nurse-dashboard-fingerprint-area">
              <svg
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
                  stroke="#667eea"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"
                  stroke="#667eea"
                  strokeWidth="1.5"
                />
              </svg>
              <p>Place finger on the scanner to verify</p>
              <button
                className="nurse-dashboard-btn-primary"
                onClick={verifyFingerprint}
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify Fingerprint"}
              </button>
            </div>

            {fingerprintExists === true && existingChild && (
              <div className="nurse-dashboard-verification-result">
                <div className="nurse-dashboard-success-message">
                  <h3>✓ Fingerprint Found!</h3>
                  <p>Patient already registered in the system.</p>
                  <div className="nurse-dashboard-child-info">
                    <p>
                      <strong>Name:</strong> {existingChild.fullName}
                    </p>
                    <p>
                      <strong>ID:</strong> {existingChild.customSerialId}
                    </p>
                    <p>
                      <strong>Age:</strong> {existingChild.age}
                    </p>
                    <p>
                      <strong>Gender:</strong> {existingChild.gender}
                    </p>
                    <p>
                      <strong>Location:</strong> {existingChild.locationName}
                    </p>
                    <p>
                      <strong>Last Visit:</strong> {existingChild.lastVisit}
                    </p>
                  </div>
                  <div className="nurse-dashboard-modal-actions">
                    <button
                      className="nurse-dashboard-btn-primary"
                      onClick={handleLoadExistingRecord}
                    >
                      Load Existing Record
                    </button>
                    <button
                      className="nurse-dashboard-btn-secondary"
                      onClick={() => {
                        setShowVerifyFingerprint(false);
                        setFingerprintExists(null);
                        setExistingChild(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {fingerprintExists === false && (
              <div className="nurse-dashboard-verification-result">
                <div className="nurse-dashboard-info-message">
                  <h3>ℹ Fingerprint Not Found</h3>
                  <p>
                    This patient is not registered. Would you like to register
                    them?
                  </p>
                  <div className="nurse-dashboard-modal-actions">
                    <button
                      className="nurse-dashboard-btn-primary"
                      onClick={() => {
                        setShowVerifyFingerprint(false);
                        setShowRegistrationForm(true);
                        setFingerprintExists(null);
                      }}
                    >
                      Register New Patient
                    </button>
                    <button
                      className="nurse-dashboard-btn-secondary"
                      onClick={() => {
                        setShowVerifyFingerprint(false);
                        setFingerprintExists(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseDashboard;