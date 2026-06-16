import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './VolunteerAdmin.css';

import { API_ENDPOINTS, API_BASE_URL } from '../../config/endpoints.js';
import { executeQuery, executeRun } from '../../services/db.js';
const API_TIMEOUT = 10000;

const VolunteerAdmin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('list');
  const [applications, setApplications] = useState([]);
  const [editingApplication, setEditingApplication] = useState(null);
  const [viewingApplication, setViewingApplication] = useState(null);
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

  const IconView = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

  const IconEmail = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7L12 13L2 7"/>
    </svg>
  );

  const IconPhone = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );

  const IconCalendar = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );

  const IconMedical = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v8M8 12h8"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );

  const IconOutreach = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  const IconEducation = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );

  const IconAdmin = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );

  const IconFundraising = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );

  const IconOther = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.06.07A10 10 0 0 0 12 17.66a10 10 0 0 0 5.34-1.59l.06-.07z"/>
    </svg>
  );

  const volunteerTypes = {
    medical: { label: 'Medical Professional', icon: 'medical', color: '#10b981' },
    outreach: { label: 'Outreach Volunteer', icon: 'outreach', color: '#3b82f6' },
    education: { label: 'Health Educator', icon: 'education', color: '#f59e0b' },
    admin: { label: 'Administrative Support', icon: 'admin', color: '#8b5cf6' },
    fundraising: { label: 'Fundraising', icon: 'fundraising', color: '#ec489a' },
    other: { label: 'Other', icon: 'other', color: '#64748b' }
  };

  // Get volunteer type icon component
  const getVolunteerTypeIcon = (type) => {
    switch(type) {
      case 'medical': return <IconMedical />;
      case 'outreach': return <IconOutreach />;
      case 'education': return <IconEducation />;
      case 'admin': return <IconAdmin />;
      case 'fundraising': return <IconFundraising />;
      default: return <IconOther />;
    }
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
      const response = await fetchWithTimeout(API_ENDPOINTS.volunteerApplications);
      const data = await response.json();
      
      let apps = [];
      if (response.ok) {
        if (data.success && data.applications) {
          apps = data.applications;
        } else if (Array.isArray(data)) {
          apps = data;
        }
      }

      if (apps.length > 0) {
        setApplications(apps);
        // Cache in SQLite
        for (const app of apps) {
          await executeRun(
            `INSERT OR REPLACE INTO volunteer_applications (id, full_name, email_address, phone_number, volunteer_type, message, created_at, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              app.id,
              app.fullName || app.full_name || '',
              app.emailAddress || app.email_address || '',
              app.phoneNumber || app.phone_number || '',
              app.volunteerType || app.volunteer_type || 'other',
              app.message || '',
              app.createdAt || app.created_at || new Date().toISOString(),
              app.lastModifiedAt || app.last_modified_at || new Date().toISOString()
            ]
          );
        }
      } else {
        console.error('Failed to fetch applications:', data.message);
        setApplications([]);
      }
    } catch (error) {
      console.warn('API: Failed to fetch volunteer applications, falling back to local SQLite...', error);
      try {
        const localApps = await executeQuery("SELECT * FROM volunteer_applications ORDER BY created_at DESC");
        const mapped = localApps.map(app => ({
          id: app.id,
          fullName: app.full_name,
          emailAddress: app.email_address,
          phoneNumber: app.phone_number,
          volunteerType: app.volunteer_type,
          message: app.message,
          createdAt: app.created_at,
          lastModifiedAt: app.last_modified_at
        }));
        setApplications(mapped);
      } catch (dbError) {
        console.error('Local SQLite volunteer query failed:', dbError);
        setApplications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Create volunteer application
  const createApplication = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.volunteerApplications, {
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
      const response = await fetchWithTimeout(API_ENDPOINTS.volunteerApplication(editingApplication.id), {
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
      const response = await fetchWithTimeout(API_ENDPOINTS.volunteerApplication(id), {
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

  // Get volunteer type details
  const getVolunteerTypeDetails = (type) => {
    return volunteerTypes[type] || { label: type || 'Not specified', icon: 'other', color: '#64748b' };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================
  // VOLUNTEER APPLICATION VIEW PAGE
  // ============================================
  const renderApplicationViewPage = () => (
    <div className="va-page">
      <div className="va-header">
        <button className="va-back-btn" onClick={() => setActivePage('applications')}>
          <IconBack /> Back to Applications
        </button>
        <div className="va-header-title">
          <h2>Volunteer Application Details</h2>
        </div>
      </div>

      {viewingApplication && (
        <div className="va-view-container">
          <div className="va-view-header">
            <div className="va-view-avatar">
              <span>{viewingApplication.fullName?.charAt(0) || 'V'}</span>
            </div>
            <div className="va-view-header-info">
              <h2>{viewingApplication.fullName}</h2>
              <div className="va-view-badge">
                <span className="va-type-badge">
                  {getVolunteerTypeIcon(viewingApplication.volunteerType)}
                  {getVolunteerTypeDetails(viewingApplication.volunteerType).label}
                </span>
                <span className="va-date-badge">
                  <IconCalendar /> Applied on {formatDate(viewingApplication.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="va-view-section">
            <h3>Contact Information</h3>
            <div className="va-contact-grid">
              <div className="va-contact-card">
                <div className="va-contact-icon">
                  <IconEmail />
                </div>
                <div className="va-contact-details">
                  <label>Email Address</label>
                  <a href={`mailto:${viewingApplication.emailAddress}`}>{viewingApplication.emailAddress}</a>
                </div>
              </div>
              <div className="va-contact-card">
                <div className="va-contact-icon">
                  <IconPhone />
                </div>
                <div className="va-contact-details">
                  <label>Phone Number</label>
                  <a href={`tel:${viewingApplication.phoneNumber}`}>{viewingApplication.phoneNumber}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="va-view-section">
            <h3>Volunteer Information</h3>
            <div className="va-view-info-grid">
              <div className="va-view-info-item">
                <label>Volunteer Type</label>
                <div className="va-type-display" style={{ backgroundColor: `${getVolunteerTypeDetails(viewingApplication.volunteerType).color}10`, borderColor: getVolunteerTypeDetails(viewingApplication.volunteerType).color }}>
                  {getVolunteerTypeIcon(viewingApplication.volunteerType)}
                  <span style={{ color: getVolunteerTypeDetails(viewingApplication.volunteerType).color }}>
                    {getVolunteerTypeDetails(viewingApplication.volunteerType).label}
                  </span>
                </div>
              </div>
              <div className="va-view-info-item">
                <label>Application ID</label>
                <span className="va-app-id">{viewingApplication.id?.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="va-view-section">
            <h3>Application Message</h3>
            <div className="va-message-box">
              <p>{viewingApplication.message || 'No message provided.'}</p>
            </div>
          </div>

          <div className="va-view-actions">
            <button 
              className="va-btn va-btn-primary" 
              onClick={() => {
                setEditingApplication(viewingApplication);
                setFormData({
                  id: viewingApplication.id,
                  fullName: viewingApplication.fullName,
                  emailAddress: viewingApplication.emailAddress,
                  phoneNumber: viewingApplication.phoneNumber,
                  volunteerType: viewingApplication.volunteerType,
                  message: viewingApplication.message
                });
                setActivePage('edit_application');
              }}
            >
              Edit Application
            </button>
            <button 
              className="va-btn va-btn-secondary" 
              onClick={() => setActivePage('applications')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

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
        
        <div className="va-stat-card">
          <div className="va-stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div className="va-stat-info">
            <h3>{applications.filter(a => a.createdAt && new Date(a.createdAt).toDateString() === new Date().toDateString()).length}</h3>
            <p>Applications Today</p>
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

  // Render Applications List with View Button
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
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr key={app.id}>
                <td>{index + 1}</td>
                <td><strong>{app.fullName}</strong></td>
                <td>{app.emailAddress}</td>
                <td>{app.phoneNumber}</td>
                <td>
                  <span className="va-type-tag" style={{ backgroundColor: `${getVolunteerTypeDetails(app.volunteerType).color}20`, color: getVolunteerTypeDetails(app.volunteerType).color }}>
                    {getVolunteerTypeIcon(app.volunteerType)} {getVolunteerTypeDetails(app.volunteerType).label}
                  </span>
                </td>
                <td className="va-desc-cell">{app.message}</td>
                <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <div className="va-action-buttons">
                    <button className="va-action-btn va-view" onClick={() => {
                      setViewingApplication(app);
                      setActivePage('view_application');
                    }}>
                      <IconView /> View
                    </button>
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
                  </div>
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
        {activePage === 'view_application' && renderApplicationViewPage()}
        {activePage === 'add_application' && renderApplicationForm()}
        {activePage === 'edit_application' && renderApplicationForm()}
      </div>
    </Layout>
  );
};

export default VolunteerAdmin;