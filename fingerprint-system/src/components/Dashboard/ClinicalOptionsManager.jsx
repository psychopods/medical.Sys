// src/components/Dashboard/ClinicalOptionsManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import {
  getClinicalOptions,
  saveMedication,
  saveTest,
  saveMedicalServices,
  registerChild,
  getChildren
} from '../../services/api';
import { executeRun, executeQuery, saveDB } from '../../services/db.js';
import './ClinicalOptionsManager.css';

const ClinicalOptionsManager = ({ onSave, onError }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('medications');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [existingOptions, setExistingOptions] = useState({
    ntdsMeds: [],
    antibiotics: [],
    otherMeds: [],
    testTypes: [],
    testResults: [],
    procedures: []
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const navigate = useNavigate();

  // Form fields for adding new options
  const [newMedication, setNewMedication] = useState({
    name: '',
    category: 'ntdsMeds'
  });

  const [newTest, setNewTest] = useState({
    name: '',
    category: 'testType' // 'testType' or 'testResult'
  });

  const [newProcedure, setNewProcedure] = useState({
    name: ''
  });

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load existing options - PRIMARY: API (MySQL), FALLBACK: SQLite
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Create SQLite tables if they don't exist (for fallback)
        await createSQLiteTables();

        // PRIMARY: Try to load from API (MySQL)
        let options = null;
        let fromAPI = false;

        if (isOnline) {
          try {
            options = await getClinicalOptions();
            fromAPI = true;
          } catch (apiError) {
            console.warn('⚠️ Failed to fetch from API, using SQLite fallback:', apiError);
            fromAPI = false;
          }
        }

        // FALLBACK: If API failed or offline, try SQLite
        if (!options) {
          options = await loadFromSQLite();
        }

        // Set the options in state
        setExistingOptions({
          ntdsMeds: options.medicationOptions?.ntdsMeds || [],
          antibiotics: options.medicationOptions?.antibiotics || [],
          otherMeds: options.medicationOptions?.otherMeds || [],
          testTypes: options.testTypesOptions || [],
          testResults: options.testResultOptions || [],
          procedures: options.procedureOptions || []
        });

        // If data came from API, cache it to SQLite for offline use
        if (fromAPI && options) {
          await cacheToSQLite(options);
        }

        // Load current user
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setCurrentUser(parsedUser);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        showToast('Failed to load clinical options', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, isOnline]);

  // Create SQLite tables for fallback
  const createSQLiteTables = async () => {
    try {
      // lookup_medications table
      await executeRun(
        `CREATE TABLE IF NOT EXISTS lookup_medications (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      // test_reference table
      await executeRun(
        `CREATE TABLE IF NOT EXISTS test_reference (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      // procedure_reference table
      await executeRun(
        `CREATE TABLE IF NOT EXISTS procedure_reference (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );

      await saveDB();
    } catch (err) {
    }
  };

  // Load from SQLite (fallback)
  const loadFromSQLite = async () => {
    try {
      // Load medications
      const medsRows = await executeQuery('SELECT name, category FROM lookup_medications ORDER BY category, name');
      
      const medicationOptions = {
        ntdsMeds: [],
        antibiotics: [],
        otherMeds: []
      };

      medsRows.forEach(row => {
        if (medicationOptions[row.category] !== undefined) {
          medicationOptions[row.category].push(row.name);
        }
      });

      // Load tests
      const testsRows = await executeQuery('SELECT category, name FROM test_reference ORDER BY category, name');
      const testTypes = [];
      const testResults = [];

      testsRows.forEach(row => {
        if (row.category === 'testType') {
          testTypes.push(row.name);
        } else if (row.category === 'testResult') {
          testResults.push(row.name);
        }
      });

      // Load procedures
      const procRows = await executeQuery('SELECT name FROM procedure_reference ORDER BY name');
      const procedures = procRows.map(row => row.name);

      // Default test types and results if none exist
      const defaultTestTypes = [
        "Haemoglobin test (Hb)",
        "Erythrocyte sedimentation rate (ESR)",
        "Blood glucose",
        "Uric acid test",
        "H. Pylori test",
        "Malaria test",
        "HIV test",
        "Urinalysis",
        "VDRL test",
        "Stool test",
        "Widal test"
      ];

      const defaultTestResults = [
        "Negative (-)",
        "Positive (+)",
        "Leukocyte +",
        "Leukocyte ++",
        "Leukocyte +++",
        "Glucose +",
        "Glucose ++",
        "Glucose +++",
        "Schistosoma ova seen",
        "High",
        "Low",
        "Normal",
        "Abnormal"
      ];

      return {
        medicationOptions,
        testTypesOptions: testTypes.length > 0 ? testTypes : defaultTestTypes,
        testResultOptions: testResults.length > 0 ? testResults : defaultTestResults,
        procedureOptions: procedures
      };
    } catch (error) {
      console.error('Error loading from SQLite:', error);
      // Return defaults
      return {
        medicationOptions: { ntdsMeds: [], antibiotics: [], otherMeds: [] },
        testTypesOptions: [
          "Haemoglobin test (Hb)",
          "Erythrocyte sedimentation rate (ESR)",
          "Blood glucose",
          "Uric acid test",
          "H. Pylori test",
          "Malaria test",
          "HIV test",
          "Urinalysis",
          "VDRL test",
          "Stool test",
          "Widal test"
        ],
        testResultOptions: [
          "Negative (-)",
          "Positive (+)",
          "Leukocyte +",
          "Leukocyte ++",
          "Leukocyte +++",
          "Glucose +",
          "Glucose ++",
          "Glucose +++",
          "Schistosoma ova seen",
          "High",
          "Low",
          "Normal",
          "Abnormal"
        ],
        procedureOptions: []
      };
    }
  };

  // Cache API data to SQLite
  const cacheToSQLite = async (options) => {
    try {
      // Cache medications
      const medCategories = ['ntdsMeds', 'antibiotics', 'otherMeds'];
      for (const cat of medCategories) {
        const meds = options.medicationOptions?.[cat] || [];
        // Clear existing
        await executeRun('DELETE FROM lookup_medications WHERE category = ?', [cat]);
        // Insert new
        for (const name of meds) {
          const id = crypto.randomUUID ? crypto.randomUUID() : 'med_' + Date.now() + '_' + Math.random();
          await executeRun(
            'INSERT INTO lookup_medications (id, name, category) VALUES (?, ?, ?)',
            [id, name, cat]
          );
        }
      }

      // Cache tests
      const testTypes = options.testTypesOptions || [];
      const testResults = options.testResultOptions || [];
      await executeRun('DELETE FROM test_reference');
      for (const name of testTypes) {
        const id = crypto.randomUUID ? crypto.randomUUID() : 'test_' + Date.now() + '_' + Math.random();
        await executeRun(
          'INSERT INTO test_reference (id, category, name) VALUES (?, ?, ?)',
          [id, 'testType', name]
        );
      }
      for (const name of testResults) {
        const id = crypto.randomUUID ? crypto.randomUUID() : 'test_' + Date.now() + '_' + Math.random();
        await executeRun(
          'INSERT INTO test_reference (id, category, name) VALUES (?, ?, ?)',
          [id, 'testResult', name]
        );
      }

      // Cache procedures
      const procedures = options.procedureOptions || [];
      await executeRun('DELETE FROM procedure_reference');
      for (const name of procedures) {
        const id = crypto.randomUUID ? crypto.randomUUID() : 'proc_' + Date.now() + '_' + Math.random();
        await executeRun(
          'INSERT INTO procedure_reference (id, name) VALUES (?, ?)',
          [id, name]
        );
      }

      await saveDB();
    } catch (error) {
      console.warn('Failed to cache to SQLite:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  // Save new medication - Save to API (MySQL) and cache to SQLite
  const handleSaveMedication = async () => {
    if (!newMedication.name.trim()) {
      showToast('Please enter a medication name.', 'error');
      return;
    }

    const category = newMedication.category;
    if (existingOptions[category].includes(newMedication.name.trim())) {
      showToast('This medication already exists in the list.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const id = crypto.randomUUID ? crypto.randomUUID() : 'med_' + Date.now();

      // PRIMARY: Save to MySQL via API
      if (isOnline) {
        try {
          // Call API to save medication
          await saveMedication(id, newMedication.name.trim(), category);
        } catch (apiError) {
          console.warn('⚠️ Failed to save to API, saving to SQLite only:', apiError);
        }
      }

      // ALWAYS save to SQLite (for offline access)
      await executeRun(
        "INSERT OR REPLACE INTO lookup_medications (id, name, category) VALUES (?, ?, ?)",
        [id, newMedication.name.trim(), newMedication.category]
      );
      await saveDB();

      // Update state
      setExistingOptions(prev => ({
        ...prev,
        [category]: [...prev[category], newMedication.name.trim()]
      }));

      showToast(`Medication "${newMedication.name.trim()}" added successfully!`, 'success');
      setNewMedication({ name: '', category: 'ntdsMeds' });
    } catch (error) {
      console.error('Error saving medication:', error);
      showToast('Failed to save medication.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save new test - Save to API (MySQL) and cache to SQLite
  const handleSaveTest = async () => {
    if (!newTest.name.trim()) {
      showToast('Please enter a test name.', 'error');
      return;
    }

    const category = newTest.category;
    const key = category === 'testType' ? 'testTypes' : 'testResults';
    if (existingOptions[key].includes(newTest.name.trim())) {
      showToast('This test already exists in the list.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const id = crypto.randomUUID ? crypto.randomUUID() : 'test_' + Date.now();

      // PRIMARY: Save to MySQL via API
      if (isOnline) {
        try {
          await saveTest(id, newTest.name.trim(), category);
        } catch (apiError) {
          console.warn('⚠️ Failed to save to API, saving to SQLite only:', apiError);
        }
      }

      // ALWAYS save to SQLite
      await executeRun(
        `INSERT OR REPLACE INTO test_reference (id, category, name, description) 
         VALUES (?, ?, ?, ?)`,
        [id, newTest.category, newTest.name.trim(), '']
      );
      await saveDB();

      setExistingOptions(prev => ({
        ...prev,
        [key]: [...prev[key], newTest.name.trim()]
      }));

      showToast(`Test "${newTest.name.trim()}" added successfully!`, 'success');
      setNewTest({ name: '', category: 'testType' });
    } catch (error) {
      console.error('Error saving test:', error);
      showToast('Failed to save test.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save new procedure - Save to API (MySQL) and cache to SQLite
  const handleSaveProcedure = async () => {
    if (!newProcedure.name.trim()) {
      showToast('Please enter a procedure name.', 'error');
      return;
    }

    if (existingOptions.procedures.includes(newProcedure.name.trim())) {
      showToast('This procedure already exists in the list.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const id = crypto.randomUUID ? crypto.randomUUID() : 'proc_' + Date.now();

      // PRIMARY: Save to MySQL via API
      if (isOnline) {
        try {
          // Use saveMedicalServices or a dedicated procedure API
          await saveMedicalServices(id, newProcedure.name.trim(), 'procedure');
        } catch (apiError) {
          console.warn('⚠️ Failed to save to API, saving to SQLite only:', apiError);
        }
      }

      // ALWAYS save to SQLite
      await executeRun(
        "INSERT OR REPLACE INTO procedure_reference (id, name) VALUES (?, ?)",
        [id, newProcedure.name.trim()]
      );
      await saveDB();

      setExistingOptions(prev => ({
        ...prev,
        procedures: [...prev.procedures, newProcedure.name.trim()]
      }));

      showToast(`Procedure "${newProcedure.name.trim()}" added successfully!`, 'success');
      setNewProcedure({ name: '' });
    } catch (error) {
      console.error('Error saving procedure:', error);
      showToast('Failed to save procedure.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete a medication - Delete from API (MySQL) and SQLite
  const handleDeleteMedication = async (name, category) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      // PRIMARY: Delete from MySQL via API
      if (isOnline) {
        try {
          // Assuming there's a delete endpoint
          await fetch(`/api/clinical/medications/${encodeURIComponent(name)}?category=${category}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (apiError) {
          console.warn('⚠️ Failed to delete from API, deleting from SQLite only:', apiError);
        }
      }

      // ALWAYS delete from SQLite
      await executeRun(
        "DELETE FROM lookup_medications WHERE name = ? AND category = ?",
        [name, category]
      );
      await saveDB();

      setExistingOptions(prev => ({
        ...prev,
        [category]: prev[category].filter(item => item !== name)
      }));

      showToast(`Removed "${name}" from list.`, 'success');
    } catch (error) {
      console.error('Error deleting medication:', error);
      showToast('Failed to delete medication.', 'error');
    }
  };

  // Delete a test - Delete from API (MySQL) and SQLite
  const handleDeleteTest = async (name, category) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    const key = category === 'testType' ? 'testTypes' : 'testResults';
    try {
      // PRIMARY: Delete from MySQL via API
      if (isOnline) {
        try {
          await fetch(`/api/clinical/tests/${encodeURIComponent(name)}?category=${category}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (apiError) {
          console.warn('⚠️ Failed to delete from API, deleting from SQLite only:', apiError);
        }
      }

      // ALWAYS delete from SQLite
      await executeRun(
        "DELETE FROM test_reference WHERE name = ? AND category = ?",
        [name, category]
      );
      await saveDB();

      setExistingOptions(prev => ({
        ...prev,
        [key]: prev[key].filter(item => item !== name)
      }));

      showToast(`Removed "${name}" from list.`, 'success');
    } catch (error) {
      console.error('Error deleting test:', error);
      showToast('Failed to delete test.', 'error');
    }
  };

  // Delete a procedure - Delete from API (MySQL) and SQLite
  const handleDeleteProcedure = async (name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      // PRIMARY: Delete from MySQL via API
      if (isOnline) {
        try {
          await fetch(`/api/clinical/procedures/${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (apiError) {
          console.warn('⚠️ Failed to delete from API, deleting from SQLite only:', apiError);
        }
      }

      // ALWAYS delete from SQLite
      await executeRun(
        "DELETE FROM procedure_reference WHERE name = ?",
        [name]
      );
      await saveDB();

      setExistingOptions(prev => ({
        ...prev,
        procedures: prev.procedures.filter(item => item !== name)
      }));

      showToast(`Removed "${name}" from list.`, 'success');
    } catch (error) {
      console.error('Error deleting procedure:', error);
      showToast('Failed to delete procedure.', 'error');
    }
  };

  const ToastNotification = () => {
    if (!toast.show) return null;
    return (
      <div className={`co-toast-notification ${toast.type}`}>
        <div className="co-toast-content">
          {toast.type === 'success' && <span>✓</span>}
          {toast.type === 'error' && <span>✗</span>}
          {toast.type === 'warning' && <span>⚠</span>}
          <span>{toast.message}</span>
        </div>
        <button className="co-toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
      </div>
    );
  };

  // Render Content
  const renderContent = () => (
    <div className="co-clinical-options-container">
      <ToastNotification />
      
      <div className="co-page-header">
        <h1>Clinical Options Manager</h1>
        <p>Manage medication, test, and procedure options for clinical forms</p>
        <div className="co-connection-status">
          <span className={`co-status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span className="co-status-text">{isOnline ? 'Connected to Server' : 'Offline Mode (SQLite only)'}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="co-tab-navigation">
        <nav>
          {['medications', 'tests', 'procedures'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`co-tab-button ${activeTab === tab ? 'active' : ''}`}
              disabled={saving}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="co-tab-content">
        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="co-form-container-full">
            <div className="co-form-section">
              <h3 className="co-section-title">Add New Medication</h3>
              <div className="co-form-grid-full">
                <div className="co-form-group">
                  <label>Category</label>
                  <select
                    value={newMedication.category}
                    onChange={(e) => setNewMedication({ ...newMedication, category: e.target.value })}
                    disabled={saving}
                  >
                    <option value="ntdsMeds">NTDs Meds</option>
                    <option value="antibiotics">Antibiotics</option>
                    <option value="otherMeds">Other Medications</option>
                  </select>
                </div>

                <div className="co-form-group">
                  <label>Medication Name *</label>
                  <input
                    type="text"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                    placeholder="Enter medication name"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="co-form-actions">
                <button
                  onClick={handleSaveMedication}
                  className="co-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="co-spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    'Add Medication'
                  )}
                </button>
              </div>
            </div>

            {/* Display existing medications */}
            <div className="co-existing-list">
              <h3 className="co-section-title">Existing Medications</h3>
              
              <div className="co-category-section">
                <h4>NTDs Meds <span className="count-badge">{existingOptions.ntdsMeds.length}</span></h4>
                <div className="co-tag-list">
                  {existingOptions.ntdsMeds.map((item) => (
                    <span key={item} className="co-tag">
                      {item}
                      <button
                        className="co-tag-remove"
                        onClick={() => handleDeleteMedication(item, 'ntdsMeds')}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {existingOptions.ntdsMeds.length === 0 && (
                    <span className="co-empty-text">No NTDs medications added yet.</span>
                  )}
                </div>
              </div>

              <div className="co-category-section">
                <h4>Antibiotics <span className="count-badge">{existingOptions.antibiotics.length}</span></h4>
                <div className="co-tag-list">
                  {existingOptions.antibiotics.map((item) => (
                    <span key={item} className="co-tag">
                      {item}
                      <button
                        className="co-tag-remove"
                        onClick={() => handleDeleteMedication(item, 'antibiotics')}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {existingOptions.antibiotics.length === 0 && (
                    <span className="co-empty-text">No antibiotics added yet.</span>
                  )}
                </div>
              </div>

              <div className="co-category-section">
                <h4>Other Medications <span className="count-badge">{existingOptions.otherMeds.length}</span></h4>
                <div className="co-tag-list">
                  {existingOptions.otherMeds.map((item) => (
                    <span key={item} className="co-tag">
                      {item}
                      <button
                        className="co-tag-remove"
                        onClick={() => handleDeleteMedication(item, 'otherMeds')}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {existingOptions.otherMeds.length === 0 && (
                    <span className="co-empty-text">No other medications added yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="co-form-container-full">
            <div className="co-form-section">
              <h3 className="co-section-title">Add New Test</h3>
              <div className="co-form-grid-full">
                <div className="co-form-group">
                  <label>Category</label>
                  <select
                    value={newTest.category}
                    onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                    disabled={saving}
                  >
                    <option value="testType">Test Type</option>
                    <option value="testResult">Test Result</option>
                  </select>
                </div>

                <div className="co-form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="Enter test name"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="co-form-actions">
                <button
                  onClick={handleSaveTest}
                  className="co-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="co-spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    'Add Test'
                  )}
                </button>
              </div>
            </div>

            {/* Display existing tests */}
            <div className="co-existing-list">
              <h3 className="co-section-title">Existing Tests</h3>
              
              <div className="co-category-section">
                <h4>Test Types <span className="count-badge">{existingOptions.testTypes.length}</span></h4>
                <div className="co-tag-list">
                  {existingOptions.testTypes.map((item) => (
                    <span key={item} className="co-tag">
                      {item}
                      <button
                        className="co-tag-remove"
                        onClick={() => handleDeleteTest(item, 'testType')}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {existingOptions.testTypes.length === 0 && (
                    <span className="co-empty-text">No test types added yet.</span>
                  )}
                </div>
              </div>

              <div className="co-category-section">
                <h4>Test Results <span className="count-badge">{existingOptions.testResults.length}</span></h4>
                <div className="co-tag-list">
                  {existingOptions.testResults.map((item) => (
                    <span key={item} className="co-tag">
                      {item}
                      <button
                        className="co-tag-remove"
                        onClick={() => handleDeleteTest(item, 'testResult')}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {existingOptions.testResults.length === 0 && (
                    <span className="co-empty-text">No test results added yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Procedures Tab */}
        {activeTab === 'procedures' && (
          <div className="co-form-container-full">
            <div className="co-form-section">
              <h3 className="co-section-title">Add New Procedure</h3>
              <div className="co-form-grid-full">
                <div className="co-form-group">
                  <label>Procedure Name *</label>
                  <input
                    type="text"
                    value={newProcedure.name}
                    onChange={(e) => setNewProcedure({ ...newProcedure, name: e.target.value })}
                    placeholder="Enter procedure name"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="co-form-actions">
                <button
                  onClick={handleSaveProcedure}
                  className="co-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="co-spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    'Add Procedure'
                  )}
                </button>
              </div>
            </div>

            {/* Display existing procedures */}
            <div className="co-existing-list">
              <h3 className="co-section-title">Existing Procedures</h3>
              <div className="co-category-section">
                <h4>Procedures <span className="count-badge">{existingOptions.procedures.length}</span></h4>
                <div className="co-tag-list">
                  {existingOptions.procedures.map((item) => (
                    <span key={item} className="co-tag">
                      {item}
                      <button
                        className="co-tag-remove"
                        onClick={() => handleDeleteProcedure(item)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {existingOptions.procedures.length === 0 && (
                    <span className="co-empty-text">No procedures added yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="co-dashboard-loading">
          <div className="co-spinner"></div>
          <p>Loading clinical options...</p>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default ClinicalOptionsManager;