import { executeRun, executeQuery, saveDB } from './db.js';
import bcrypt from 'bcryptjs';
import { API_ENDPOINTS, API_BASE_URL } from '../config/endpoints.js';

export { API_BASE_URL };

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
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
      // Silent fail - fallback to offline
    }
  }

  // Offline Fallback Auth
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
    const response = await fetch(API_ENDPOINTS.locations, {
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
    // Fallback to cached locations
    const rows = await executeQuery('SELECT * FROM child_locations ORDER BY name ASC');
    return rows;
  }
}

/* ==========================================
   3. CHILDREN API (REST)
   ========================================== */

export async function getChildren() {
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.children, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const children = data.children || data;
        
        // Cache to local SQLite
        for (const child of children) {
          if (child && child.id) {
            await executeRun(
              `INSERT OR REPLACE INTO children_profiles 
              (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, is_dirty, sync_status, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced', ?)`,
              [
                child.id,
                child.customSerialId || '',
                child.fullName || '',
                child.gender || 'Unknown',
                child.estimatedBirthYear || null,
                child.primaryLocationId || '',
                child.createdByStaffId || '',
                child.image1 || null,
                child.image2 || null,
                child.image3 || null,
                child.version || 1,
                child.createdAt || new Date().toISOString()
              ]
            );
          }
        }
        await saveDB();
        return children;
      }
    } catch (error) {
      // Silent fail - fallback to cache
    }
  }

  // Fallback to SQLite cache
  try {
    const cachedChildren = await executeQuery('SELECT * FROM children_profiles ORDER BY created_at DESC');
    return cachedChildren.map(child => ({
      id: child.id,
      customSerialId: child.custom_serial_id,
      fullName: child.full_name,
      gender: child.gender,
      estimatedBirthYear: child.estimated_birth_year,
      primaryLocationId: child.primary_location_id,
      createdByStaffId: child.created_by_staff_id,
      image1: child.image1,
      image2: child.image2,
      image3: child.image3,
      version: child.version,
      syncStatus: child.sync_status,
      createdAt: child.created_at
    }));
  } catch (err) {
    return [];
  }
}

export async function getChildById(id) {
  try {
    const response = await fetch(API_ENDPOINTS.child(id), {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.child || data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function registerChild(childData) {
  const isOnline = navigator.onLine;
  const childId = childData.id || crypto.randomUUID();
  const customSerialId = childData.customSerialId;
  const fullName = childData.fullName;
  const gender = childData.gender;
  const estimatedBirthYear = parseInt(childData.estimatedBirthYear);
  const primaryLocationId = childData.primaryLocationId;
  const image1 = childData.image1 || null;
  const image2 = childData.image2 || null;
  const image3 = childData.image3 || null;
  const createdByStaffId = childData.createdByStaffId || '';
  const createdAt = childData.createdAt || new Date().toISOString();

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.children, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: childId,
          customSerialId,
          fullName,
          gender,
          estimatedBirthYear,
          primaryLocationId,
          image1,
          image2,
          image3,
          createdByStaffId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Cache to local SQLite as synced
        await executeRun(
          `INSERT OR REPLACE INTO children_profiles 
          (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, is_dirty, sync_status, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'synced', ?)`,
          [childId, customSerialId, fullName, gender, estimatedBirthYear, primaryLocationId, createdByStaffId, image1, image2, image3, createdAt]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      // Silent fail - fallback to offline
    }
  }

  // Offline or network error: cache locally as local_created
  try {
    await executeRun(
      `INSERT OR REPLACE INTO children_profiles 
      (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, is_dirty, sync_status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'local_created', ?)`,
      [childId, customSerialId, fullName, gender, estimatedBirthYear, primaryLocationId, createdByStaffId, image1, image2, image3, createdAt]
    );
    await saveDB();
    
    // Also add to localStorage queue to preserve compatibility with existing sync processes
    await queueOfflineRegistration({
      id: childId,
      customSerialId,
      fullName,
      gender,
      estimatedBirthYear,
      primaryLocationId,
      image1,
      image2,
      image3,
      createdByStaffId,
      createdAt
    });

    return {
      success: true,
      message: "Patient registered offline.",
      child: {
        id: childId,
        customSerialId,
        fullName,
        gender,
        estimatedBirthYear,
        primaryLocationId,
        image1: image1,
        image2: image2,
        image3: image3,
        createdByStaffId,
        createdAt
      }
    };
  } catch (err) {
    throw err;
  }
}

export async function updateChild(id, childData) {
  const isOnline = navigator.onLine;
  const customSerialId = childData.customSerialId;
  const fullName = childData.fullName;
  const gender = childData.gender;
  const estimatedBirthYear = parseInt(childData.estimatedBirthYear);
  const primaryLocationId = childData.primaryLocationId;
  const image1 = childData.image1 || null;
  const image2 = childData.image2 || null;
  const image3 = childData.image3 || null;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.child(id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customSerialId,
          fullName,
          gender,
          estimatedBirthYear,
          primaryLocationId,
          image1,
          image2,
          image3
        })
      });
      if (response.ok) {
        const result = await response.json();
        // Update local SQLite as synced
        await executeRun(
          `INSERT OR REPLACE INTO children_profiles 
          (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, is_dirty, sync_status, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced', ?)`,
          [id, customSerialId, fullName, gender, estimatedBirthYear, primaryLocationId, childData.createdByStaffId || '', image1, image2, image3, childData.version || 1, childData.createdAt || new Date().toISOString()]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      // Silent fail - fallback to offline
    }
  }

  // Offline or network error: cache locally as local_updated
  try {
    await executeRun(
      `INSERT OR REPLACE INTO children_profiles 
      (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, is_dirty, sync_status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'local_updated', ?)`,
      [id, customSerialId, fullName, gender, estimatedBirthYear, primaryLocationId, childData.createdByStaffId || '', image1, image2, image3, (childData.version || 1) + 1, childData.createdAt || new Date().toISOString()]
    );
    await saveDB();
    return {
      success: true,
      message: "Patient updated offline.",
      child: {
        id,
        customSerialId,
        fullName,
        gender,
        estimatedBirthYear,
        primaryLocationId,
        image1,
        image2,
        image3,
        createdByStaffId: childData.createdByStaffId,
        createdAt: childData.createdAt
      }
    };
  } catch (err) {
    throw err;
  }
}

export async function deleteChild(id) {
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.child(id), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        // Delete locally
        await executeRun('DELETE FROM children_profiles WHERE id = ?', [id]);
        await executeRun('DELETE FROM biometric_fingerprints WHERE child_id = ?', [id]);
        await saveDB();
        return true;
      }
    } catch (error) {
      // Silent fail
    }
  } else {
    // Offline delete
    try {
      await executeRun('DELETE FROM children_profiles WHERE id = ?', [id]);
      await executeRun('DELETE FROM biometric_fingerprints WHERE child_id = ?', [id]);
      await saveDB();
      return true;
    } catch (err) {
      // Silent fail
    }
  }
  return false;
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
  const isOnline = navigator.onLine;
  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.biometricsChild(childId), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const fingerprints = Array.isArray(data) ? data : (data.fingerprints || [data]);
        
        // Cache in SQLite
        for (const fp of fingerprints) {
          if (fp && fp.id) {
            await executeRun(
              `INSERT OR REPLACE INTO biometric_fingerprints 
              (id, child_id, finger_index, template_data, quality_score, status, version, is_dirty, sync_status, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'synced', ?)`,
              [
                fp.id,
                fp.childId || childId,
                fp.fingerIndex || 1,
                fp.templateBase64 || fp.templateData || '',
                fp.qualityScore || 80,
                fp.status || 'PENDING',
                fp.version || 1,
                fp.createdAt || new Date().toISOString()
              ]
            );
          }
        }
        await saveDB();
        return fingerprints;
      }
    } catch (error) {
      // Silent fail - fallback to cache
    }
  }

  // Fallback to SQLite cache
  try {
    const rows = await executeQuery('SELECT * FROM biometric_fingerprints WHERE child_id = ?', [childId]);
    return rows.map(fp => ({
      id: fp.id,
      childId: fp.child_id,
      fingerIndex: fp.finger_index,
      templateBase64: fp.template_data,
      templateData: fp.template_data,
      qualityScore: fp.quality_score,
      status: fp.status,
      version: fp.version,
      syncStatus: fp.sync_status,
      createdAt: fp.created_at
    }));
  } catch (err) {
    return [];
  }
}

export async function enrollBiometric(bioData) {
  const isOnline = navigator.onLine;
  const bioId = bioData.id || crypto.randomUUID();
  const template = bioData.templateBase64 || bioData.templateData || '';
  const quality = bioData.qualityScore || 80;
  const fingerIndex = bioData.fingerIndex || 1;
  const status = bioData.status || 'PENDING';
  const childId = bioData.childId;
  const createdAt = bioData.createdAt || new Date().toISOString();

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.biometricsEnroll, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: bioId,
          childId: childId,
          fingerIndex: fingerIndex,
          templateBase64: template,
          qualityScore: quality,
          capturedAt: createdAt,
          matcherVersion: "1.0"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Cache to local SQLite as synced
        await executeRun(
          `INSERT OR REPLACE INTO biometric_fingerprints 
          (id, child_id, finger_index, template_data, quality_score, status, version, is_dirty, sync_status, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, 1, 0, 'synced', ?)`,
          [bioId, childId, fingerIndex, template, quality, status, createdAt]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      // Silent fail - fallback to offline
    }
  }

  // Offline or network error: cache locally as local_created
  try {
    await executeRun(
      `INSERT OR REPLACE INTO biometric_fingerprints 
      (id, child_id, finger_index, template_data, quality_score, status, version, is_dirty, sync_status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, 1, 1, 'local_created', ?)`,
      [bioId, childId, fingerIndex, template, quality, status, createdAt]
    );
    await saveDB();
    return {
      success: true,
      message: "Biometric enrolled offline.",
      biometric: {
        id: bioId,
        childId: childId,
        fingerIndex: fingerIndex,
        templateBase64: template,
        qualityScore: quality,
        status: status,
        createdAt: createdAt
      }
    };
  } catch (err) {
    throw err;
  }
}

/* ==========================================
   5. DASHBOARD STATS API (REST)
   ========================================== */

export async function getDashboardStats() {
  try {
    const [childrenRes, onlineRes] = await Promise.all([
      fetch(API_ENDPOINTS.children, { headers: getAuthHeaders() }),
      fetch(API_ENDPOINTS.onlineCount, { headers: getAuthHeaders() })
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
    return {
      totalChildren: 0,
      todayRegistrations: 0,
      onlineUsers: 0
    };
  }
}

export async function getLocationStats() {
  try {
    const response = await fetch(API_ENDPOINTS.children, {
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
    return [];
  }
}

export async function getMonthlyRegistrations() {
  try {
    const response = await fetch(API_ENDPOINTS.children, {
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
    return [];
  }
}

export async function getRecentActivities(limit = 10) {
  try {
    const response = await fetch(API_ENDPOINTS.children, {
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
  updateSyncStatus('idle', 'Ready');
}

export async function triggerSync() {
  updateSyncStatus('running', 'Syncing offline data...');
  
  try {
    // 1. Sync from SQLite dirty records first as it's the primary store
    const dirtyChildren = await executeQuery(
      `SELECT * FROM children_profiles WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
    );
    
    for (const row of dirtyChildren) {
      try {
        const childData = {
          id: row.id,
          customSerialId: row.custom_serial_id,
          fullName: row.full_name,
          gender: row.gender,
          estimatedBirthYear: row.estimated_birth_year,
          primaryLocationId: row.primary_location_id,
          image1: row.image1,
          image2: row.image2,
          image3: row.image3,
          createdByStaffId: row.created_by_staff_id,
          createdAt: row.created_at
        };
        
        const response = await fetch(API_ENDPOINTS.children, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: childData.id,
            customSerialId: childData.customSerialId,
            fullName: childData.fullName,
            gender: childData.gender,
            estimatedBirthYear: childData.estimatedBirthYear,
            primaryLocationId: childData.primaryLocationId,
            image1: childData.image1,
            image2: childData.image2,
            image3: childData.image3,
            createdByStaffId: childData.createdByStaffId
          })
        });
        
        if (response.ok) {
          await executeRun(
            `UPDATE children_profiles SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
            [row.id]
          );
        }
      } catch (error) {
        // Silent fail for individual record
      }
    }
    
    // 2. Sync dirty biometric fingerprints
    const dirtyFingerprints = await executeQuery(
      `SELECT * FROM biometric_fingerprints WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
    );
    
    for (const row of dirtyFingerprints) {
      try {
        const response = await fetch(API_ENDPOINTS.biometricsEnroll, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: row.id,
            childId: row.child_id,
            fingerIndex: row.finger_index,
            templateBase64: row.template_data,
            qualityScore: row.quality_score,
            capturedAt: row.created_at,
            matcherVersion: "1.0"
          })
        });
        
        if (response.ok) {
          await executeRun(
            `UPDATE biometric_fingerprints SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
            [row.id]
          );
        }
      } catch (error) {
        // Silent fail for individual record
      }
    }
    
    // 3. Fallback: Sync any leftover items in localStorage offline_registrations
    const offlineData = JSON.parse(localStorage.getItem('offline_registrations') || '[]');
    const unsyncedOffline = [];
    
    for (const record of offlineData) {
      try {
        const response = await fetch(API_ENDPOINTS.children, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: record.id || crypto.randomUUID(),
            customSerialId: record.customSerialId,
            fullName: record.fullName,
            gender: record.gender,
            estimatedBirthYear: parseInt(record.estimatedBirthYear),
            primaryLocationId: record.primaryLocationId,
            image1: record.image1 || null,
            image2: record.image2 || null,
            image3: record.image3 || null,
            createdByStaffId: record.createdByStaffId
          })
        });
        
        if (!response.ok) {
          unsyncedOffline.push(record);
        }
      } catch (error) {
        unsyncedOffline.push(record);
      }
    }
    
    if (unsyncedOffline.length > 0) {
      localStorage.setItem('offline_registrations', JSON.stringify(unsyncedOffline));
      updateSyncStatus('idle', `Sync completed with some failures`);
    } else {
      localStorage.removeItem('offline_registrations');
      updateSyncStatus('idle', 'Sync completed successfully');
    }
    
    await saveDB();
  } catch (error) {
    updateSyncStatus('idle', 'Sync error occurred');
  }
}

/* ==========================================
   7. PUBLIC FORMS API
   ========================================== */

export async function submitContactForm(form) {
  try {
    const response = await fetch(API_ENDPOINTS.contactSubmit, {
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
    return { success: false, error: error.message };
  }
}

export async function submitVolunteerApplication(form) {
  try {
    const response = await fetch(API_ENDPOINTS.volunteerSubmit, {
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
    return { success: false, error: error.message };
  }
}