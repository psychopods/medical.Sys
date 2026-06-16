// services/notificationService.js
import { API_ENDPOINTS } from '../../config/endpoints.js';
import { executeQuery, executeRun, saveDB } from '../../services/db.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const getActiveUser = () => {
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

// Fetch all notifications for current user (for notification bell)
export const fetchNotifications = async (includeRead = false) => {
  const isOnline = navigator.onLine;
  const activeUser = getActiveUser();
  const userId = activeUser?.id || activeUser?.user_id || '';
  const roleId = activeUser?.role_id || '';

  if (isOnline) {
    try {
      const url = includeRead 
        ? `${API_ENDPOINTS.notifications}?includeRead=true`
        : API_ENDPOINTS.notifications;
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        let notificationsArray = [];
        if (Array.isArray(data)) {
          notificationsArray = data;
        } else if (data.notifications && Array.isArray(data.notifications)) {
          notificationsArray = data.notifications;
        } else if (data.success && data.notifications) {
          notificationsArray = data.notifications;
        }

        // Cache in SQLite
        for (const notif of notificationsArray) {
          if (notif && notif.id) {
            await executeRun(
              `INSERT OR REPLACE INTO notifications 
              (id, type, title, message, target_type, target_role_id, target_user_id, created_by_staff_id, expires_at, version, is_dirty, sync_status, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced', ?)`,
              [
                notif.id,
                notif.type,
                notif.title,
                notif.message,
                notif.targetType || notif.target_type || 'ALL',
                notif.targetRoleId || notif.target_role_id || null,
                notif.targetUserId || notif.target_user_id || null,
                notif.createdByStaffId || notif.created_by_staff_id || null,
                notif.expiresAt || notif.expires_at || null,
                notif.version || 1,
                notif.createdAt || notif.created_at || new Date().toISOString()
              ]
            );

            // If the notification came back as read, cache that read receipt
            if (notif.isRead || notif.is_read) {
              await executeRun(
                `INSERT OR REPLACE INTO notification_reads (notification_id, staff_user_id, read_at, is_dirty, sync_status) 
                 VALUES (?, ?, ?, 0, 'synced')`,
                [notif.id, userId, new Date().toISOString()]
              );
            }
          }
        }
        await saveDB();
        return notificationsArray;
      }
    } catch (error) {
      console.warn('Error fetching notifications online, using SQLite fallback:', error);
    }
  }

  // SQLite Fallback
  try {
    let sql = `
      SELECT n.*, nr.read_at 
      FROM notifications n 
      LEFT JOIN notification_reads nr 
        ON n.id = nr.notification_id AND nr.staff_user_id = ?
      WHERE (n.expires_at IS NULL OR datetime(n.expires_at) > datetime('now'))
        AND (n.target_type = 'ALL' 
             OR (n.target_type = 'USER' AND n.target_user_id = ?) 
             OR (n.target_type = 'ROLE' AND n.target_role_id = ?))
    `;
    const params = [userId, userId, roleId];

    if (!includeRead) {
      sql += ' AND nr.read_at IS NULL';
    }
    sql += ' ORDER BY n.created_at DESC';

    const rows = await executeQuery(sql, params);
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      targetType: row.target_type,
      targetRoleId: row.target_role_id,
      targetUserId: row.target_user_id,
      createdByStaffId: row.created_by_staff_id,
      expiresAt: row.expires_at,
      version: row.version,
      syncStatus: row.sync_status,
      createdAt: row.created_at,
      isRead: !!row.read_at
    }));
  } catch (err) {
    console.error('Error fetching notifications from SQLite:', err);
    return [];
  }
};

// Fetch all notifications (admin view) - GET /api/notifications/all
export const fetchAllNotifications = async () => {
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(`${API_ENDPOINTS.notifications}/all`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        let list = [];
        if (data.success && data.notifications) {
          list = data.notifications;
        } else if (data.notifications && Array.isArray(data.notifications)) {
          list = data.notifications;
        } else if (Array.isArray(data)) {
          list = data;
        }

        // Cache all in SQLite
        for (const notif of list) {
          if (notif && notif.id) {
            await executeRun(
              `INSERT OR REPLACE INTO notifications 
              (id, type, title, message, target_type, target_role_id, target_user_id, created_by_staff_id, expires_at, version, is_dirty, sync_status, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced', ?)`,
              [
                notif.id,
                notif.type,
                notif.title,
                notif.message,
                notif.targetType || notif.target_type || 'ALL',
                notif.targetRoleId || notif.target_role_id || null,
                notif.targetUserId || notif.target_user_id || null,
                notif.createdByStaffId || notif.created_by_staff_id || null,
                notif.expiresAt || notif.expires_at || null,
                notif.version || 1,
                notif.createdAt || notif.created_at || new Date().toISOString()
              ]
            );
          }
        }
        await saveDB();
        return list;
      }
    } catch (error) {
      console.warn('Error fetching all notifications online, using SQLite:', error);
    }
  }

  // SQLite fallback
  try {
    const rows = await executeQuery('SELECT * FROM notifications ORDER BY created_at DESC');
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      targetType: row.target_type,
      targetRoleId: row.target_role_id,
      targetUserId: row.target_user_id,
      createdByStaffId: row.created_by_staff_id,
      expiresAt: row.expires_at,
      version: row.version,
      syncStatus: row.sync_status,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error('Error listing all notifications from SQLite:', err);
    return [];
  }
};

// Fetch a single notification by ID - GET /api/notifications/:id
export const fetchNotificationById = async (id) => {
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(`${API_ENDPOINTS.notifications}/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const notif = data.notification || data;
        return notif;
      }
    } catch (error) {
      console.warn('Error fetching notification online, fallback to SQLite:', error);
    }
  }

  // SQLite fallback
  try {
    const rows = await executeQuery('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      targetType: row.target_type,
      targetRoleId: row.target_role_id,
      targetUserId: row.target_user_id,
      createdByStaffId: row.created_by_staff_id,
      expiresAt: row.expires_at,
      version: row.version,
      syncStatus: row.sync_status,
      createdAt: row.created_at
    };
  } catch (err) {
    console.error('Error fetching notification by ID:', err);
    return null;
  }
};

// Create a new notification - POST /api/notifications
export const createNotification = async (notificationData) => {
  const isOnline = navigator.onLine;
  const activeUser = getActiveUser();
  const creatorId = activeUser?.id || '';
  const notifId = notificationData.id || crypto.randomUUID();
  const requestBody = {
    id: notifId,
    type: notificationData.type,
    title: notificationData.title,
    message: notificationData.message,
    targetType: notificationData.targetType,
    targetRoleId: notificationData.targetRoleId || null,
    targetUserId: notificationData.targetUserId || null,
    expiresAt: notificationData.expiresAt || null,
    createdByStaffId: creatorId
  };

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.notifications, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        await executeRun(
          `INSERT OR REPLACE INTO notifications 
          (id, type, title, message, target_type, target_role_id, target_user_id, created_by_staff_id, expires_at, version, is_dirty, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'synced')`,
          [notifId, requestBody.type, requestBody.title, requestBody.message, requestBody.targetType, requestBody.targetRoleId, requestBody.targetUserId, creatorId, requestBody.expiresAt]
        );
        await saveDB();
        return data;
      }
    } catch (error) {
      console.warn('Error creating notification online, caching locally:', error);
    }
  }

  // Caching offline
  try {
    await executeRun(
      `INSERT OR REPLACE INTO notifications 
      (id, type, title, message, target_type, target_role_id, target_user_id, created_by_staff_id, expires_at, version, is_dirty, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
      [notifId, requestBody.type, requestBody.title, requestBody.message, requestBody.targetType, requestBody.targetRoleId, requestBody.targetUserId, creatorId, requestBody.expiresAt]
    );
    await saveDB();
    return { success: true, message: 'Notification queued offline.' };
  } catch (err) {
    console.error('Error saving notification offline in SQLite:', err);
    return null;
  }
};

// Update a notification - PUT /api/notifications/:id
export const updateNotification = async (id, notificationData) => {
  const isOnline = navigator.onLine;
  const payload = {
    type: notificationData.type,
    title: notificationData.title,
    message: notificationData.message,
    targetType: notificationData.targetType,
    targetRoleId: notificationData.targetRoleId || null,
    targetUserId: notificationData.targetUserId || null,
    expiresAt: notificationData.expiresAt || null
  };

  if (isOnline) {
    try {
      const response = await fetch(`${API_ENDPOINTS.notifications}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        await executeRun(
          `UPDATE notifications SET 
            type = ?, title = ?, message = ?, target_type = ?, target_role_id = ?, target_user_id = ?, expires_at = ?, is_dirty = 0, sync_status = 'synced'
           WHERE id = ?`,
          [payload.type, payload.title, payload.message, payload.targetType, payload.targetRoleId, payload.targetUserId, payload.expiresAt, id]
        );
        await saveDB();
        return data;
      }
    } catch (error) {
      console.warn('Error updating notification online, caching locally:', error);
    }
  }

  // Caching offline
  try {
    await executeRun(
      `UPDATE notifications SET 
        type = ?, title = ?, message = ?, target_type = ?, target_role_id = ?, target_user_id = ?, expires_at = ?, is_dirty = 1, sync_status = 'local_updated'
       WHERE id = ?`,
      [payload.type, payload.title, payload.message, payload.targetType, payload.targetRoleId, payload.targetUserId, payload.expiresAt, id]
    );
    await saveDB();
    return { success: true, message: 'Notification update queued offline.' };
  } catch (err) {
    console.error('Error updating notification offline in SQLite:', err);
    return null;
  }
};

// Delete a notification - DELETE /api/notifications/:id
export const deleteNotification = async (id) => {
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(`${API_ENDPOINTS.notifications}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await executeRun('DELETE FROM notifications WHERE id = ?', [id]);
        await executeRun('DELETE FROM notification_reads WHERE notification_id = ?', [id]);
        await saveDB();
        return true;
      }
    } catch (error) {
      console.error('Error deleting notification online:', error);
    }
  } else {
    // Offline delete
    try {
      await executeRun('DELETE FROM notifications WHERE id = ?', [id]);
      await executeRun('DELETE FROM notification_reads WHERE notification_id = ?', [id]);
      await saveDB();
      return true;
    } catch (err) {
      console.error('Error deleting notification offline:', err);
    }
  }
  return false;
};

// Mark notification as read - PUT /api/notifications/:id/read
export const markNotificationAsRead = async (id) => {
  const isOnline = navigator.onLine;
  const activeUser = getActiveUser();
  const userId = activeUser?.id || '';

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.notificationRead(id), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        await executeRun(
          `INSERT OR REPLACE INTO notification_reads (notification_id, staff_user_id, read_at, is_dirty, sync_status) 
           VALUES (?, ?, ?, 0, 'synced')`,
          [id, userId, new Date().toISOString()]
        );
        await saveDB();
        return true;
      }
    } catch (error) {
      console.warn('Error marking notification as read online, caching locally:', error);
    }
  }

  // Caching offline
  try {
    await executeRun(
      `INSERT OR REPLACE INTO notification_reads (notification_id, staff_user_id, read_at, is_dirty, sync_status) 
       VALUES (?, ?, ?, 1, 'local_created')`,
      [id, userId, new Date().toISOString()]
    );
    await saveDB();
    return true;
  } catch (err) {
    console.error('Error marking notification read offline in SQLite:', err);
    return false;
  }
};

// Fetch all read receipts (admin) - GET /api/notifications/reads
export const fetchReadReceipts = async () => {
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(`${API_ENDPOINTS.notifications}/reads`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        let list = [];
        if (data.success && data.reads) {
          list = data.reads;
        } else if (data.reads && Array.isArray(data.reads)) {
          list = data.reads;
        } else if (Array.isArray(data)) {
          list = data;
        }

        // Cache in SQLite
        for (const receipt of list) {
          if (receipt && receipt.notificationId && receipt.staffUserId) {
            await executeRun(
              `INSERT OR REPLACE INTO notification_reads (notification_id, staff_user_id, read_at, is_dirty, sync_status) 
               VALUES (?, ?, ?, 0, 'synced')`,
              [receipt.notificationId, receipt.staffUserId, receipt.readAt || new Date().toISOString()]
            );
          }
        }
        await saveDB();
        return list;
      }
    } catch (error) {
      console.warn('Error fetching read receipts online, using SQLite:', error);
    }
  }

  // SQLite fallback
  try {
    const rows = await executeQuery('SELECT * FROM notification_reads');
    return rows.map(row => ({
      notificationId: row.notification_id,
      staffUserId: row.staff_user_id,
      readAt: row.read_at
    }));
  } catch (err) {
    console.error('Error fetching read receipts from SQLite:', err);
    return [];
  }
};

// Manually create read receipt - POST /api/notifications/reads
export const createReadReceipt = async (notificationId, staffUserId) => {
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(`${API_ENDPOINTS.notifications}/reads`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notificationId, staffUserId })
      });
      
      if (response.ok) {
        const data = await response.json();
        await executeRun(
          `INSERT OR REPLACE INTO notification_reads (notification_id, staff_user_id, read_at, is_dirty, sync_status) 
           VALUES (?, ?, ?, 0, 'synced')`,
          [notificationId, staffUserId, new Date().toISOString()]
        );
        await saveDB();
        return data;
      }
    } catch (error) {
      console.warn('Error creating read receipt online, caching locally:', error);
    }
  }

  // Caching offline
  try {
    await executeRun(
      `INSERT OR REPLACE INTO notification_reads (notification_id, staff_user_id, read_at, is_dirty, sync_status) 
       VALUES (?, ?, ?, 1, 'local_created')`,
      [notificationId, staffUserId, new Date().toISOString()]
    );
    await saveDB();
    return { success: true };
  } catch (err) {
    console.error('Error creating read receipt offline in SQLite:', err);
    return null;
  }
};

// Delete read receipt - DELETE /api/notifications/reads/:notificationId/:staffUserId
export const deleteReadReceipt = async (notificationId, staffUserId) => {
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(`${API_ENDPOINTS.notifications}/reads/${notificationId}/${staffUserId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await executeRun('DELETE FROM notification_reads WHERE notification_id = ? AND staff_user_id = ?', [notificationId, staffUserId]);
        await saveDB();
        return true;
      }
    } catch (error) {
      console.error('Error deleting read receipt online:', error);
    }
  } else {
    // Offline delete
    try {
      await executeRun('DELETE FROM notification_reads WHERE notification_id = ? AND staff_user_id = ?', [notificationId, staffUserId]);
      await saveDB();
      return true;
    } catch (err) {
      console.error('Error deleting read receipt offline:', err);
    }
  }
  return false;
};