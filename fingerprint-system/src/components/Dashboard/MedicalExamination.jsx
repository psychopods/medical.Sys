import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './MedicalExamination.css';

const MedicalExamination = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [vitalSigns, setVitalSigns] = useState({
    weight: '',
    height: '',
    temperature: '',
    bloodPressure: '',
    heartRate: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const handleReviewPatients = () => {
    alert('Viewing all assigned patients');
  };

  const handleRecordDiagnosis = () => {
    if (selectedPatient) {
      alert(`Recording diagnosis for ${selectedPatient.name}`);
    } else {
      alert('Please select a patient first');
    }
  };

  const handleWritePrescription = () => {
    if (selectedPatient) {
      alert(`Writing prescription for ${selectedPatient.name}`);
    } else {
      alert('Please select a patient first');
    }
  };

  const handleVitalSignsChange = (e) => {
    setVitalSigns({
      ...vitalSigns,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveVitalSigns = () => {
    alert('Vital signs saved successfully');
  };

  const patients = [];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="medical-examination-container">
        <div className="page-header">
          <h1>Medical Examination</h1>
          <p>Review patients, record diagnosis and vital signs</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Pending Patients</p>
              <span className="trend">No pending patients</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Today's Consultations</p>
              <span className="trend">+0 from yesterday</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Prescriptions Written</p>
              <span className="trend">This week</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-title">Quick Actions</div>
        <div className="actions-grid">
          <div className="action-card" onClick={handleReviewPatients}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Review Patients</h4>
              <p>View all assigned children</p>
            </div>
          </div>
          <div className="action-card" onClick={handleRecordDiagnosis}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Record Diagnosis</h4>
              <p>Enter medical diagnosis</p>
            </div>
          </div>
          <div className="action-card" onClick={handleWritePrescription}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Write Prescription</h4>
              <p>Prescribe medication</p>
            </div>
          </div>
        </div>

        {/* Vital Signs Section */}
        <div className="section-title">Vital Signs Recording</div>
        <div className="vital-signs-card">
          <div className="vital-signs-grid">
            <div className="vital-input">
              <label>Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={vitalSigns.weight}
                onChange={handleVitalSignsChange}
                placeholder="Enter weight"
              />
            </div>
            <div className="vital-input">
              <label>Height (cm)</label>
              <input
                type="number"
                name="height"
                value={vitalSigns.height}
                onChange={handleVitalSignsChange}
                placeholder="Enter height"
              />
            </div>
            <div className="vital-input">
              <label>Temperature (°C)</label>
              <input
                type="number"
                name="temperature"
                value={vitalSigns.temperature}
                onChange={handleVitalSignsChange}
                placeholder="Enter temperature"
                step="0.1"
              />
            </div>
            <div className="vital-input">
              <label>Blood Pressure</label>
              <input
                type="text"
                name="bloodPressure"
                value={vitalSigns.bloodPressure}
                onChange={handleVitalSignsChange}
                placeholder="e.g., 120/80"
              />
            </div>
            <div className="vital-input">
              <label>Heart Rate (bpm)</label>
              <input
                type="number"
                name="heartRate"
                value={vitalSigns.heartRate}
                onChange={handleVitalSignsChange}
                placeholder="Enter heart rate"
              />
            </div>
          </div>
          <button className="save-vital-btn" onClick={handleSaveVitalSigns}>
            Save Vital Signs
          </button>
        </div>

        {/* Patients List */}
        <div className="section-title">Assigned Patients</div>
        <div className="recent-table">
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Age</th>
                <th>Condition</th>
                <th>Vital Signs</th>
                <th>Last Visit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className={selectedPatient?.id === patient.id ? 'selected-row' : ''}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <td>{patient.name}</td>
                    <td>{patient.age}</td>
                    <td>{patient.condition}</td>
                    <td>{patient.vitalSigns}</td>
                    <td>{patient.lastVisit}</td>
                    <td>
                      <span className={`status-badge status-${patient.status}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn examine-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Examining ${patient.name}`);
                        }}
                      >
                        Examine
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    No assigned patients found
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

export default MedicalExamination;