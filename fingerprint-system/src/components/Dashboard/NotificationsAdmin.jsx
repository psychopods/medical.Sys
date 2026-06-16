// components/Dashboard/NotificationsAdmin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { 
  fetchAllNotifications, 
  fetchNotificationById,
  createNotification, 
  updateNotification, 
  deleteNotification,
  fetchReadReceipts
} from '../services/notificationService';
import './NotificationsAdmin.css';

import { API_ENDPOINTS, API_BASE_URL } from '../../config/endpoints.js';

const NotificationsAdmin = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readReceipts, setReadReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('list');
  const [editingNotification, setEditingNotification] = useState(null);
  const [viewingNotification, setViewingNotification] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Data for dropdowns
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    type: 'ANNOUNCEMENT',
    title: '',
    message: '',
    targetType: 'ALL',
    targetUserId: '',
    expiresAt: ''
  });

  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Fetch users for dropdown - using /api/auth/users endpoint
  const fetchUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchAllNotifications();
      setNotifications(data);
      const receipts = await fetchReadReceipts();
      setReadReceipts(receipts);
    } catch (error) {
      console.error('Error loading notifications:', error);
      showToastMessage('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    loadNotifications();
    fetchUsers();
  }, [navigate]);

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      showToastMessage('Title and message are required', 'error');
      return;
    }

    const notificationData = {
      type: formData.type,
      title: formData.title,
      message: formData.message,
      targetType: formData.targetType,
      targetUserId: formData.targetType === 'USER' ? formData.targetUserId : null,
      expiresAt: formData.expiresAt || null
    };

    const result = await createNotification(notificationData);
    if (result) {
      showToastMessage('Notification created successfully');
      loadNotifications();
      setActivePage('list');
      resetForm();
    } else {
      showToastMessage('Failed to create notification', 'error');
    }
  };

  const handleUpdate = async () => {
    const notificationData = {
      type: formData.type,
      title: formData.title,
      message: formData.message,
      targetType: formData.targetType,
      targetUserId: formData.targetType === 'USER' ? formData.targetUserId : null,
      expiresAt: formData.expiresAt || null
    };

    const result = await updateNotification(editingNotification.id, notificationData);
    if (result) {
      showToastMessage('Notification updated successfully');
      loadNotifications();
      setActivePage('list');
      setEditingNotification(null);
      resetForm();
    } else {
      showToastMessage('Failed to update notification', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete notification "${title}"?`)) {
      const success = await deleteNotification(id);
      if (success) {
        showToastMessage('Notification deleted successfully');
        loadNotifications();
      } else {
        showToastMessage('Failed to delete notification', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'ANNOUNCEMENT',
      title: '',
      message: '',
      targetType: 'ALL',
      targetUserId: '',
      expiresAt: ''
    });
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setFormData({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      targetType: notification.targetType,
      targetUserId: notification.targetUserId || '',
      expiresAt: notification.expiresAt ? notification.expiresAt.split('T')[0] : ''
    });
    setActivePage('edit');
  };

  const handleView = async (id) => {
    const notification = await fetchNotificationById(id);
    setViewingNotification(notification);
    setActivePage('view');
  };

  const getReadCount = (notificationId) => {
    return readReceipts.filter(r => r.notificationId === notificationId).length;
  };

  // Get users who read the notification
  const getReaders = (notificationId) => {
    const readers = readReceipts.filter(r => r.notificationId === notificationId);
    return readers.map(reader => {
      const userFound = users.find(u => u.id === reader.staffUserId);
      const userName = userFound?.firstName && userFound?.lastName 
        ? `${userFound.firstName} ${userFound.lastName}` 
        : userFound?.username || reader.staffUserId;
      return {
        name: userName,
        readAt: reader.readAt
      };
    });
  };

  // Get creator name
  const getCreatorName = (createdByStaffId) => {
    if (!createdByStaffId) return 'Unknown';
    const userFound = users.find(u => u.id === createdByStaffId);
    if (userFound?.firstName && userFound?.lastName) {
      return `${userFound.firstName} ${userFound.lastName}`;
    }
    if (userFound?.username) return userFound.username;
    return createdByStaffId;
  };

  const getTypeBadgeClass = (type) => {
    switch(type) {
      case 'SYSTEM': return 'badge-system';
      case 'ANNOUNCEMENT': return 'badge-announcement';
      case 'EVENT': return 'badge-event';
      default: return '';
    }
  };

  const getTargetTypeLabel = (targetType, targetUserId) => {
    switch(targetType) {
      case 'ALL': return 'All Users';
      case 'USER': {
        const userFound = users.find(u => u.id === targetUserId);
        const userName = userFound?.firstName && userFound?.lastName 
          ? `${userFound.firstName} ${userFound.lastName}` 
          : userFound?.username || targetUserId;
        return `User: ${userName}`;
      }
      default: return targetType;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  // Render Notification List with S/N
  const renderList = () => (
    <div className="na-dashboard-content">
      <div className="na-dashboard-header">
        <div className="na-header-title">
          <h1>Notifications Management</h1>
          <button className="na-add-btn" onClick={() => { resetForm(); setActivePage('add'); }}>
            + Create Notification
          </button>
        </div>
        <p className="na-subtitle">Manage system notifications, announcements, and events</p>
      </div>

      {loading ? (
        <div className="na-loading">
          <div className="na-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      ) : (
        <div className="na-table-wrapper">
          <table className="na-data-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th>Type</th>
                <th>Title</th>
                <th>Message</th>
                <th>Target</th>
                <th>Read By</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="na-empty">No notifications found</td>
                </tr>
              ) : (
                notifications.map((notif, index) => (
                  <tr key={notif.id}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td><span className={`na-type-badge ${getTypeBadgeClass(notif.type)}`}>{notif.type}</span></td>
                    <td><strong>{notif.title}</strong></td>
                    <td className="na-message-cell">{notif.message}</td>
                    <td>{getTargetTypeLabel(notif.targetType, notif.targetUserId)}</td>
                    <td>{getReadCount(notif.id)} readers</td>
                    <td>{notif.expiresAt ? new Date(notif.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div className="na-action-buttons">
                        <button className="na-action-btn na-view" onClick={() => handleView(notif.id)} title="View Details">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button className="na-action-btn na-edit" onClick={() => handleEdit(notif)} title="Edit">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3L21 7L7 21H3V17L17 3Z" />
                          </svg>
                        </button>
                        <button className="na-action-btn na-delete" onClick={() => handleDelete(notif.id, notif.title)} title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7H20" strokeWidth="2" />
                            <path d="M10 11V17" strokeWidth="2" />
                            <path d="M14 11V17" strokeWidth="2" />
                            <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2" />
                            <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2" />
                          </svg>
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

  // Render Notification Form
  const renderForm = () => (
    <div className="na-dashboard-content">
      <div className="na-dashboard-header">
        <button className="na-back-btn" onClick={() => { setActivePage('list'); resetForm(); setEditingNotification(null); }}>
          ← Back to Notifications
        </button>
        <h1>{editingNotification ? 'Edit Notification' : 'Create Notification'}</h1>
      </div>

      <div className="na-form-container">
        <div className="na-form-group">
          <label>Type *</label>
          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
            <option value="SYSTEM">System</option>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="EVENT">Event</option>
          </select>
        </div>

        <div className="na-form-group">
          <label>Title *</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Enter notification title" />
        </div>

        <div className="na-form-group">
          <label>Message *</label>
          <textarea rows="4" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Enter notification message" />
        </div>

        <div className="na-form-group">
          <label>Target Type *</label>
          <select value={formData.targetType} onChange={(e) => setFormData({...formData, targetType: e.target.value, targetUserId: ''})}>
            <option value="ALL">All Users</option>
            <option value="USER">Specific User</option>
          </select>
        </div>

        {formData.targetType === 'USER' && (
          <div className="na-form-group">
            <label>User *</label>
            <select 
              value={formData.targetUserId} 
              onChange={(e) => setFormData({...formData, targetUserId: e.target.value})}
              required
            >
              <option value="">Select a user</option>
              {users.map(userItem => (
                <option key={userItem.id} value={userItem.id}>
                  {userItem.firstName} {userItem.lastName} ({userItem.username})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="na-form-group">
          <label>Expiration Date (Optional)</label>
          <input type="date" value={formData.expiresAt} onChange={(e) => setFormData({...formData, expiresAt: e.target.value})} />
        </div>

        <div className="na-form-actions">
          <button className="na-btn-secondary" onClick={() => { setActivePage('list'); resetForm(); setEditingNotification(null); }}>Cancel</button>
          <button className="na-btn-primary" onClick={editingNotification ? handleUpdate : handleCreate}>
            {editingNotification ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Notification View Page with Creator and Readers List
  const renderView = () => {
    const readers = getReaders(viewingNotification?.id);
    const creatorName = getCreatorName(viewingNotification?.createdByStaffId);
    
    return (
      <div className="na-dashboard-content">
        <div className="na-dashboard-header">
          <button className="na-back-btn" onClick={() => setActivePage('list')}>← Back to Notifications</button>
          <h1>Notification Details</h1>
        </div>

        {viewingNotification && (
          <div className="na-view-container">
            <div className="na-view-section">
              <div className="na-view-info-grid">
                <div className="na-view-info-item">
                  <label>Type:</label>
                  <span className={`na-type-badge ${getTypeBadgeClass(viewingNotification.type)}`}>{viewingNotification.type}</span>
                </div>
                <div className="na-view-info-item">
                  <label>Title:</label>
                  <span>{viewingNotification.title}</span>
                </div>
                <div className="na-view-info-item">
                  <label>Target:</label>
                  <span>{getTargetTypeLabel(viewingNotification.targetType, viewingNotification.targetUserId)}</span>
                </div>
                <div className="na-view-info-item">
                  <label>Created By:</label>
                  <span><strong>{creatorName}</strong></span>
                </div>
                <div className="na-view-info-item">
                  <label>Total Read By:</label>
                  <span>{getReadCount(viewingNotification.id)} users</span>
                </div>
                <div className="na-view-info-item full-width">
                  <label>Message:</label>
                  <p>{viewingNotification.message}</p>
                </div>
                <div className="na-view-info-item">
                  <label>Created:</label>
                  <span>{new Date(viewingNotification.createdAt).toLocaleString()}</span>
                </div>
                <div className="na-view-info-item">
                  <label>Last Modified:</label>
                  <span>{viewingNotification.lastModifiedAt ? new Date(viewingNotification.lastModifiedAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="na-view-info-item">
                  <label>Expires:</label>
                  <span>{viewingNotification.expiresAt ? new Date(viewingNotification.expiresAt).toLocaleString() : 'Never'}</span>
                </div>
                <div className="na-view-info-item">
                  <label>Version:</label>
                  <span>{viewingNotification.version || 1}</span>
                </div>
              </div>
            </div>

            {/* Readers Section */}
            <div className="na-view-section">
              <h3>Readers ({readers.length})</h3>
              {readers.length === 0 ? (
                <p className="na-no-readers">No one has read this notification yet.</p>
              ) : (
                <div className="na-readers-list">
                  <table className="na-readers-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>User Name</th>
                        <th>Read At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readers.map((reader, idx) => (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td>{reader.name}</td>
                          <td>{new Date(reader.readAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="na-view-actions">
              <button className="na-btn-secondary" onClick={() => setActivePage('list')}>Close</button>
              <button className="na-btn-primary" onClick={() => handleEdit(viewingNotification)}>Edit Notification</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ToastNotification = () => {
    if (!toast.show) return null;
    return (
      <div className={`na-toast-notification ${toast.type}`}>
        <div className="na-toast-content">
          {toast.type === 'success' && <span>✓</span>}
          {toast.type === 'error' && <span>✗</span>}
          <span>{toast.message}</span>
        </div>
        <button className="na-toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
      </div>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="na-loading">
          <div className="na-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <ToastNotification />
      <div className="notifications-admin-wrapper">
        {activePage === 'list' && renderList()}
        {activePage === 'add' && renderForm()}
        {activePage === 'edit' && renderForm()}
        {activePage === 'view' && renderView()}
      </div>
    </Layout>
  );
};

export default NotificationsAdmin;