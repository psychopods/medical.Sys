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

const ServicesAdmin = () => {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    displayOrder: 0
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  const showToastNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3500);
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
      showToastNotification('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingService(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      displayOrder: services.length
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      imageUrl: service.imageUrl || '',
      displayOrder: service.displayOrder || 0
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showToastNotification('Title and Description are required', 'error');
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
        showToastNotification(isEdit ? 'Service updated successfully!' : 'Service created successfully!');
        setShowModal(false);
        fetchServices();
      } else {
        const errText = await response.text();
        showToastNotification(`Error: ${errText}`, 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToastNotification('An error occurred while saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.publicService(id), {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        showToastNotification('Service deleted successfully!');
        fetchServices();
      } else {
        showToastNotification('Failed to delete service', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToastNotification('An error occurred while deleting', 'error');
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="serv-admin-container">
        {toast.show && (
          <div className={`serv-admin-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>✕</button>
          </div>
        )}

        <div className="serv-admin-header">
          <div>
            <h1>Public Services Management</h1>
            <p>Manage services displayed on the public website for visitors and donors.</p>
          </div>
          <button className="serv-admin-add-btn" onClick={handleOpenAddModal}>
            + Add New Service
          </button>
        </div>

        {loading ? (
          <div className="serv-admin-loading">Loading services...</div>
        ) : (
          <div className="serv-admin-table-wrapper">
            <table className="serv-admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="serv-admin-empty">No public services configured yet. Click "+ Add New Service" to create one.</td>
                  </tr>
                ) : (
                  services.map((serv) => (
                    <tr key={serv.id}>
                      <td className="serv-admin-order">{serv.displayOrder}</td>
                      <td className="serv-admin-img-cell">
                        {serv.imageUrl ? (
                          <img src={serv.imageUrl} alt={serv.title} className="serv-admin-thumb" />
                        ) : (
                          <div className="serv-admin-thumb-placeholder">{serv.title.charAt(0)}</div>
                        )}
                      </td>
                      <td className="serv-admin-title">{serv.title}</td>
                      <td className="serv-admin-desc">{serv.description}</td>
                      <td className="serv-admin-actions">
                        <button className="serv-admin-edit-btn" onClick={() => handleOpenEditModal(serv)}>
                          Edit
                        </button>
                        <button className="serv-admin-del-btn" onClick={() => handleDelete(serv.id, serv.title)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="serv-admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="serv-admin-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingService ? 'Edit Public Service' : 'Add Public Service'}</h2>
              <form onSubmit={handleSave}>
                <div className="serv-admin-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Medical Care"
                  />
                </div>

                <div className="serv-admin-form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed explanation of the outreach service provided..."
                  />
                </div>

                <div className="serv-admin-form-group">
                  <label>Image URL / Asset Path</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="e.g. /image6.jpg or https://..."
                  />
                </div>

                <div className="serv-admin-form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  />
                </div>

                <div className="serv-admin-modal-actions">
                  <button type="button" className="serv-admin-cancel-btn" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="serv-admin-save-btn" disabled={saving}>
                    {saving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ServicesAdmin;
