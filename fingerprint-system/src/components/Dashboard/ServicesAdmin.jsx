import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './ServicesAdmin.css';
import { API_ENDPOINTS } from '../../config/endpoints.js';

const getAuthToken = () => {
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) return token;

  const sessionStr = localStorage.getItem('session') || sessionStorage.getItem('session');
  if (sessionStr) {
    try {
      const sessionObj = JSON.parse(sessionStr);
      if (sessionObj.accessToken || sessionObj.token || sessionObj.access_token) {
        return sessionObj.accessToken || sessionObj.token || sessionObj.access_token;
      }
    } catch (e) {}
  }

  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      if (userObj.token || userObj.accessToken) {
        return userObj.token || userObj.accessToken;
      }
    } catch (e) {}
  }

  return null;
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

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

const ServicesAdmin = () => {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('list'); // 'list', 'add', 'edit', 'view'
  const [editingService, setEditingService] = useState(null);
  const [viewingService, setViewingService] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    displayOrder: 0
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('session');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('session');
    navigate('/login');
  };

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    fetchServices();
  }, [navigate]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.publicServices);
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching public services:', error);
      showToastMessage('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddPage = () => {
    setEditingService(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      displayOrder: services.length
    });
    setActivePage('add');
  };

  const handleOpenEditPage = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      imageUrl: service.imageUrl || '',
      displayOrder: service.displayOrder || 0
    });
    setActivePage('edit');
  };

  const handleViewService = (service) => {
    setViewingService(service);
    setActivePage('view');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showToastMessage('Title and Description are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(editingService);
      const url = isEdit ? API_ENDPOINTS.publicService(editingService.id) : API_ENDPOINTS.publicServices;
      const method = isEdit ? 'PUT' : 'POST';

      const bodyData = {
        id: isEdit ? editingService.id : crypto.randomUUID(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim() || null,
        displayOrder: parseInt(formData.displayOrder, 10) || 0
      };

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        showToastMessage(isEdit ? 'Service updated successfully!' : 'Service created successfully!');
        setActivePage('list');
        fetchServices();
      } else {
        const errText = await response.text();
        showToastMessage(`Error: ${errText}`, 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToastMessage('An error occurred while saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    setIsDeleting(true);
    try {
      const response = await fetch(API_ENDPOINTS.publicService(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        showToastMessage('Service deleted successfully!');
        fetchServices();
      } else {
        showToastMessage('Failed to delete service', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToastMessage('An error occurred while deleting', 'error');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  // Stats
  const totalServices = services.length;
  const withImages = services.filter(s => s.imageUrl).length;
  const withOrder = services.filter(s => s.displayOrder !== undefined && s.displayOrder !== null).length;

  // ============================================
  // RENDER DASHBOARD LIST PAGE
  // ============================================
  const renderDashboardList = () => (
    <div className="sa-page">
      <div className="sa-dashboard-header">
        <h1>Services Management</h1>
        <p>Manage services displayed on the public website</p>
      </div>
      
      <div className="sa-dashboard-links">
        <div 
          className="sa-dash-link" 
          onClick={() => setActivePage('services')}
        >
          <div className="sa-dash-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
              <circle cx="8.5" cy="8.5" r="2.5"/>
              <path d="M21 15L16 10L5 21"/>
            </svg>
          </div>
          <div className="sa-dash-link-info">
            <h3>Services</h3>
            <p>{totalServices} total services</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER SERVICES LIST PAGE
  // ============================================
  const renderServicesList = () => (
    <div className="sa-page">
      <div className="sa-header">
        <button className="sa-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back
        </button>
        <div className="sa-header-title">
          <h2>Services</h2>
          <button className="sa-add-btn" onClick={handleOpenAddPage}>
            <IconAdd /> Add Service
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="sa-stats">
        <div className="sa-stat-card">
          <span className="sa-stat-number">{totalServices}</span>
          <span className="sa-stat-label">Total Services</span>
        </div>
        <div className="sa-stat-card">
          <span className="sa-stat-number">{withImages}</span>
          <span className="sa-stat-label">With Images</span>
        </div>
        <div className="sa-stat-card">
          <span className="sa-stat-number">{withOrder}</span>
          <span className="sa-stat-label">Ordered</span>
        </div>
      </div>
      
      {loading ? (
        <div className="sa-loading">Loading...</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Image</th>
                <th>Title</th>
                <th>Description</th>
                <th width="160">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan="5" className="sa-empty">No services found</td>
                </tr>
              ) : (
                services.map((serv) => (
                  <tr key={serv.id}>
                    <td className="sa-order-cell">
                      <span className="sa-order-badge">{serv.displayOrder || 0}</span>
                    </td>
                    <td>
                      {serv.imageUrl ? (
                        <img src={serv.imageUrl} alt={serv.title} className="sa-thumb" />
                      ) : (
                        <div className="sa-thumb-placeholder">
                          {serv.title?.charAt(0) || 'S'}
                        </div>
                      )}
                    </td>
                    <td className="sa-title-cell">
                      <strong>{serv.title}</strong>
                    </td>
                    <td className="sa-desc-cell">{serv.description}</td>
                    <td>
                      <div className="sa-action-buttons">
                        <button className="sa-action-btn sa-view" onClick={() => handleViewService(serv)}>
                          <IconView /> View
                        </button>
                        <button className="sa-action-btn sa-edit" onClick={() => handleOpenEditPage(serv)}>
                          <IconEdit /> Edit
                        </button>
                        <button 
                          className="sa-action-btn sa-delete" 
                          onClick={() => handleDelete(serv.id, serv.title)}
                          disabled={isDeleting && deletingId === serv.id}
                        >
                          {isDeleting && deletingId === serv.id ? (
                            <span className="sa-spinner-small"></span>
                          ) : (
                            <>
                              <IconDelete /> Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ============================================
  // RENDER VIEW SERVICE PAGE
  // ============================================
  const renderViewPage = () => (
    <div className="sa-page">
      <div className="sa-header">
        <button className="sa-back-btn" onClick={() => setActivePage('services')}>
          <IconBack /> Back to Services
        </button>
        <div className="sa-header-title">
          <h2>Service Details</h2>
        </div>
      </div>

      {viewingService && (
        <div className="sa-view-container">
          <div className="sa-view-section">
            <div className="sa-view-media">
              {viewingService.imageUrl ? (
                <img src={viewingService.imageUrl} alt={viewingService.title} className="sa-view-image" />
              ) : (
                <div className="sa-view-placeholder">
                  <span>{viewingService.title?.charAt(0) || 'S'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="sa-view-section">
            <div className="sa-view-info-grid">
              <div className="sa-view-info-item">
                <label>Title:</label>
                <span>{viewingService.title}</span>
              </div>
              <div className="sa-view-info-item">
                <label>Display Order:</label>
                <span className="sa-order-badge">{viewingService.displayOrder || 0}</span>
              </div>
              <div className="sa-view-info-item full-width">
                <label>Description:</label>
                <p>{viewingService.description}</p>
              </div>
              {viewingService.imageUrl && (
                <div className="sa-view-info-item full-width">
                  <label>Image URL:</label>
                  <a href={viewingService.imageUrl} target="_blank" rel="noopener noreferrer">
                    {viewingService.imageUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="sa-view-actions">
            <button 
              className="sa-btn sa-btn-primary" 
              onClick={() => handleOpenEditPage(viewingService)}
            >
              <IconEdit /> Edit Service
            </button>
            <button 
              className="sa-btn sa-btn-secondary" 
              onClick={() => setActivePage('services')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================
  // RENDER ADD/EDIT FORM PAGE
  // ============================================
  const renderFormPage = () => (
    <div className="sa-page-full">
      <div className="sa-header">
        <button className="sa-back-btn" onClick={() => {
          setActivePage('services');
        }} disabled={saving}>
          <IconBack /> Back to Services
        </button>
        <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
      </div>
      
      <div className="sa-form-full">
        <form onSubmit={handleSave} className="sa-form">
          <div className="sa-form-row">
            <div className="sa-form-group">
              <label>Service Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Medical Care"
                disabled={saving}
              />
            </div>
          </div>
          
          <div className="sa-form-row">
            <div className="sa-form-group">
              <label>Description *</label>
              <textarea
                required
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation of the service provided..."
                disabled={saving}
              />
            </div>
          </div>

          <div className="sa-form-row">
            <div className="sa-form-group">
              <label>Image URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="/image6.jpg or https://example.com/image.jpg"
                disabled={saving}
              />
              <small>Leave empty for placeholder</small>
            </div>
          </div>

          <div className="sa-form-row">
            <div className="sa-form-group">
              <label>Display Order</label>
              <input
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                disabled={saving}
              />
              <small>Lower numbers appear first</small>
            </div>
          </div>
          
          <div className="sa-buttons">
            <button type="button" className="sa-btn sa-btn-secondary" onClick={() => {
              setActivePage('services');
            }} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="sa-btn sa-btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="sa-spinner"></span>
                  {editingService ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingService ? 'Update Service' : 'Create Service'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="services-admin">
        {/* Toast Notification */}
        {toast.show && (
          <div className={`sa-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
          </div>
        )}

        {activePage === 'list' && renderDashboardList()}
        {activePage === 'services' && renderServicesList()}
        {activePage === 'view' && renderViewPage()}
        {activePage === 'add' && renderFormPage()}
        {activePage === 'edit' && renderFormPage()}
      </div>
    </Layout>
  );
};

export default ServicesAdmin;