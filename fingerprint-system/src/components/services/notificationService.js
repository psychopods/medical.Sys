// services/notificationService.js
const API_BASE_URL = 'http://localhost:9865';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Fetch all notifications for current user (for notification bell)
export const fetchNotifications = async (includeRead = false) => {
  try {
    const url = includeRead 
      ? `${API_BASE_URL}/api/notifications?includeRead=true`
      : `${API_BASE_URL}/api/notifications`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('fetchNotifications response:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }
      if (data.notifications && Array.isArray(data.notifications)) {
        return data.notifications;
      }
      if (data.success && data.notifications) {
        return data.notifications;
      }
      return [];
    }
    console.error('Fetch notifications failed with status:', response.status);
    return [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Fetch all notifications (admin view) - GET /api/notifications/all
export const fetchAllNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/all`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('fetchAllNotifications response:', data);
      
      // Handle different response formats
      if (data.success && data.notifications) {
        return data.notifications;
      }
      if (data.notifications && Array.isArray(data.notifications)) {
        return data.notifications;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    }
    console.error('Fetch all notifications failed with status:', response.status);
    return [];
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return [];
  }
};

// Fetch a single notification by ID - GET /api/notifications/:id
export const fetchNotificationById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('fetchNotificationById response:', data);
      
      if (data.success && data.notification) {
        return data.notification;
      }
      if (data.notification) {
        return data.notification;
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching notification:', error);
    return null;
  }
};

// Create a new notification - POST /api/notifications
export const createNotification = async (notificationData) => {
  try {
    const requestBody = {
      id: crypto.randomUUID(),
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      targetType: notificationData.targetType,
      targetRoleId: notificationData.targetRoleId || null,
      targetUserId: notificationData.targetUserId || null,
      expiresAt: notificationData.expiresAt || null
    };
    
    console.log('Creating notification with body:', requestBody);
    
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('Create notification response:', data);
    
    if (response.ok) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Update a notification - PUT /api/notifications/:id
export const updateNotification = async (id, notificationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        targetType: notificationData.targetType,
        targetRoleId: notificationData.targetRoleId || null,
        targetUserId: notificationData.targetUserId || null,
        expiresAt: notificationData.expiresAt || null
      })
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error updating notification:', error);
    return null;
  }
};

// Delete a notification - DELETE /api/notifications/:id
export const deleteNotification = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Mark notification as read - PUT /api/notifications/:id/read
export const markNotificationAsRead = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Mark as read response:', data);
      return true;
    }
    console.error('Mark as read failed with status:', response.status);
    return false;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Fetch all read receipts (admin) - GET /api/notifications/reads
export const fetchReadReceipts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/reads`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('fetchReadReceipts response:', data);
      
      if (data.success && data.reads) {
        return data.reads;
      }
      if (data.reads && Array.isArray(data.reads)) {
        return data.reads;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching read receipts:', error);
    return [];
  }
};

// Manually create read receipt - POST /api/notifications/reads
export const createReadReceipt = async (notificationId, staffUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/reads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        notificationId: notificationId,
        staffUserId: staffUserId
      })
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error creating read receipt:', error);
    return null;
  }
};

// Delete read receipt - DELETE /api/notifications/reads/:notificationId/:staffUserId
export const deleteReadReceipt = async (notificationId, staffUserId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/reads/${notificationId}/${staffUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting read receipt:', error);
    return false;
  }
};