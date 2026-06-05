import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './ContactAdmin.css';

const API_BASE_URL = 'http://localhost:9865';
const API_TIMEOUT = 10000;

const ContactAdmin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('list');
  const [submissions, setSubmissions] = useState([]);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    emailAddress: '',
    messageSubject: '',
    messageContent: ''
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

  // Fetch contact submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/contact/submissions`);
      const data = await response.json();
      
      console.log('Contact submissions response:', data);
      
      if (response.ok) {
        if (data.success && data.submissions) {
          setSubmissions(data.submissions);
        } else if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          setSubmissions([]);
        }
      } else {
        console.error('Failed to fetch submissions:', data.message);
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Create contact submission
  const createSubmission = async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/contact/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          id: crypto.randomUUID(),
          fullName: formData.fullName,
          emailAddress: formData.emailAddress,
          messageSubject: formData.messageSubject,
          messageContent: formData.messageContent
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Contact submission created successfully');
        fetchSubmissions();
        setActivePage('submissions');
        resetForm();
      } else {
        showToastMessage(data.message || 'Failed to create submission', 'error');
      }
    } catch (error) {
      console.error('Error creating submission:', error);
      showToastMessage('Network error', 'error');
    }
  };

  // Update contact submission
  const updateSubmission = async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/contact/submissions/${editingSubmission.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: formData.fullName,
          emailAddress: formData.emailAddress,
          messageSubject: formData.messageSubject,
          messageContent: formData.messageContent
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Contact submission updated successfully');
        fetchSubmissions();
        setActivePage('submissions');
        setEditingSubmission(null);
        resetForm();
      } else {
        showToastMessage(data.message || 'Failed to update submission', 'error');
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      showToastMessage('Network error', 'error');
    }
  };

  // Delete contact submission
  const deleteSubmission = async (id, name) => {
    if (!window.confirm(`Delete submission from "${name}"?`)) return;
    
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/contact/submissions/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Contact submission deleted successfully');
        fetchSubmissions();
      } else {
        showToastMessage(data.message || 'Failed to delete submission', 'error');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      showToastMessage('Network error', 'error');
    }
  };

  const resetForm = () => {
    setEditingSubmission(null);
    setFormData({
      id: '',
      fullName: '',
      emailAddress: '',
      messageSubject: '',
      messageContent: ''
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
    
    fetchSubmissions();
  }, [navigate]);

  // Render Dashboard
  const renderDashboard = () => (
    <div className="ca-page">
      <div className="ca-dashboard-header">
        <h1>Contact Submissions Management</h1>
        <p>Manage contact form submissions from website visitors</p>
      </div>
      
      <div className="ca-stats-grid">
        <div className="ca-stat-card">
          <div className="ca-stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
              <path d="M22 6L12 13L2 6"/>
            </svg>
          </div>
          <div className="ca-stat-info">
            <h3>{submissions.length}</h3>
            <p>Total Submissions</p>
          </div>
        </div>
      </div>
      
      <div className="ca-actions-grid">
        <div className="ca-action-card" onClick={() => { fetchSubmissions(); setActivePage('submissions'); }}>
          <div className="ca-action-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
              <path d="M22 6L12 13L2 6"/>
            </svg>
          </div>
          <div className="ca-action-info">
            <h4>View Submissions</h4>
            <p>View all contact form submissions</p>
          </div>
        </div>
        
        <div className="ca-action-card" onClick={() => { resetForm(); setActivePage('add_submission'); }}>
          <div className="ca-action-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5V19" strokeWidth="2"/>
              <path d="M5 12H19" strokeWidth="2"/>
            </svg>
          </div>
          <div className="ca-action-info">
            <h4>Add Submission</h4>
            <p>Manually add a contact submission</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Submissions List
  const renderSubmissionsList = () => (
    <div className="ca-page">
      <div className="ca-header">
        <button className="ca-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back
        </button>
        <div className="ca-header-title">
          <h2>Contact Submissions</h2>
          <button className="ca-add-btn" onClick={() => { resetForm(); setActivePage('add_submission'); }}>
            <IconAdd /> Add Submission
          </button>
        </div>
      </div>
      
      <div className="ca-table-wrapper">
        <table className="ca-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Submitted</th>
              <th width="100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, index) => (
              <tr key={sub.id}>
                <td>{index + 1}</td>
                <td><strong>{sub.fullName}</strong></td>
                <td>{sub.emailAddress}</td>
                <td>{sub.messageSubject}</td>
                <td className="ca-desc-cell">{sub.messageContent}</td>
                <td>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <button className="ca-action-btn ca-edit" onClick={() => {
                    setEditingSubmission(sub);
                    setFormData({
                      id: sub.id,
                      fullName: sub.fullName,
                      emailAddress: sub.emailAddress,
                      messageSubject: sub.messageSubject,
                      messageContent: sub.messageContent
                    });
                    setActivePage('edit_submission');
                  }}>
                    <IconEdit /> Edit
                  </button>
                  <button className="ca-action-btn ca-delete" onClick={() => deleteSubmission(sub.id, sub.fullName)}>
                    <IconDelete /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan="7" className="ca-empty">No contact submissions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Submission Form
  const renderSubmissionForm = () => (
    <div className="ca-page-full">
      <div className="ca-header">
        <button className="ca-back-btn" onClick={() => { setActivePage('submissions'); resetForm(); }}>
          <IconBack /> Back to Submissions
        </button>
        <h2>{editingSubmission ? 'Edit Contact Submission' : 'Add Contact Submission'}</h2>
      </div>
      
      <div className="ca-form-full">
        <form onSubmit={(e) => { e.preventDefault(); editingSubmission ? updateSubmission() : createSubmission(); }} className="ca-form">
          <div className="ca-form-row">
            <div className="ca-form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
                placeholder="Enter full name"
              />
            </div>
            
            <div className="ca-form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={formData.emailAddress}
                onChange={(e) => setFormData({...formData, emailAddress: e.target.value})}
                required
                placeholder="Enter email address"
              />
            </div>
          </div>
          
          <div className="ca-form-row">
            <div className="ca-form-group">
              <label>Subject *</label>
              <input
                type="text"
                value={formData.messageSubject}
                onChange={(e) => setFormData({...formData, messageSubject: e.target.value})}
                required
                placeholder="Enter subject"
              />
            </div>
          </div>
          
          <div className="ca-form-row">
            <div className="ca-form-group">
              <label>Message *</label>
              <textarea
                value={formData.messageContent}
                onChange={(e) => setFormData({...formData, messageContent: e.target.value})}
                required
                rows="6"
                placeholder="Enter message content..."
              />
            </div>
          </div>
          
          <div className="ca-buttons">
            <button type="button" className="ca-btn ca-btn-secondary" onClick={() => { setActivePage('submissions'); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="ca-btn ca-btn-primary">
              {editingSubmission ? 'Update Submission' : 'Create Submission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading && submissions.length === 0) {
    return (
      <div className="ca-loading">
        <div className="ca-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="contact-admin">
        {toast.show && (
          <div className={`ca-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
          </div>
        )}

        {activePage === 'list' && renderDashboard()}
        {activePage === 'submissions' && renderSubmissionsList()}
        {activePage === 'add_submission' && renderSubmissionForm()}
        {activePage === 'edit_submission' && renderSubmissionForm()}
      </div>
    </Layout>
  );
};

export default ContactAdmin;