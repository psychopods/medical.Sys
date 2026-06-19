import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './Laboratory.css';

const Laboratory = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResult, setTestResult] = useState('');
  const [showResultForm, setShowResultForm] = useState(false);
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

  const handleViewRequests = () => {
    alert('Viewing all laboratory requests');
  };

  const handleRecordResults = () => {
    if (selectedTest) {
      setShowResultForm(true);
    } else {
      alert('Please select a test first');
    }
  };

  const handleSendToDoctor = () => {
    if (selectedTest && testResult) {
      alert(`Results for ${selectedTest.patient} sent to doctor`);
      setShowResultForm(false);
      setTestResult('');
      setSelectedTest(null);
    } else if (selectedTest) {
      alert('Please enter test results first');
    } else {
      alert('Please select a test first');
    }
  };

  const handleSubmitResult = () => {
    if (testResult) {
      alert(`Test results recorded for ${selectedTest.patient}`);
      setShowResultForm(false);
      setTestResult('');
    } else {
      alert('Please enter test results');
    }
  };

  const labRequests = [];

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
      <div className="laboratory-container">
        <div className="page-header">
          <h1>Laboratory</h1>
          <p>Manage laboratory tests and results</p>
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
              <p>Pending Tests</p>
              <span className="trend">No pending tests</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Completed Today</p>
              <span className="trend">No tests completed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Results Sent</p>
              <span className="trend">No results sent</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-title">Quick Actions</div>
        <div className="actions-grid">
          <div className="action-card" onClick={handleViewRequests}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>View Requests</h4>
              <p>Review laboratory requests</p>
            </div>
          </div>
          <div className="action-card" onClick={handleRecordResults}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Record Results</h4>
              <p>Enter test results</p>
            </div>
          </div>
          <div className="action-card" onClick={handleSendToDoctor}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Send to Doctor</h4>
              <p>Send results to requesting doctor</p>
            </div>
          </div>
        </div>

        {/* Result Form */}
        {showResultForm && selectedTest && (
          <div className="result-form-card">
            <h3>Record Results for: {selectedTest.patient}</h3>
            <p>Test: {selectedTest.test}</p>
            <div className="result-form-group">
              <label>Test Results</label>
              <textarea
                rows="5"
                value={testResult}
                onChange={(e) => setTestResult(e.target.value)}
                placeholder="Enter detailed test results here..."
              />
            </div>
            <div className="result-actions">
              <button className="submit-result-btn" onClick={handleSubmitResult}>
                Submit Results
              </button>
              <button className="cancel-result-btn" onClick={() => {
                setShowResultForm(false);
                setSelectedTest(null);
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Laboratory Requests Table */}
        <div className="section-title">Laboratory Requests</div>
        <div className="recent-table">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test Type</th>
                <th>Requested By</th>
                <th>Request Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {labRequests.length > 0 ? (
                labRequests.map((request) => (
                  <tr 
                    key={request.id} 
                    className={selectedTest?.id === request.id ? 'selected-row' : ''}
                    onClick={() => setSelectedTest(request)}
                  >
                    <td>{request.patient}</td>
                    <td>{request.test}</td>
                    <td>{request.requestedBy}</td>
                    <td>{request.requestedDate}</td>
                    <td>
                      <span className={`priority-badge priority-${request.priority}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn process-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTest(request);
                          setShowResultForm(true);
                        }}
                      >
                        Process
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    No laboratory requests found
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

export default Laboratory;