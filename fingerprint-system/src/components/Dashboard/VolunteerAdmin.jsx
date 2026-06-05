import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './VolunteerAdmin.css';

const API_BASE_URL = 'http://localhost:9865';
const API_TIMEOUT = 10000;

const VolunteerAdmin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('list');
  const [applications, setApplications] = useState([]);
  const [editingApplication, setEditingApplication] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    volunteerType: '',
    message: ''
  });

  const navigate = useNavigate();

  // Icon components
  const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
    </svg>
  );

  const IconDelete = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7H20" strokeWidth="2"/>
      <path d="M10 11V17" strokeWidth="2"/>
      <path d="M14 11V17" strokeWidth="2"/>
      <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/>
      <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/>
    </svg>
  );

  const IconAdd = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5V19" strokeWidth="2"/>
      <path d="M5 12H19" strokeWidth="2"/>
    </svg>
  );

  const IconBack = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18L9 12L15 6" strokeWidth="2"/>
    </svg>
  );

  const volunteerTypes = {
    medical: 'Medical Professional',
    outreach: 'Outreach Volunteer',
    education: 'Health Educator',
    admin: 'Administrative Support',
    fundraising: 'Fundraising',
    other: 'Other'
  };

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch with timeout and auth
  const fetchWithTimeout = async (url, options = {}, timeout = API_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Fetch volunteer applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/volunteer/applications`);
      const data = await response.json();
      
      console.log('Volunteer applications response:', data);
      
      if (response.ok) {
        if (data.success && data.applications) {
          setApplications(data.applications);
        } else if (Array.isArray(data)) {
          setApplications(data);
        } else {
          setApplications([]);
        }
      } else {
        console.error('Failed to fetch applications:', data.message);
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Create volunteer application
  const createApplication = async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/volunteer/applications`, {
        method: 'POST',
        body: JSON.stringify({
          id: crypto.randomUUID(),
          fullName: formData.fullName,
          emailAddress: formData.emailAddress,
          phoneNumber: formData.phoneNumber,
          volunteerType: formData.volunteerType,
          message: formData.message
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Volunteer application created successfully');
        fetchApplications();
        setActivePage('applications');
        resetForm();
      } else {
        showToastMessage(data.message || 'Failed to create application', 'error');
      }
    } catch (error) {
      console.error('Error creating application:', error);
      showToastMessage('Network error', 'error');
    }
  };

  // Update volunteer application
  const updateApplication = async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/volunteer/applications/${editingApplication.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: formData.fullName,
          emailAddress: formData.emailAddress,
          phoneNumber: formData.phoneNumber,
          volunteerType: formData.volunteerType,
          message: formData.message
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Volunteer application updated successfully');
        fetchApplications();
        setActivePage('applications');
        setEditingApplication(null);
        resetForm();
      } else {
        showToastMessage(data.message || 'Failed to update application', 'error');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      showToastMessage('Network error', 'error');
    }
  };

  // Delete volunteer application
  const deleteApplication = async (id, name) => {
    if (!window.confirm(`Delete application from "${name}"?`)) return;
    
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/volunteer/applications/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Volunteer application deleted successfully');
        fetchApplications();
      } else {
        showToastMessage(data.message || 'Failed to delete application', 'error');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      showToastMessage('Network error', 'error');
    }
  };

  const resetForm = () => {
    setEditingApplication(null);
    setFormData({
      id: '',
      fullName: '',
      emailAddress: '',
      phoneNumber: '',
      volunteerType: '',
      message: ''
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    
    fetchApplications();
  }, [navigate]);

  // Render Dashboard
  const renderDashboard = () => (
    <div className="va-page">
      <div className="va-dashboard-header">
        <h1>Volunteer Applications Management</h1>
        <p>Manage volunteer applications and support requests</p>
      </div>
      
      <div className="va-stats-grid">
        <div className="va-stat-card">
          <div className="va-stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/>
            </svg>
          </div>
          <div className="va-stat-info">
            <h3>{applications.length}</h3>
            <p>Total Applications</p>
          </div>
        </div>
      </div>
      
      <div className="va-actions-grid">
        <div className="va-action-card" onClick={() => { fetchApplications(); setActivePage('applications'); }}>
          <div className="va-action-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/>
            </svg>
          </div>
          <div className="va-action-info">
            <h4>View Applications</h4>
            <p>Manage all volunteer applications</p>
          </div>
        </div>
        
        <div className="va-action-card" onClick={() => { resetForm(); setActivePage('add_application'); }}>
          <div className="va-action-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5V19" strokeWidth="2"/>
              <path d="M5 12H19" strokeWidth="2"/>
            </svg>
          </div>
          <div className="va-action-info">
            <h4>Add Application</h4>
            <p>Manually add a volunteer application</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Applications List
  const renderApplicationsList = () => (
    <div className="va-page">
      <div className="va-header">
        <button className="va-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back
        </button>
        <div className="va-header-title">
          <h2>Volunteer Applications</h2>
          <button className="va-add-btn" onClick={() => { resetForm(); setActivePage('add_application'); }}>
            <IconAdd /> Add Application
          </button>
        </div>
      </div>
      
      <div className="va-table-wrapper">
        <table className="va-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Volunteer Type</th>
              <th>Message</th>
              <th>Submitted</th>
              <th width="100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr key={app.id}>
                <td>{index + 1}</td>
                <td><strong>{app.fullName}</strong></td>
                <td>{app.emailAddress}</td>
                <td>{app.phoneNumber}</td>
                <td>{volunteerTypes[app.volunteerType] || app.volunteerType}</td>
                <td className="va-desc-cell">{app.message}</td>
                <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <button className="va-action-btn va-edit" onClick={() => {
                    setEditingApplication(app);
                    setFormData({
                      id: app.id,
                      fullName: app.fullName,
                      emailAddress: app.emailAddress,
                      phoneNumber: app.phoneNumber,
                      volunteerType: app.volunteerType,
                      message: app.message
                    });
                    setActivePage('edit_application');
                  }}>
                    <IconEdit /> Edit
                  </button>
                  <button className="va-action-btn va-delete" onClick={() => deleteApplication(app.id, app.fullName)}>
                    <IconDelete /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan="8" className="va-empty">No volunteer applications found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Application Form
  const renderApplicationForm = () => (
    <div className="va-page-full">
      <div className="va-header">
        <button className="va-back-btn" onClick={() => { setActivePage('applications'); resetForm(); }}>
          <IconBack /> Back to Applications
        </button>
        <h2>{editingApplication ? 'Edit Volunteer Application' : 'Add Volunteer Application'}</h2>
      </div>
      
      <div className="va-form-full">
        <form onSubmit={(e) => { e.preventDefault(); editingApplication ? updateApplication() : createApplication(); }} className="va-form">
          <div className="va-form-row">
            <div className="va-form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
                placeholder="Enter full name"
              />
            </div>
            
            <div className="va-form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={formData.emailAddress}
                onChange={(e) => setFormData({...formData, emailAddress: e.target.value})}
                required
                placeholder="Enter email address"
              />
            </div>
            
            <div className="va-form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                required
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <div className="va-form-row">
            <div className="va-form-group">
              <label>Volunteer Type *</label>
              <select
                value={formData.volunteerType}
                onChange={(e) => setFormData({...formData, volunteerType: e.target.value})}
                required
              >
                <option value="">Select volunteer type</option>
                <option value="medical">Medical Professional</option>
                <option value="outreach">Outreach Volunteer</option>
                <option value="education">Health Educator</option>
                <option value="admin">Administrative Support</option>
                <option value="fundraising">Fundraising</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="va-form-row">
            <div className="va-form-group">
              <label>Message / Why do you want to volunteer? *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
                rows="5"
                placeholder="Tell us why you're interested in volunteering..."
              />
            </div>
          </div>
          
          <div className="va-buttons">
            <button type="button" className="va-btn va-btn-secondary" onClick={() => { setActivePage('applications'); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="va-btn va-btn-primary">
              {editingApplication ? 'Update Application' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading && applications.length === 0) {
    return (
      <div className="va-loading">
        <div className="va-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="volunteer-admin">
        {toast.show && (
          <div className={`va-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
          </div>
        )}

        {activePage === 'list' && renderDashboard()}
        {activePage === 'applications' && renderApplicationsList()}
        {activePage === 'add_application' && renderApplicationForm()}
        {activePage === 'edit_application' && renderApplicationForm()}
      </div>
    </Layout>
  );
};

export default VolunteerAdmin;