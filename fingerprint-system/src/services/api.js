import { executeRun, saveDB } from './db.js';
import bcrypt from 'bcryptjs';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to get authorization headers
export function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/* ==========================================
   1. AUTHENTICATION & LOGIN
   ========================================== */

export async function login(usernameOrEmail, password) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      console.log('API: Attempting online login...');
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('API: Online login successful.');
        const user = data.user;
        const session = data.session;

        // Cache user data for offline
        const clientHash = bcrypt.hashSync(password, 10);
        await executeRun(
          `INSERT OR REPLACE INTO staff_users 
          (id, username, email, password_hash, role_id, first_name, last_name, phone_number, version, is_dirty, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
          [user.id, user.username, user.email, clientHash, user.role_id, user.first_name, user.last_name, user.phone_number || '', user.version || 1]
        );

        return data;
      } else {
        throw new Error(data.message || 'Login failed.');
      }
    } catch (onlineError) {
      console.warn('API: Online login failed, attempting offline fallback...', onlineError);
    }
  }

  // Offline Fallback Auth
  console.log('API: Running offline authentication...');
  const users = await executeQuery(
    `SELECT * FROM staff_users WHERE email = ? OR username = ? LIMIT 1`,
    [usernameOrEmail, usernameOrEmail]
  );

  if (users.length === 0) {
    throw new Error('User not found. Please connect to the internet for initial login.');
  }

  const cachedUser = users[0];
  const passwordMatch = bcrypt.compareSync(password, cachedUser.password_hash);

  if (!passwordMatch) {
    throw new Error('Invalid credentials.');
  }

  const mappedRole = cachedUser.role_id === '22222222-2222-4222-8222-222222222221' ? 'superuser' : 'nurse';

  return {
    success: true,
    user: {
      id: cachedUser.id,
      user_id: cachedUser.id,
      username: cachedUser.username,
      email: cachedUser.email,
      role_id: cachedUser.role_id,
      first_name: cachedUser.first_name,
      last_name: cachedUser.last_name,
      phone_number: cachedUser.phone_number,
      role: mappedRole
    }
  };
}

/* ==========================================
   2. LOCATIONS API (REST + Cache)
   ========================================== */

export async function getLocations() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/locations`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      const locations = Array.isArray(data) ? data : (data.locations || []);
      
      // Cache locations locally
      for (const loc of locations) {
        await executeRun(
          `INSERT OR REPLACE INTO child_locations (id, name, description, version, is_dirty, sync_status) 
           VALUES (?, ?, ?, ?, 0, 'synced')`,
          [loc.id, loc.name, loc.description || '', loc.version || 1]
        );
      }
      
      return locations;
    }
    return [];
  } catch (error) {
    console.warn('API: Failed to fetch locations online, using cache.', error);
    // Fallback to cached locations
    const rows = await executeQuery('SELECT * FROM child_locations ORDER BY name ASC');
    return rows;
  }
}

/* ==========================================
   3. CHILDREN API (REST)
   ========================================== */

export async function getChildren() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/children`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      const children = data.children || data;
      return children;
    }
    return [];
  } catch (error) {
    console.error('API: Error fetching children:', error);
    return [];
  }
}

export async function getChildById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/children/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.child || data;
    }
    return null;
  } catch (error) {
    console.error('API: Error fetching child:', error);
    return null;
  }
}

export async function registerChild(childData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/children`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        customSerialId: childData.customSerialId,
        fullName: childData.fullName,
        gender: childData.gender,
        estimatedBirthYear: parseInt(childData.estimatedBirthYear),
        primaryLocationId: childData.primaryLocationId,
        image1: childData.image1 || null,
        image2: childData.image2 || null,
        image3: childData.image3 || null
      })
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('API: Error registering child:', error);
    // Queue for offline sync
    await queueOfflineRegistration(childData);
    throw error;
  }
}

async function queueOfflineRegistration(childData) {
  const offlineData = JSON.parse(localStorage.getItem('offline_registrations') || '[]');
  offlineData.push(childData);
  localStorage.setItem('offline_registrations', JSON.stringify(offlineData));
}

/* ==========================================
   4. BIOMETRICS API (REST)
   ========================================== */

export async function getBiometricsForChild(childId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/biometrics/child/${childId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      const fingerprints = Array.isArray(data) ? data : (data.fingerprints || [data]);
      return fingerprints;
    }
    return [];
  } catch (error) {
    console.error('API: Error fetching biometrics:', error);
    return [];
  }
}

export async function enrollBiometric(bioData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/biometrics/enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: crypto.randomUUID(),
        childId: bioData.childId,
        fingerIndex: bioData.fingerIndex || 1,
        templateBase64: bioData.templateBase64,
        qualityScore: bioData.qualityScore || 80,
        capturedAt: new Date().toISOString(),
        matcherVersion: "1.0"
      })
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('API: Error enrolling biometric:', error);
    return null;
  }
}

/* ==========================================
   5. DASHBOARD STATS API (REST)
   ========================================== */

export async function getDashboardStats() {
  try {
    const [childrenRes, onlineRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/children`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE_URL}/api/auth/online-count`, { headers: getAuthHeaders() })
    ]);
    
    let totalChildren = 0;
    let todayRegistrations = 0;
    
    if (childrenRes.ok) {
      const data = await childrenRes.json();
      const children = data.children || data;
      totalChildren = children.length;
      
      const today = new Date().toISOString().split('T')[0];
      todayRegistrations = children.filter(child => {
        const childDate = child.createdAt?.split('T')[0];
        return childDate === today;
      }).length;
    }
    
    let onlineUsers = 0;
    if (onlineRes.ok) {
      const data = await onlineRes.json();
      onlineUsers = data.count || data.activeOnlineCount || 0;
    }
    
    return {
      totalChildren,
      todayRegistrations,
      onlineUsers
    };
  } catch (error) {
    console.error('API: Error fetching dashboard stats:', error);
    return {
      totalChildren: 0,
      todayRegistrations: 0,
      onlineUsers: 0
    };
  }
}

export async function getLocationStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/children`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      const children = data.children || data;
      const locations = await getLocations();
      
      const locationCount = {};
      children.forEach(child => {
        const locationId = child.primaryLocationId;
        if (locationId) {
          locationCount[locationId] = (locationCount[locationId] || 0) + 1;
        }
      });
      
      const stats = Object.entries(locationCount).map(([locationId, count]) => {
        const location = locations.find(l => l.id === locationId);
        return {
          location: location?.name || locationId,
          count: count,
          percentage: (count / children.length) * 100
        };
      }).sort((a, b) => b.count - a.count);
      
      return stats;
    }
    return [];
  } catch (error) {
    console.error('API: Error fetching location stats:', error);
    return [];
  }
}

export async function getMonthlyRegistrations() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/children`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      const children = data.children || data;
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyCount = {};
      
      children.forEach(child => {
        if (child.createdAt) {
          const date = new Date(child.createdAt);
          const month = months[date.getMonth()];
          monthlyCount[month] = (monthlyCount[month] || 0) + 1;
        }
      });
      
      return months.map(month => ({
        month: month,
        count: monthlyCount[month] || 0
      }));
    }
    return [];
  } catch (error) {
    console.error('API: Error fetching monthly registrations:', error);
    return [];
  }
}

export async function getRecentActivities(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/children`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      const children = data.children || data;
      
      return children
        .filter(child => child.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .map(child => {
          const date = new Date(child.createdAt);
          return {
            id: child.id,
            childName: child.fullName,
            activity: 'New Registration',
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'completed'
          };
        });
    }
    return [];
  } catch (error) {
    console.error('API: Error fetching recent activities:', error);
    return [];
  }
}

/* ==========================================
   6. SYNC FUNCTIONS
   ========================================== */

let lastSyncState = 'idle';
let lastSyncMessage = 'Ready';
const syncListeners = new Set();

export function registerSyncListener(callback) {
  syncListeners.add(callback);
  callback({ state: lastSyncState, message: lastSyncMessage });
  return () => syncListeners.delete(callback);
}

function updateSyncStatus(state, message) {
  lastSyncState = state;
  lastSyncMessage = message;
  syncListeners.forEach(listener => listener({ state, message }));
}

export function initSyncWorker() {
  console.log('API: Sync worker initialized');
  updateSyncStatus('idle', 'Ready');
}

export async function triggerSync() {
  updateSyncStatus('running', 'Syncing offline data...');
  
  try {
    const offlineData = JSON.parse(localStorage.getItem('offline_registrations') || '[]');
    
    for (const record of offlineData) {
      try {
        await registerChild(record);
      } catch (error) {
        console.error('Error syncing record:', error);
      }
    }
    
    localStorage.removeItem('offline_registrations');
    updateSyncStatus('idle', 'Sync completed successfully');
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus('idle', 'Sync error occurred');
  }
}

/* ==========================================
   7. PUBLIC FORMS API
   ========================================== */

export async function submitContactForm(form) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contact/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        email_address: form.email_address,
        message_subject: form.message_subject,
        message_content: form.message_content
      })
    });
    
    if (response.ok) {
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('API: Error submitting contact form:', error);
    return { success: false, error: error.message };
  }
}

export async function submitVolunteerApplication(form) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/volunteer/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        email_address: form.email_address,
        phone_number: form.phone_number,
        volunteer_type: form.volunteer_type,
        message: form.message
      })
    });
    
    if (response.ok) {
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('API: Error submitting volunteer application:', error);
    return { success: false, error: error.message };
  }
}

// Helper function for executeQuery (needed for offline cache)
async function executeQuery(sql, params = []) {
  // This is a simplified version - in production, you'd have a proper SQLite implementation
  console.log('SQL Query:', sql, params);
  return [];
}
