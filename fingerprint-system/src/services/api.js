import { executeRun, executeQuery, saveDB } from './db.js';
import bcrypt from 'bcryptjs';
import { API_ENDPOINTS, API_BASE_URL } from '../config/endpoints.js';

export { API_BASE_URL };

// Global Fetch Interceptor for Secure Cookies
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const urlStr = typeof url === 'string' ? url : (url instanceof URL ? url.href : '');
  // Force credentials: 'include' for same-origin or backend API calls
  const isTargetApi = urlStr.startsWith('/') || urlStr.includes('mitzkits.co.tz') || urlStr.includes('localhost');

  if (isTargetApi) {
    options.credentials = 'include';
    
    // Clean up unnecessary Authorization header since we now use HttpOnly cookies
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.delete('Authorization');
      } else if (typeof options.headers === 'object') {
        delete options.headers['Authorization'];
      }
    }
  }

  return originalFetch(url, options);
};

// Global Storage Interceptors to automatically trigger backend logout
const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function (key) {
  if (key === 'user' || key === 'token') {
    if (navigator.onLine) {
      originalFetch(`${API_BASE_URL}/api/auth/logout`, { 
        method: 'POST',
        credentials: 'include' 
      }).catch(err => console.warn('Background logout error:', err));
    }
  }
  return originalRemoveItem.apply(this, arguments);
};

const originalSessionRemoveItem = sessionStorage.removeItem;
sessionStorage.removeItem = function (key) {
  if (key === 'user' || key === 'token') {
    if (navigator.onLine) {
      originalFetch(`${API_BASE_URL}/api/auth/logout`, { 
        method: 'POST',
        credentials: 'include' 
      }).catch(err => console.warn('Background logout error:', err));
    }
  }
  return originalSessionRemoveItem.apply(this, arguments);
};

// Helper to get authorization headers
export function getAuthHeaders() {
  return {
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
   4. CLINICAL DATA API (Vitals, Medications, Symptoms, etc.)
   ========================================== */

// BASELINE INFORMATION
export async function saveBaseline(childId, baselineData) {
  const id = baselineData.id || crypto.randomUUID();
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.baseline(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id,
          ...baselineData
        })
      });
      if (response.ok) {
        const result = await response.json();
        // Cache as synced
        await executeRun(
          `INSERT OR REPLACE INTO medical_baselines (id, child_id, visit_date, first_visit, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, baselineData.visitDate, baselineData.firstVisit ? 1 : 0, baselineData.recordedBy, baselineData.recordedByName]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save baseline online, caching locally...', error);
    }
  }

  // Offline: cache locally as local_created
  try {
    await executeRun(
      `INSERT OR REPLACE INTO medical_baselines (id, child_id, visit_date, first_visit, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, baselineData.visitDate, baselineData.firstVisit ? 1 : 0, baselineData.recordedBy, baselineData.recordedByName]
    );
    await saveDB();
    return { success: true, message: 'Baseline saved offline', data: { id, childId, ...baselineData } };
  } catch (err) {
    console.error('API: Error saving baseline offline:', err);
    throw err;
  }
}

export async function getBaseline(childId) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.baseline(childId), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('API: Failed to fetch baseline online, using cache...', error);
    }
  }

  // Fallback to SQLite
  try {
    const rows = await executeQuery('SELECT * FROM medical_baselines WHERE child_id = ? ORDER BY visit_date DESC LIMIT 1', [childId]);
    return rows.length > 0 ? {
      id: rows[0].id,
      childId: rows[0].child_id,
      visitDate: rows[0].visit_date,
      firstVisit: rows[0].first_visit === 1,
      recordedBy: rows[0].recorded_by,
      recordedByName: rows[0].recorded_by_name
    } : null;
  } catch (err) {
    console.error('API: Error fetching baseline:', err);
    return null;
  }
}

// VITALS
export async function saveVitals(childId, vitalsData) {
  const id = vitalsData.id || crypto.randomUUID();
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.vitals(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id,
          ...vitalsData
        })
      });
      if (response.ok) {
        const result = await response.json();
        // Cache as synced
        await executeRun(
          `INSERT OR REPLACE INTO child_vitals (id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version, is_dirty, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, vitalsData.weight, vitalsData.height, vitalsData.bmi, vitalsData.bmiStatus, vitalsData.recordedBy, vitalsData.recordedByName, vitalsData.date]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save vitals online, caching locally...', error);
    }
  }

  // Offline: cache locally
  try {
    await executeRun(
      `INSERT OR REPLACE INTO child_vitals (id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version, is_dirty, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, vitalsData.weight, vitalsData.height, vitalsData.bmi, vitalsData.bmiStatus, vitalsData.recordedBy, vitalsData.recordedByName, vitalsData.date]
    );
    await saveDB();
    return { success: true, message: 'Vitals saved offline', data: { id, childId, ...vitalsData } };
  } catch (err) {
    console.error('API: Error saving vitals offline:', err);
    throw err;
  }
}

export async function getVitalsHistory(childId) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.vitals(childId), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data) ? data : (data.records || []);

        // Cache records
        for (const record of records) {
          await executeRun(
            `INSERT OR REPLACE INTO child_vitals (id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version, is_dirty, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
            [record.id, childId, record.weight, record.height, record.bmi, record.bmiStatus, record.recordedBy, record.recordedByName, record.date, record.version || 1]
          );
        }
        await saveDB();
        return records;
      }
    } catch (error) {
      console.warn('API: Failed to fetch vitals online, using cache...', error);
    }
  }

  // Fallback to SQLite
  try {
    const rows = await executeQuery('SELECT * FROM child_vitals WHERE child_id = ? ORDER BY date DESC, created_at DESC', [childId]);
    return rows.map(row => ({
      id: row.id,
      childId: row.child_id,
      weight: row.weight,
      height: row.height,
      bmi: row.bmi,
      bmiStatus: row.bmi_status,
      recordedBy: row.recorded_by,
      recordedByName: row.recorded_by_name,
      date: row.date
    }));
  } catch (err) {
    console.error('API: Error fetching vitals history:', err);
    return [];
  }
}

// MEDICATIONS
export async function saveMedication(childId, medicationData) {
  const id = medicationData.id || crypto.randomUUID();
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.medications(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id,
          ...medicationData
        })
      });
      if (response.ok) {
        const result = await response.json();
        // Cache as synced
        await executeRun(
          `INSERT OR REPLACE INTO medications_given (id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, medicationData.ntdsMeds, medicationData.antibiotics, medicationData.otherMeds, medicationData.dateGiven, medicationData.recordedBy, medicationData.recordedByName]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save medication online, caching locally...', error);
    }
  }

  // Offline: cache locally
  try {
    await executeRun(
      `INSERT OR REPLACE INTO medications_given (id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, medicationData.ntdsMeds, medicationData.antibiotics, medicationData.otherMeds, medicationData.dateGiven, medicationData.recordedBy, medicationData.recordedByName]
    );
    await saveDB();
    return { success: true, message: 'Medication saved offline', data: { id, childId, ...medicationData } };
  } catch (err) {
    console.error('API: Error saving medication offline:', err);
    throw err;
  }
}

export async function getMedicationsHistory(childId) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.medications(childId), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data) ? data : (data.records || []);

        // Cache records
        for (const record of records) {
          await executeRun(
            `INSERT OR REPLACE INTO medications_given (id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
            [record.id, childId, record.ntdsMeds, record.antibiotics, record.otherMeds, record.dateGiven, record.recordedBy, record.recordedByName, record.version || 1]
          );
        }
        await saveDB();
        return records;
      }
    } catch (error) {
      console.warn('API: Failed to fetch medications online, using cache...', error);
    }
  }

  // Fallback to SQLite
  try {
    const rows = await executeQuery('SELECT * FROM medications_given WHERE child_id = ? ORDER BY date_given DESC, created_at DESC', [childId]);
    return rows.map(row => ({
      id: row.id,
      childId: row.child_id,
      ntdsMeds: row.ntds_meds,
      antibiotics: row.antibiotics,
      otherMeds: row.other_meds,
      dateGiven: row.date_given,
      recordedBy: row.recorded_by,
      recordedByName: row.recorded_by_name
    }));
  } catch (err) {
    console.error('API: Error fetching medications history:', err);
    return [];
  }
}

// TESTS
export async function saveTest(childId, testData) {
  const id = testData.id || crypto.randomUUID();
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.tests(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...testData })
      });
      if (response.ok) {
        const result = await response.json();
        await executeRun(
          `INSERT OR REPLACE INTO laboratory_tests (id, child_id, test_type, result, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, testData.testType, testData.result, testData.date, testData.recordedBy, testData.recordedByName]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save test online, caching locally...', error);
    }
  }

  try {
    await executeRun(
      `INSERT OR REPLACE INTO laboratory_tests (id, child_id, test_type, result, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, testData.testType, testData.result, testData.date, testData.recordedBy, testData.recordedByName]
    );
    await saveDB();
    return { success: true, message: 'Test saved offline', data: { id, childId, ...testData } };
  } catch (err) {
    console.error('API: Error saving test offline:', err);
    throw err;
  }
}

export async function getTestsHistory(childId) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.testsHistory(childId), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data) ? data : (data.records || []);

        for (const record of records) {
          await executeRun(
            `INSERT OR REPLACE INTO laboratory_tests (id, child_id, test_type, result, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
            [record.id, childId, record.testType, record.result, record.date, record.recordedBy, record.recordedByName, record.version || 1]
          );
        }
        await saveDB();
        return records;
      }
    } catch (error) {
      console.warn('API: Failed to fetch tests online, using cache...', error);
    }
  }

  try {
    const rows = await executeQuery('SELECT * FROM laboratory_tests WHERE child_id = ? ORDER BY date DESC, created_at DESC', [childId]);
    return rows.map(row => ({
      id: row.id,
      childId: row.child_id,
      testType: row.test_type,
      result: row.result,
      date: row.date,
      recordedBy: row.recorded_by,
      recordedByName: row.recorded_by_name
    }));
  } catch (err) {
    console.error('API: Error fetching tests history:', err);
    return [];
  }
}

// SYMPTOMS
export async function saveSymptoms(childId, symptomsData) {
  const id = symptomsData.id || crypto.randomUUID();
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.symptoms(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...symptomsData })
      });
      if (response.ok) {
        const result = await response.json();
        await executeRun(
          `INSERT OR REPLACE INTO symptoms_recorded (id, child_id, symptoms, visit_notes, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, symptomsData.symptoms, symptomsData.visitNotes, symptomsData.date, symptomsData.recordedBy, symptomsData.recordedByName]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save symptoms online, caching locally...', error);
    }
  }

  try {
    await executeRun(
      `INSERT OR REPLACE INTO symptoms_recorded (id, child_id, symptoms, visit_notes, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, symptomsData.symptoms, symptomsData.visitNotes, symptomsData.date, symptomsData.recordedBy, symptomsData.recordedByName]
    );
    await saveDB();
    return { success: true, message: 'Symptoms saved offline', data: { id, childId, ...symptomsData } };
  } catch (err) {
    console.error('API: Error saving symptoms offline:', err);
    throw err;
  }
}

// CLOTHING PROVISIONS
export async function saveClothing(childId, clothingData) {
  const id = clothingData.id || crypto.randomUUID();
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.clothing(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...clothingData })
      });
      if (response.ok) {
        const result = await response.json();
        await executeRun(
          `INSERT OR REPLACE INTO clothing_provisions (id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, clothingData.shoes, clothingData.clothes, clothingData.date, clothingData.recordedBy, clothingData.recordedByName]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save clothing online, caching locally...', error);
    }
  }

  try {
    await executeRun(
      `INSERT OR REPLACE INTO clothing_provisions (id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, clothingData.shoes, clothingData.clothes, clothingData.date, clothingData.recordedBy, clothingData.recordedByName]
    );
    await saveDB();
    return { success: true, message: 'Clothing saved offline', data: { id, childId, ...clothingData } };
  } catch (err) {
    console.error('API: Error saving clothing offline:', err);
    throw err;
  }
}

export async function getClothingHistory(childId) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.clothing(childId), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data) ? data : (data.records || []);

        for (const record of records) {
          await executeRun(
            `INSERT OR REPLACE INTO clothing_provisions (id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
            [record.id, childId, record.shoes, record.clothes, record.date, record.recordedBy, record.recordedByName, record.version || 1]
          );
        }
        await saveDB();
        return records;
      }
    } catch (error) {
      console.warn('API: Failed to fetch clothing online, using cache...', error);
    }
  }

  try {
    const rows = await executeQuery('SELECT * FROM clothing_provisions WHERE child_id = ? ORDER BY date DESC', [childId]);
    return rows.map(row => ({
      id: row.id,
      childId: row.child_id,
      shoes: row.shoes,
      clothes: row.clothes,
      date: row.date,
      recordedBy: row.recorded_by,
      recordedByName: row.recorded_by_name
    }));
  } catch (err) {
    console.error('API: Error fetching clothing history:', err);
    return [];
  }
}

// SERVICES
export async function saveMedicalServices(childId, servicesData) {
  const id = servicesData.id || crypto.randomUUID();
  const servicesList = Array.isArray(servicesData.services) ? servicesData.services.join(', ') : servicesData.services;
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.medicalServices(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, services: servicesData.services, ...servicesData })
      });
      if (response.ok) {
        const result = await response.json();
        await executeRun(
          `INSERT OR REPLACE INTO services_rendered (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
           VALUES (?, ?, 'medical', ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, servicesList, servicesData.date, servicesData.recordedBy, servicesData.recordedByName]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save medical services online, caching locally...', error);
    }
  }

  try {
    await executeRun(
      `INSERT OR REPLACE INTO services_rendered (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
       VALUES (?, ?, 'medical', ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, servicesList, servicesData.date, servicesData.recordedBy, servicesData.recordedByName]
    );
    await saveDB();
    return { success: true, message: 'Medical services saved offline' };
  } catch (err) {
    console.error('API: Error saving medical services offline:', err);
    throw err;
  }
}

export async function saveSocialServices(childId, servicesData) {
  const id = servicesData.id || crypto.randomUUID();
  const servicesList = Array.isArray(servicesData.services) ? servicesData.services.join(', ') : servicesData.services;
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.socialServices(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, services: servicesData.services, ...servicesData })
      });
      if (response.ok) {
        const result = await response.json();
        await executeRun(
          `INSERT OR REPLACE INTO services_rendered (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
           VALUES (?, ?, 'social', ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, servicesList, servicesData.date, servicesData.recordedBy, servicesData.recordedByName]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save social services online, caching locally...', error);
    }
  }

  try {
    await executeRun(
      `INSERT OR REPLACE INTO services_rendered (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
       VALUES (?, ?, 'social', ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, servicesList, servicesData.date, servicesData.recordedBy, servicesData.recordedByName]
    );
    await saveDB();
    return { success: true, message: 'Social services saved offline' };
  } catch (err) {
    console.error('API: Error saving social services offline:', err);
    throw err;
  }
}

export async function saveEducationServices(childId, educationData) {
  const id = educationData.id || crypto.randomUUID();
  const servicesList = Array.isArray(educationData.education) ? educationData.education.join(', ') : educationData.education;
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.education(childId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, education: educationData.education, ...educationData })
      });
      if (response.ok) {
        const result = await response.json();
        await executeRun(
          `INSERT OR REPLACE INTO services_rendered (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
           VALUES (?, ?, 'education', ?, ?, ?, ?, 1, 0, 'synced')`,
          [id, childId, servicesList, educationData.date, educationData.recordedBy, educationData.recordedByName]
        );
        await saveDB();
        return result;
      }
    } catch (error) {
      console.warn('API: Failed to save education services online, caching locally...', error);
    }
  }

  try {
    await executeRun(
      `INSERT OR REPLACE INTO services_rendered (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, is_dirty, sync_status) 
       VALUES (?, ?, 'education', ?, ?, ?, ?, 1, 1, 'local_created')`,
      [id, childId, servicesList, educationData.date, educationData.recordedBy, educationData.recordedByName]
    );
    await saveDB();
    return { success: true, message: 'Education services saved offline' };
  } catch (err) {
    console.error('API: Error saving education services offline:', err);
    throw err;
  }
}

export async function getEducationHistory(childId) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.educationHistory(childId), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const records = Array.isArray(data) ? data : (data.records || []);
        return records;
      }
    } catch (error) {
      console.warn('API: Failed to fetch education history online, using cache...', error);
    }
  }

  try {
    const rows = await executeQuery('SELECT * FROM services_rendered WHERE child_id = ? AND service_type = "education" ORDER BY date DESC', [childId]);
    return rows.map(row => ({
      id: row.id,
      childId: row.child_id,
      education: row.services_list.split(', '),
      date: row.date,
      recordedBy: row.recorded_by,
      recordedByName: row.recorded_by_name
    }));
  } catch (err) {
    console.error('API: Error fetching education history:', err);
    return [];
  }
}

/* ==========================================
   5. BIOMETRICS API (REST)
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

    // 2.5 Sync dirty clinical data records from SQLite

    // A. Sync medical baselines
    try {
      const dirtyBaselines = await executeQuery(
        `SELECT * FROM medical_baselines WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
      );
      for (const row of dirtyBaselines) {
        try {
          const response = await fetch(API_ENDPOINTS.baseline(row.child_id), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: row.id,
              childId: row.child_id,
              visitDate: row.visit_date,
              firstVisit: row.first_visit === 1,
              recordedBy: row.recorded_by,
              recordedByName: row.recorded_by_name
            })
          });
          if (response.ok) {
            await executeRun(
              `UPDATE medical_baselines SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
              [row.id]
            );
          }
        } catch (error) {
          console.error('Error syncing medical baseline record from SQLite:', error);
        }
      }
    } catch (err) {
      console.error('Failed to query dirty baselines:', err);
    }

    // B. Sync vitals
    try {
      const dirtyVitals = await executeQuery(
        `SELECT * FROM child_vitals WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
      );
      for (const row of dirtyVitals) {
        try {
          const response = await fetch(API_ENDPOINTS.vitals(row.child_id), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: row.id,
              childId: row.child_id,
              weight: row.weight,
              height: row.height,
              bmi: row.bmi,
              bmiStatus: row.bmi_status,
              recordedBy: row.recorded_by,
              recordedByName: row.recorded_by_name,
              date: row.date
            })
          });
          if (response.ok) {
            await executeRun(
              `UPDATE child_vitals SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
              [row.id]
            );
          }
        } catch (error) {
          console.error('Error syncing vitals record from SQLite:', error);
        }
      }
    } catch (err) {
      console.error('Failed to query dirty vitals:', err);
    }

    // C. Sync medications
    try {
      const dirtyMedications = await executeQuery(
        `SELECT * FROM medications_given WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
      );
      for (const row of dirtyMedications) {
        try {
          const response = await fetch(API_ENDPOINTS.medications(row.child_id), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: row.id,
              childId: row.child_id,
              ntdsMeds: row.ntds_meds,
              antibiotics: row.antibiotics,
              otherMeds: row.other_meds,
              dateGiven: row.date_given,
              recordedBy: row.recorded_by,
              recordedByName: row.recorded_by_name
            })
          });
          if (response.ok) {
            await executeRun(
              `UPDATE medications_given SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
              [row.id]
            );
          }
        } catch (error) {
          console.error('Error syncing medication record from SQLite:', error);
        }
      }
    } catch (err) {
      console.error('Failed to query dirty medications:', err);
    }

    // D. Sync tests
    try {
      const dirtyTests = await executeQuery(
        `SELECT * FROM laboratory_tests WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
      );
      for (const row of dirtyTests) {
        try {
          const response = await fetch(API_ENDPOINTS.tests(row.child_id), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: row.id,
              childId: row.child_id,
              testType: row.test_type,
              result: row.result,
              date: row.date,
              recordedBy: row.recorded_by,
              recordedByName: row.recorded_by_name
            })
          });
          if (response.ok) {
            await executeRun(
              `UPDATE laboratory_tests SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
              [row.id]
            );
          }
        } catch (error) {
          console.error('Error syncing laboratory test record from SQLite:', error);
        }
      }
    } catch (err) {
      console.error('Failed to query dirty tests:', err);
    }

    // E. Sync services
    try {
      const dirtyServices = await executeQuery(
        `SELECT * FROM services_rendered WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
      );
      for (const row of dirtyServices) {
        try {
          let endpoint = '';
          const servicesArray = row.services_list ? row.services_list.split(',').map(s => s.trim()) : [];
          let bodyData = {};

          if (row.service_type === 'medical') {
            endpoint = API_ENDPOINTS.medicalServices(row.child_id);
            bodyData = { id: row.id, childId: row.child_id, services: servicesArray, date: row.date, recordedBy: row.recorded_by, recordedByName: row.recorded_by_name };
          } else if (row.service_type === 'social') {
            endpoint = API_ENDPOINTS.socialServices(row.child_id);
            bodyData = { id: row.id, childId: row.child_id, services: servicesArray, date: row.date, recordedBy: row.recorded_by, recordedByName: row.recorded_by_name };
          } else if (row.service_type === 'education') {
            endpoint = API_ENDPOINTS.education(row.child_id);
            bodyData = { id: row.id, childId: row.child_id, education: servicesArray, date: row.date, recordedBy: row.recorded_by, recordedByName: row.recorded_by_name };
          }

          if (endpoint) {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(bodyData)
            });
            if (response.ok) {
              await executeRun(
                `UPDATE services_rendered SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
                [row.id]
              );
            }
          }
        } catch (error) {
          console.error('Error syncing service record from SQLite:', error);
        }
      }
    } catch (err) {
      console.error('Failed to query dirty services:', err);
    }

    // F. Sync symptoms
    try {
      const dirtySymptoms = await executeQuery(
        `SELECT * FROM symptoms_recorded WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
      );
      for (const row of dirtySymptoms) {
        try {
          const response = await fetch(API_ENDPOINTS.symptoms(row.child_id), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: row.id,
              childId: row.child_id,
              symptoms: row.symptoms,
              visitNotes: row.visit_notes,
              date: row.date,
              recordedBy: row.recorded_by,
              recordedByName: row.recorded_by_name
            })
          });
          if (response.ok) {
            await executeRun(
              `UPDATE symptoms_recorded SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
              [row.id]
            );
          }
        } catch (error) {
          console.error('Error syncing symptoms record from SQLite:', error);
        }
      }
    } catch (err) {
      console.error('Failed to query dirty symptoms:', err);
    }

    // G. Sync clothing
    try {
      const dirtyClothing = await executeQuery(
        `SELECT * FROM clothing_provisions WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
      );
      for (const row of dirtyClothing) {
        try {
          const response = await fetch(API_ENDPOINTS.clothing(row.child_id), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: row.id,
              childId: row.child_id,
              shoes: row.shoes,
              clothes: row.clothes,
              date: row.date,
              recordedBy: row.recorded_by,
              recordedByName: row.recorded_by_name
            })
          });
          if (response.ok) {
            await executeRun(
              `UPDATE clothing_provisions SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
              [row.id]
            );
          }
        } catch (error) {
          console.error('Error syncing clothing provision record from SQLite:', error);
        }
      }
    } catch (err) {
      console.error('Failed to query dirty clothing provisions:', err);
    }

    // 2.6 Sync dirty notifications and read receipts
        try {
          const dirtyNotifications = await executeQuery(
            `SELECT * FROM notifications WHERE sync_status IN ('local_created', 'local_updated') OR is_dirty = 1`
          );
          for (const row of dirtyNotifications) {
            try {
              const method = row.sync_status === 'local_updated' ? 'PUT' : 'POST';
              const url = method === 'PUT' ? `${API_ENDPOINTS.notifications}/${row.id}` : API_ENDPOINTS.notifications;
              const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  id: row.id,
                  type: row.type,
                  title: row.title,
                  message: row.message,
                  targetType: row.target_type,
                  targetRoleId: row.target_role_id,
                  targetUserId: row.target_user_id,
                  expiresAt: row.expires_at
                })
              });
              if (response.ok) {
                await executeRun(
                  `UPDATE notifications SET sync_status = 'synced', is_dirty = 0 WHERE id = ?`,
                  [row.id]
                );
              }
            } catch (error) {
              console.error('Error syncing notification from SQLite:', error);
            }
          }
        } catch (err) {
          console.error('Failed to query dirty notifications:', err);
        }

        try {
          const dirtyReads = await executeQuery(
            `SELECT * FROM notification_reads WHERE sync_status = 'local_created' OR is_dirty = 1`
          );
          for (const row of dirtyReads) {
            try {
              const response = await fetch(API_ENDPOINTS.notificationRead(row.notification_id), {
                method: 'PUT',
                headers: getAuthHeaders()
              });
              if (response.ok) {
                await executeRun(
                  `UPDATE notification_reads SET sync_status = 'synced', is_dirty = 0 WHERE notification_id = ? AND staff_user_id = ?`,
                  [row.notification_id, row.staff_user_id]
                );
              }
            } catch (error) {
              console.error('Error syncing notification read from SQLite:', error);
            }
          }
        } catch (err) {
          console.error('Failed to query dirty notification reads:', err);
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
            console.error('Error syncing record from localStorage:', error);
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
        console.error('Sync error:', error);
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
    console.error('API: Error submitting contact form:', error);
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
        console.error('API: Error submitting volunteer application:', error);
        return { success: false, error: error.message };
      }
    }

    /* ==========================================
       8. CLINICAL RECORDS & VITALS CACHED API
       ========================================== */

    export async function apiFetchMedicalRecords(childId) {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.medicalRecords(childId), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            const records = Array.isArray(data) ? data : (data.records || [data]);
            for (const record of records) {
              if (record && record.id) {
                await executeRun(
                  `INSERT OR REPLACE INTO medical_baselines 
              (id, child_id, visit_date, first_visit, recorded_by, recorded_by_name, version, sync_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')`,
                  [record.id, childId, record.visitDate || record.visit_date || '', record.firstVisit ? 1 : 0, record.recordedBy || record.recorded_by || null, record.recordedByName || record.recorded_by_name || null, record.version || 1]
                );
              }
            }
            await saveDB();
            return records;
          }
        } catch (error) {
          console.warn('API: Failed to fetch medical records online, using SQLite.', error);
        }
      }

      // SQLite Fallback
      try {
        const rows = await executeQuery('SELECT * FROM medical_baselines WHERE child_id = ? ORDER BY visit_date DESC', [childId]);
        return rows.map(row => ({
          id: row.id,
          childId: row.child_id,
          visitDate: row.visit_date,
          firstVisit: row.first_visit === 1,
          recordedBy: row.recorded_by,
          recordedByName: row.recorded_by_name,
          createdAt: row.created_at
        }));
      } catch (err) {
        console.error('API: Error fetching medical baselines from SQLite:', err);
        return [];
      }
    }

    export async function apiSaveBaselineInfo(baselineData) {
      const isOnline = navigator.onLine;
      const id = baselineData.id || crypto.randomUUID();
      const childId = baselineData.childId;
      const visitDate = baselineData.visitDate;
      const firstVisit = baselineData.firstVisit === true || baselineData.firstVisit === 1;
      const recordedBy = baselineData.recordedBy || null;
      const recordedByName = baselineData.recordedByName || null;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.baseline(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, visitDate, firstVisit, recordedBy, recordedByName })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO medical_baselines 
          (id, child_id, visit_date, first_visit, recorded_by, recorded_by_name, version, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, visitDate, firstVisit ? 1 : 0, recordedBy, recordedByName]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save baseline online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO medical_baselines 
      (id, child_id, visit_date, first_visit, recorded_by, recorded_by_name, version, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, visitDate, firstVisit ? 1 : 0, recordedBy, recordedByName]
        );
        await saveDB();
        return { success: true, message: 'Baseline saved offline.' };
      } catch (err) {
        console.error('API: Error caching baseline offline:', err);
        throw err;
      }
    }

    export async function apiFetchVitalsRecords(childId) {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.vitals(childId), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            const records = Array.isArray(data) ? data : (data.vitals || []);
            for (const record of records) {
              if (record && record.id) {
                await executeRun(
                  `INSERT OR REPLACE INTO child_vitals 
              (id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version, sync_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
                  [
                    record.id,
                    childId,
                    record.weight !== null ? Number(record.weight) : null,
                    record.height !== null ? Number(record.height) : null,
                    record.bmi !== null ? Number(record.bmi) : null,
                    record.bmiStatus || record.bmi_status || null,
                    record.recordedBy || record.recorded_by || null,
                    record.recordedByName || record.recorded_by_name || null,
                    record.date || '',
                    record.version || 1
                  ]
                );
              }
            }
            await saveDB();
            return records;
          }
        } catch (error) {
          console.warn('API: Failed to fetch vitals online, using SQLite.', error);
        }
      }

      // SQLite Fallback
      try {
        const rows = await executeQuery('SELECT * FROM child_vitals WHERE child_id = ? ORDER BY date DESC, created_at DESC', [childId]);
        return rows.map(row => ({
          id: row.id,
          childId: row.child_id,
          weight: row.weight,
          height: row.height,
          bmi: row.bmi,
          bmiStatus: row.bmi_status,
          recordedBy: row.recorded_by,
          recordedByName: row.recorded_by_name,
          date: row.date,
          createdAt: row.created_at
        }));
      } catch (err) {
        console.error('API: Error fetching vitals from SQLite:', err);
        return [];
      }
    }

    export async function apiSaveVitals(vitalsData) {
      const isOnline = navigator.onLine;
      const id = vitalsData.id || crypto.randomUUID();
      const childId = vitalsData.childId;
      const weight = vitalsData.weight !== undefined && vitalsData.weight !== '' ? Number(vitalsData.weight) : null;
      const height = vitalsData.height !== undefined && vitalsData.height !== '' ? Number(vitalsData.height) : null;
      const bmi = vitalsData.bmi !== undefined && vitalsData.bmi !== '' ? Number(vitalsData.bmi) : null;
      const bmiStatus = vitalsData.bmiStatus || null;
      const recordedBy = vitalsData.recordedBy || null;
      const recordedByName = vitalsData.recordedByName || null;
      const date = vitalsData.date;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.vitals(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, weight, height, bmi, bmiStatus, recordedBy, recordedByName, date })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO child_vitals 
          (id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, weight, height, bmi, bmiStatus, recordedBy, recordedByName, date]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save vitals online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO child_vitals 
      (id, child_id, weight, height, bmi, bmi_status, recorded_by, recorded_by_name, date, version, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, weight, height, bmi, bmiStatus, recordedBy, recordedByName, date]
        );
        await saveDB();
        return { success: true, message: 'Vitals saved offline.' };
      } catch (err) {
        console.error('API: Error caching vitals offline:', err);
        throw err;
      }
    }

    export async function apiFetchNutritionalHistory(childId) {
      return apiFetchVitalsRecords(childId);
    }

    export async function apiFetchMedicationRecords(childId) {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.medications(childId), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            const records = Array.isArray(data) ? data : (data.medications || []);
            for (const record of records) {
              if (record && record.id) {
                await executeRun(
                  `INSERT OR REPLACE INTO medications_given 
              (id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version, sync_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
                  [
                    record.id,
                    childId,
                    record.ntdsMeds || record.ntds_meds || null,
                    record.antibiotics || null,
                    record.otherMeds || record.other_meds || null,
                    record.dateGiven || record.date_given || '',
                    record.recordedBy || record.recorded_by || null,
                    record.recordedByName || record.recorded_by_name || null,
                    record.version || 1
                  ]
                );
              }
            }
            await saveDB();
            return records;
          }
        } catch (error) {
          console.warn('API: Failed to fetch medications online, using SQLite.', error);
        }
      }

      // SQLite Fallback
      try {
        const rows = await executeQuery('SELECT * FROM medications_given WHERE child_id = ? ORDER BY date_given DESC, created_at DESC', [childId]);
        return rows.map(row => ({
          id: row.id,
          childId: row.child_id,
          ntdsMeds: row.ntds_meds,
          antibiotics: row.antibiotics,
          otherMeds: row.other_meds,
          dateGiven: row.date_given,
          recordedBy: row.recorded_by,
          recordedByName: row.recorded_by_name,
          createdAt: row.created_at
        }));
      } catch (err) {
        console.error('API: Error fetching medications from SQLite:', err);
        return [];
      }
    }

    export async function apiSaveMedication(medicationData) {
      const isOnline = navigator.onLine;
      const id = medicationData.id || crypto.randomUUID();
      const childId = medicationData.childId;
      const ntdsMeds = medicationData.ntdsMeds || null;
      const antibiotics = medicationData.antibiotics || null;
      const otherMeds = medicationData.otherMeds || null;
      const dateGiven = medicationData.dateGiven;
      const recordedBy = medicationData.recordedBy || null;
      const recordedByName = medicationData.recordedByName || null;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.medications(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, ntdsMeds, antibiotics, otherMeds, dateGiven, recordedBy, recordedByName })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO medications_given 
          (id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, ntdsMeds, antibiotics, otherMeds, dateGiven, recordedBy, recordedByName]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save medication online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO medications_given 
      (id, child_id, ntds_meds, antibiotics, other_meds, date_given, recorded_by, recorded_by_name, version, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, ntdsMeds, antibiotics, otherMeds, dateGiven, recordedBy, recordedByName]
        );
        await saveDB();
        return { success: true, message: 'Medication saved offline.' };
      } catch (err) {
        console.error('API: Error caching medication offline:', err);
        throw err;
      }
    }

    export async function apiFetchTestsRecords(childId) {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.tests(childId), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            const records = Array.isArray(data) ? data : (data.tests || []);
            for (const record of records) {
              if (record && record.id) {
                await executeRun(
                  `INSERT OR REPLACE INTO laboratory_tests 
              (id, child_id, test_type, result, date, recorded_by, recorded_by_name, version, sync_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
                  [
                    record.id,
                    childId,
                    record.testType || record.test_type || '',
                    record.result || '',
                    record.date || '',
                    record.recordedBy || record.recorded_by || null,
                    record.recordedByName || record.recorded_by_name || null,
                    record.version || 1
                  ]
                );
              }
            }
            await saveDB();
            return records;
          }
        } catch (error) {
          console.warn('API: Failed to fetch tests online, using SQLite.', error);
        }
      }

      // SQLite Fallback
      try {
        const rows = await executeQuery('SELECT * FROM laboratory_tests WHERE child_id = ? ORDER BY date DESC, created_at DESC', [childId]);
        return rows.map(row => ({
          id: row.id,
          childId: row.child_id,
          testType: row.test_type,
          result: row.result,
          date: row.date,
          recordedBy: row.recorded_by,
          recordedByName: row.recorded_by_name,
          createdAt: row.created_at
        }));
      } catch (err) {
        console.error('API: Error fetching laboratory tests from SQLite:', err);
        return [];
      }
    }

    export async function apiFetchTestsHistory(childId) {
      return apiFetchTestsRecords(childId);
    }

    export async function apiSaveTestResult(testsData) {
      const isOnline = navigator.onLine;
      const id = testsData.id || crypto.randomUUID();
      const childId = testsData.childId;
      const testType = testsData.testType;
      const result = testsData.result;
      const date = testsData.date;
      const recordedBy = testsData.recordedBy || null;
      const recordedByName = testsData.recordedByName || null;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.tests(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, testType, result, date, recordedBy, recordedByName })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO laboratory_tests 
          (id, child_id, test_type, result, date, recorded_by, recorded_by_name, version, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, testType, result, date, recordedBy, recordedByName]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save test result online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO laboratory_tests 
      (id, child_id, test_type, result, date, recorded_by, recorded_by_name, version, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, testType, result, date, recordedBy, recordedByName]
        );
        await saveDB();
        return { success: true, message: 'Test saved offline.' };
      } catch (err) {
        console.error('API: Error caching test offline:', err);
        throw err;
      }
    }

    export async function apiSaveMedicalServices(servicesData) {
      const isOnline = navigator.onLine;
      const id = servicesData.id || crypto.randomUUID();
      const childId = servicesData.childId;
      const servicesList = Array.isArray(servicesData.services) ? servicesData.services.join(', ') : servicesData.services;
      const date = servicesData.date;
      const recordedBy = servicesData.recordedBy || null;
      const recordedByName = servicesData.recordedByName || null;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.medicalServices(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, services: servicesData.services, date, recordedBy, recordedByName })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO services_rendered 
          (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
          VALUES (?, ?, 'medical', ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, servicesList, date, recordedBy, recordedByName]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save medical services online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO services_rendered 
      (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
      VALUES (?, ?, 'medical', ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, servicesList, date, recordedBy, recordedByName]
        );
        await saveDB();
        return { success: true, message: 'Medical services saved offline.' };
      } catch (err) {
        console.error('API: Error caching medical services offline:', err);
        throw err;
      }
    }

    export async function apiSaveSocialServices(servicesData) {
      const isOnline = navigator.onLine;
      const id = servicesData.id || crypto.randomUUID();
      const childId = servicesData.childId;
      const servicesList = Array.isArray(servicesData.services) ? servicesData.services.join(', ') : servicesData.services;
      const date = servicesData.date;
      const recordedBy = servicesData.recordedBy || null;
      const recordedByName = servicesData.recordedByName || null;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.socialServices(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, services: servicesData.services, date, recordedBy, recordedByName })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO services_rendered 
          (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
          VALUES (?, ?, 'social', ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, servicesList, date, recordedBy, recordedByName]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save social services online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO services_rendered 
      (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
      VALUES (?, ?, 'social', ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, servicesList, date, recordedBy, recordedByName]
        );
        await saveDB();
        return { success: true, message: 'Social services saved offline.' };
      } catch (err) {
        console.error('API: Error caching social services offline:', err);
        throw err;
      }
    }

    export async function apiSaveEducation(educationData) {
      const isOnline = navigator.onLine;
      const id = educationData.id || crypto.randomUUID();
      const childId = educationData.childId;
      const servicesList = Array.isArray(educationData.education) ? educationData.education.join(', ') : educationData.education;
      const date = educationData.date;
      const recordedBy = educationData.recordedBy || null;
      const recordedByName = educationData.recordedByName || null;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.education(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, education: educationData.education, date, recordedBy, recordedByName })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO services_rendered 
          (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
          VALUES (?, ?, 'education', ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, servicesList, date, recordedBy, recordedByName]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save education online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO services_rendered 
      (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
      VALUES (?, ?, 'education', ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, servicesList, date, recordedBy, recordedByName]
        );
        await saveDB();
        return { success: true, message: 'Education saved offline.' };
      } catch (err) {
        console.error('API: Error caching education offline:', err);
        throw err;
      }
    }

    export async function apiFetchServicesRecords(childId) {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.services(childId), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            const records = Array.isArray(data) ? data : (data.services || []);
            for (const record of records) {
              if (record && record.id) {
                await executeRun(
                  `INSERT OR REPLACE INTO services_rendered 
              (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
                  [
                    record.id,
                    childId,
                    record.serviceType || record.service_type || 'medical',
                    record.servicesList || record.services_list || '',
                    record.date || '',
                    record.recordedBy || record.recorded_by || null,
                    record.recordedByName || record.recorded_by_name || null,
                    record.version || 1
                  ]
                );
              }
            }
            await saveDB();
            return records;
          }
        } catch (error) {
          console.warn('API: Failed to fetch services online, using SQLite.', error);
        }
      }

      // SQLite Fallback
      try {
        const rows = await executeQuery('SELECT * FROM services_rendered WHERE child_id = ? ORDER BY date DESC, created_at DESC', [childId]);
        return rows.map(row => ({
          id: row.id,
          childId: row.child_id,
          serviceType: row.service_type,
          servicesList: row.services_list,
          servicesProvided: row.services_list ? row.services_list.split(',').map(s => s.trim()) : [],
          date: row.date,
          recordedBy: row.recorded_by,
          recordedByName: row.recorded_by_name,
          createdAt: row.created_at
        }));
      } catch (err) {
        console.error('API: Error fetching services from SQLite:', err);
        return [];
      }
    }

    export async function apiFetchEducationHistory(childId) {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.educationHistory(childId), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            const records = Array.isArray(data) ? data : (data.educationHistory || []);
            for (const record of records) {
              if (record && record.id) {
                await executeRun(
                  `INSERT OR REPLACE INTO services_rendered 
              (id, child_id, service_type, services_list, date, recorded_by, recorded_by_name, version, sync_status) 
              VALUES (?, ?, 'education', ?, ?, ?, ?, ?, 'synced')`,
                  [
                    record.id,
                    childId,
                    record.servicesList || record.services_list || record.educationList || '',
                    record.date || '',
                    record.recordedBy || record.recorded_by || null,
                    record.recordedByName || record.recorded_by_name || null,
                    record.version || 1
                  ]
                );
              }
            }
            await saveDB();
            return records;
          }
        } catch (error) {
          console.warn('API: Failed to fetch education history online, using SQLite.', error);
        }
      }

      // SQLite Fallback
      try {
        const rows = await executeQuery("SELECT * FROM services_rendered WHERE child_id = ? AND service_type = 'education' ORDER BY date DESC, created_at DESC", [childId]);
        return rows.map(row => ({
          id: row.id,
          childId: row.child_id,
          serviceType: row.service_type,
          servicesList: row.services_list,
          educationProvided: row.services_list ? row.services_list.split(',').map(s => s.trim()) : [],
          date: row.date,
          recordedBy: row.recorded_by,
          recordedByName: row.recorded_by_name,
          createdAt: row.created_at
        }));
      } catch (err) {
        console.error('API: Error fetching education history from SQLite:', err);
        return [];
      }
    }

    export async function apiFetchSymptomsRecords(childId) {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.symptoms(childId), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            const records = Array.isArray(data) ? data : (data.symptoms || []);
            for (const record of records) {
              if (record && record.id) {
                await executeRun(
                  `INSERT OR REPLACE INTO symptoms_recorded 
              (id, child_id, symptoms, visit_notes, date, recorded_by, recorded_by_name, version, sync_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
                  [
                    record.id,
                    childId,
                    record.symptoms || '',
                    record.visitNotes || record.visit_notes || '',
                    record.date || '',
                    record.recordedBy || record.recorded_by || null,
                    record.recordedByName || record.recorded_by_name || null,
                    record.version || 1
                  ]
                );
              }
            }
            await saveDB();
            return records;
          }
        } catch (error) {
          console.warn('API: Failed to fetch symptoms online, using SQLite.', error);
        }
      }

      // SQLite Fallback
      try {
        const rows = await executeQuery('SELECT * FROM symptoms_recorded WHERE child_id = ? ORDER BY date DESC, created_at DESC', [childId]);
        return rows.map(row => ({
          id: row.id,
          childId: row.child_id,
          symptoms: row.symptoms,
          visitNotes: row.visit_notes,
          date: row.date,
          recordedBy: row.recorded_by,
          recordedByName: row.recorded_by_name,
          createdAt: row.created_at
        }));
      } catch (err) {
        console.error('API: Error fetching symptoms from SQLite:', err);
        return [];
      }
    }

    export async function apiSaveSymptoms(symptomsData) {
      const isOnline = navigator.onLine;
      const id = symptomsData.id || crypto.randomUUID();
      const childId = symptomsData.childId;
      const symptoms = symptomsData.symptoms || null;
      const visitNotes = symptomsData.visitNotes || null;
      const date = symptomsData.date;
      const recordedBy = symptomsData.recordedBy || null;
      const recordedByName = symptomsData.recordedByName || null;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.symptoms(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, symptoms, visitNotes, date, recordedBy, recordedByName })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO symptoms_recorded 
          (id, child_id, symptoms, visit_notes, date, recorded_by, recorded_by_name, version, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, symptoms, visitNotes, date, recordedBy, recordedByName]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save symptoms online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO symptoms_recorded 
      (id, child_id, symptoms, visit_notes, date, recorded_by, recorded_by_name, version, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, symptoms, visitNotes, date, recordedBy, recordedByName]
        );
        await saveDB();
        return { success: true, message: 'Symptoms saved offline.' };
      } catch (err) {
        console.error('API: Error caching symptoms offline:', err);
        throw err;
      }
    }

    export async function apiFetchClothingRecords(childId) {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.clothing(childId), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            const records = Array.isArray(data) ? data : (data.clothing || []);
            for (const record of records) {
              if (record && record.id) {
                await executeRun(
                  `INSERT OR REPLACE INTO clothing_provisions 
              (id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version, sync_status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
                  [
                    record.id,
                    childId,
                    record.shoes || '',
                    record.clothes || '',
                    record.date || '',
                    record.recordedBy || record.recorded_by || null,
                    record.recordedByName || record.recorded_by_name || null,
                    record.version || 1
                  ]
                );
              }
            }
            await saveDB();
            return records;
          }
        } catch (error) {
          console.warn('API: Failed to fetch clothing online, using SQLite.', error);
        }
      }

      // SQLite Fallback
      try {
        const rows = await executeQuery('SELECT * FROM clothing_provisions WHERE child_id = ? ORDER BY date DESC, created_at DESC', [childId]);
        return rows.map(row => ({
          id: row.id,
          childId: row.child_id,
          shoes: row.shoes,
          clothes: row.clothes,
          date: row.date,
          recordedBy: row.recorded_by,
          recordedByName: row.recorded_by_name,
          createdAt: row.created_at
        }));
      } catch (err) {
        console.error('API: Error fetching clothing from SQLite:', err);
        return [];
      }
    }

    export async function apiSaveClothing(clothingData) {
      const isOnline = navigator.onLine;
      const id = clothingData.id || crypto.randomUUID();
      const childId = clothingData.childId;
      const shoes = clothingData.shoes || null;
      const clothes = clothingData.clothes || null;
      const date = clothingData.date;
      const recordedBy = clothingData.recordedBy || null;
      const recordedByName = clothingData.recordedByName || null;

      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.clothing(childId), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, childId, shoes, clothes, date, recordedBy, recordedByName })
          });
          if (response.ok) {
            await executeRun(
              `INSERT OR REPLACE INTO clothing_provisions 
          (id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced')`,
              [id, childId, shoes, clothes, date, recordedBy, recordedByName]
            );
            await saveDB();
            return await response.json();
          }
        } catch (error) {
          console.warn('API: Failed to save clothing online, caching locally...', error);
        }
      }

      // Caching offline
      try {
        await executeRun(
          `INSERT OR REPLACE INTO clothing_provisions 
      (id, child_id, shoes, clothes, date, recorded_by, recorded_by_name, version, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'local_created')`,
          [id, childId, shoes, clothes, date, recordedBy, recordedByName]
        );
        await saveDB();
        return { success: true, message: 'Clothing saved offline.' };
      } catch (err) {
        console.error('API: Error caching clothing offline:', err);
        throw err;
      }
    }

    /* ==========================================
       5. USERS, ROLES, PERMISSIONS API (REST + Cache)
       ========================================== */

    export async function getUsers() {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.users, {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const users = await response.json();
            for (const u of users) {
              const existing = await executeQuery('SELECT password_hash FROM staff_users WHERE id = ?', [u.id]);
              const pwdHash = existing.length > 0 ? existing[0].password_hash : '';
              
              await executeRun(
                `INSERT OR REPLACE INTO staff_users 
                (id, username, email, password_hash, role_id, first_name, last_name, phone_number, version, is_dirty, sync_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
                [
                  u.id,
                  u.username,
                  u.email,
                  pwdHash,
                  u.roleId || u.role_id || '',
                  u.firstName || u.first_name || '',
                  u.lastName || u.last_name || '',
                  u.phoneNumber || u.phone_number || '',
                  u.version || 1
                ]
              );
            }
            await saveDB();
            return users;
          }
        } catch (error) {
          console.warn('API: Failed to fetch users online, trying SQLite cache fallback...', error);
        }
      }

      try {
        const localUsers = await executeQuery("SELECT * FROM staff_users");
        const localRoles = await executeQuery("SELECT * FROM roles");
        const roleMap = {};
        localRoles.forEach(r => {
          roleMap[r.id] = r.name;
        });

        return localUsers.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          roleId: u.role_id,
          role_id: u.role_id,
          roleName: roleMap[u.role_id] || 'Unknown',
          firstName: u.first_name,
          first_name: u.first_name,
          lastName: u.last_name,
          last_name: u.last_name,
          phoneNumber: u.phone_number,
          phone_number: u.phone_number,
          version: u.version
        }));
      } catch (err) {
        console.error('API: Error fetching users from SQLite:', err);
        return [];
      }
    }

    export async function getRoles() {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.roles, {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const roles = await response.json();
            for (const role of roles) {
              await executeRun(
                "INSERT OR REPLACE INTO roles (id, name, description, version, is_dirty, sync_status) VALUES (?, ?, ?, ?, 0, 'synced')",
                [role.id, role.name, role.description || '', role.version || 1]
              );
            }
            await saveDB();
            return roles;
          }
        } catch (error) {
          console.warn('API: Failed to fetch roles online, trying SQLite cache fallback...', error);
        }
      }

      try {
        const localRoles = await executeQuery("SELECT * FROM roles");
        return localRoles.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          version: r.version
        }));
      } catch (err) {
        console.error('API: Error fetching roles from SQLite:', err);
        return [];
      }
    }

    export async function getPermissions() {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.permissions, {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const permissions = await response.json();
            for (const perm of permissions) {
              await executeRun(
                "INSERT OR REPLACE INTO permissions (id, slug, description, category_id) VALUES (?, ?, ?, ?)",
                [perm.id, perm.slug, perm.description || '', perm.categoryId || perm.category_id || null]
              );
            }
            await saveDB();
            return permissions;
          }
        } catch (error) {
          console.warn('API: Failed to fetch permissions online, trying SQLite cache fallback...', error);
        }
      }

      try {
        const localPerms = await executeQuery("SELECT * FROM permissions");
        return localPerms.map(p => ({
          id: p.id,
          slug: p.slug,
          description: p.description,
          categoryId: p.category_id,
          category_id: p.category_id
        }));
      } catch (err) {
        console.error('API: Error fetching permissions from SQLite:', err);
        return [];
      }
    }

    export async function getPermissionCategories() {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.permissionCategories, {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const categories = await response.json();
            for (const cat of categories) {
              await executeRun(
                "INSERT OR REPLACE INTO permission_categories (id, name, description) VALUES (?, ?, ?)",
                [cat.id, cat.name, cat.description || '']
              );
            }
            await saveDB();
            return categories;
          }
        } catch (error) {
          console.warn('API: Failed to fetch permission categories online, trying SQLite cache fallback...', error);
        }
      }

      try {
        const localCats = await executeQuery("SELECT * FROM permission_categories");
        return localCats.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description
        }));
      } catch (err) {
        console.error('API: Error fetching permission categories from SQLite:', err);
        return [];
      }
    }

    export async function getOnlineUsersCount() {
      const isOnline = navigator.onLine;
      if (isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.onlineUsers, {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            return data.count || data.length || 0;
          }
        } catch (error) {
          console.warn('API: Failed to fetch online users count online, defaulting to 1...', error);
        }
      }
      return 1; // Default to 1 logged in user when offline
    }
