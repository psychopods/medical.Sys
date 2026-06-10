import { executeQuery, executeRun, executeBatch, saveDB } from './db.js';
import bcrypt from 'bcryptjs';

export const API_BASE_URL = 'http://localhost:9865';

// Helper to get authorization headers
export function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Convert camelCase object from Sync API to SQLite snake_case child record
function childToDb(c) {
  return [
    c.id,
    c.customSerialId,
    c.fullName,
    c.gender,
    c.estimatedBirthYear || null,
    c.primaryLocationId,
    c.createdByStaffId,
    c.image1 || null,
    c.image2 || null,
    c.image3 || null,
    c.version || 1,
    c.is_dirty ?? 0,
    c.sync_status ?? 'synced'
  ];
}

// Convert SQLite child row to camelCase object
function dbToChild(row) {
  return {
    id: row.id,
    customSerialId: row.custom_serial_id,
    fullName: row.full_name,
    gender: row.gender,
    estimatedBirthYear: row.estimated_birth_year,
    primaryLocationId: row.primary_location_id,
    createdByStaffId: row.created_by_staff_id,
    image1: row.image1,
    image2: row.image2,
    image3: row.image3,
    version: row.version,
    createdAt: row.created_at,
    fingerprintCaptured: row.fingerprintCaptured === 1 || row.fingerprintCaptured === true || !!row.fingerprintCaptured
  };
}

// Convert camelCase biometric from Sync API to SQLite snake_case record
function biometricToDb(b) {
  return [
    b.id,
    b.childId,
    b.fingerIndex,
    b.templateBase64,
    b.qualityScore || null,
    b.status || 'PENDING',
    b.version || 1,
    b.is_dirty ?? 0,
    b.sync_status ?? 'synced'
  ];
}

// Convert SQLite biometric row to camelCase object
function dbToBiometric(row) {
  return {
    id: row.id,
    childId: row.child_id,
    fingerIndex: row.finger_index,
    templateBase64: row.template_data,
    qualityScore: row.quality_score,
    status: row.status,
    version: row.version
  };
}

// Convert Sync API notification to SQLite record
function notificationToDb(n) {
  return [
    n.id,
    n.type,
    n.title,
    n.message,
    n.targetType || 'ALL',
    n.targetRoleId || null,
    n.targetUserId || null,
    n.createdByStaffId || null,
    n.expiresAt || null,
    n.version || 1,
    0, // is_dirty
    'synced' // sync_status
  ];
}

// Convert SQLite notification row to camelCase object
function dbToNotification(row) {
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
    createdAt: row.created_at
  };
}

/* ==========================================
   1. AUTHENTICATION & LOGIN (OFFLINE-SUPPORT)
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
        console.log('API: Online login successful. Caching session in SQLite...');
        const user = data.user;
        const session = data.session;

        // Hash password on client so we can verify offline
        const clientHash = bcrypt.hashSync(password, 10);

        // Store user in local SQLite staff_users
        await executeRun(
          `INSERT OR REPLACE INTO staff_users 
          (id, username, email, password_hash, role_id, first_name, last_name, phone_number, version, is_dirty, sync_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
          [user.id, user.username, user.email, clientHash, user.role_id, user.first_name, user.last_name, user.phone_number || '', user.version || 1]
        );

        // Cache active session in local_auth_sessions
        await executeRun(
          `INSERT OR REPLACE INTO local_auth_sessions 
          (id, staff_user_id, username, email, role_id, access_token, permission_cache_json, issued_at, expires_at, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            session.id || crypto.randomUUID(),
            user.id,
            user.username,
            user.email,
            user.role_id,
            data.token,
            JSON.stringify(user.permissions),
            new Date().toISOString(),
            session.expiresAt || new Date(Date.now() + 86400000).toISOString()
          ]
        );

        // Trigger sync delta immediately on login to pull down changes
        setTimeout(() => triggerSync(), 1000);

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

  // Get last session
  const sessions = await executeQuery(
    `SELECT * FROM local_auth_sessions WHERE staff_user_id = ? AND is_active = 1 ORDER BY expires_at DESC LIMIT 1`,
    [cachedUser.id]
  );

  if (sessions.length === 0) {
    throw new Error('No local session found. Please log in online first.');
  }

  const cachedSession = sessions[0];
  const permissions = JSON.parse(cachedSession.permission_cache_json);
  const mappedRole = cachedUser.role_id === '22222222-2222-4222-8222-222222222221' ? 'superuser' : 'nurse';

  console.log('API: Offline login successful.');
  return {
    success: true,
    token: cachedSession.access_token,
    accessToken: cachedSession.access_token,
    user: {
      id: cachedUser.id,
      user_id: cachedUser.id,
      username: cachedUser.username,
      email: cachedUser.email,
      role_id: cachedUser.role_id,
      first_name: cachedUser.first_name,
      last_name: cachedUser.last_name,
      phone_number: cachedUser.phone_number,
      role: mappedRole,
      permissions: permissions
    }
  };
}

/* ==========================================
   2. DATA CRUD OPERATIONS (OFFLINE-FIRST)
   ========================================== */

// 2a. Locations
export async function getLocations() {
  // Pull locations online if available and cache them
  if (navigator.onLine) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const locations = Array.isArray(data) ? data : (data.locations || []);
        for (const loc of locations) {
          await executeRun(
            `INSERT OR REPLACE INTO child_locations (id, name, description, version, is_dirty, sync_status) 
             VALUES (?, ?, ?, ?, 0, 'synced')`,
            [loc.id, loc.name, loc.description || '', loc.version || 1]
          );
        }
      }
    } catch (e) {
      console.warn('API: Failed to cache online locations, using SQLite cache.', e);
    }
  }

  // Query local child_locations
  const rows = await executeQuery('SELECT * FROM child_locations ORDER BY name ASC');
  return rows;
}

// 2b. Children profiles
export async function getChildren() {
  // Query local children and join with fingerprint existence check
  const rows = await executeQuery(
    `SELECT cp.*, EXISTS(SELECT 1 FROM biometric_fingerprints bf WHERE bf.child_id = cp.id) AS fingerprintCaptured 
     FROM children_profiles cp 
     ORDER BY cp.created_at DESC`
  );
  return rows.map(dbToChild);
}

export async function registerChild(child) {
  const currentUserId = localStorage.getItem('userId') || '33333333-3333-4333-8333-333333333331';
  const childId = child.id || crypto.randomUUID();

  // Insert locally
  await executeRun(
    `INSERT INTO children_profiles 
    (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, version, is_dirty, sync_status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
    [
      childId,
      child.customSerialId,
      child.fullName,
      child.gender,
      child.estimatedBirthYear ? parseInt(child.estimatedBirthYear) : null,
      child.primaryLocationId,
      currentUserId
    ]
  );

  // Trigger sync in background
  triggerSync();

  return {
    success: true,
    child: {
      id: childId,
      ...child
    }
  };
}

// 2c. Biometrics
export async function getBiometricsForChild(childId) {
  const rows = await executeQuery(
    'SELECT * FROM biometric_fingerprints WHERE child_id = ? ORDER BY finger_index ASC',
    [childId]
  );
  return rows.map(dbToBiometric);
}

export async function enrollBiometric(bio) {
  const bioId = bio.id || crypto.randomUUID();

  await executeRun(
    `INSERT OR REPLACE INTO biometric_fingerprints 
    (id, child_id, finger_index, template_data, quality_score, status, version, is_dirty, sync_status) 
    VALUES (?, ?, ?, ?, ?, ?, 1, 1, 'local_created')`,
    [
      bioId,
      bio.childId,
      bio.fingerIndex || 1,
      bio.templateBase64,
      bio.qualityScore || 80,
      bio.status || 'PENDING'
    ]
  );

  triggerSync();

  return {
    success: true,
    biometric: {
      id: bioId,
      ...bio
    }
  };
}

// 2d. Notifications
export async function getNotifications() {
  const rows = await executeQuery('SELECT * FROM notifications ORDER BY created_at DESC');
  return rows.map(dbToNotification);
}

export async function markNotificationRead(notificationId, staffUserId) {
  await executeRun(
    `INSERT OR REPLACE INTO notification_reads (notification_id, staff_user_id, read_at, is_dirty, sync_status) 
     VALUES (?, ?, ?, 1, 'local_created')`,
    [notificationId, staffUserId, new Date().toISOString()]
  );

  triggerSync();
}

// 2e. Public forms (Contact / Volunteer) with background retry
export async function submitContactForm(form) {
  const id = crypto.randomUUID();
  if (navigator.onLine) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) return { success: true };
    } catch (e) {
      console.warn('API: Failed to submit contact online. Queuing locally.');
    }
  }

  // Queue in SQLite contact_submissions
  await executeRun(
    `INSERT INTO contact_submissions (id, full_name, email_address, message_subject, message_content) 
     VALUES (?, ?, ?, ?, ?)`,
    [id, form.full_name, form.email_address, form.message_subject, form.message_content]
  );
  return { success: true, queued: true };
}

export async function submitVolunteerApplication(form) {
  const id = crypto.randomUUID();
  if (navigator.onLine) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/volunteer/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) return { success: true };
    } catch (e) {
      console.warn('API: Failed to submit volunteer online. Queuing locally.');
    }
  }

  // Queue in SQLite volunteer_applications
  await executeRun(
    `INSERT INTO volunteer_applications (id, full_name, email_address, phone_number, volunteer_type, message) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, form.full_name, form.email_address, form.phone_number, form.volunteer_type, form.message]
  );
  return { success: true, queued: true };
}

/* ==========================================
   3. BACKGROUND SYNC COORDINATOR
   ========================================== */

let syncWorker = null;
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
  if (syncWorker) return;

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    updateSyncStatus('idle', 'Not logged in. Sync disabled.');
    return;
  }

  console.log('API: Initializing background sync Web Worker...');
  syncWorker = new Worker('/workers/syncWorker.js');

  // Load last serverTime/since timestamp if saved
  const lastSince = localStorage.getItem('last_sync_since') || null;

  syncWorker.postMessage({
    type: 'INIT',
    payload: {
      apiBaseUrl: API_BASE_URL,
      accessToken: token,
      pollIntervalMs: 30000,
      since: lastSince
    }
  });

  syncWorker.onmessage = async (event) => {
    const message = event.data;

    if (message.type === 'SYNC_STATUS') {
      updateSyncStatus(message.payload.state, message.payload.message);
    } else if (message.type === 'SYNC_RESULT') {
      const { delta, serverTime } = message.payload;
      if (delta) {
        await applyDelta(delta);
      }
      if (serverTime) {
        localStorage.setItem('last_sync_since', serverTime);
      }
      updateSyncStatus('idle', `Sync complete. Last sync: ${new Date().toLocaleTimeString()}`);
    } else if (message.type === 'SYNC_ERROR') {
      updateSyncStatus('idle', `Sync error: ${message.payload.message}`);
    }
  };

  // Monitor network connection status
  window.addEventListener('online', () => {
    syncWorker.postMessage({ type: 'NETWORK_STATUS', payload: { online: true } });
    flushPublicQueues();
  });

  window.addEventListener('offline', () => {
    syncWorker.postMessage({ type: 'NETWORK_STATUS', payload: { online: false } });
  });
}

// Gathers dirty records, maps them, and sends RUN_SYNC to worker
export async function triggerSync() {
  if (!syncWorker) {
    initSyncWorker();
    if (!syncWorker) return;
  }

  updateSyncStatus('running', 'Syncing local changes...');

  try {
    // 1. Gather dirty children
    const dirtyChildren = await executeQuery('SELECT * FROM children_profiles WHERE is_dirty = 1');
    const mappedChildren = dirtyChildren.map(row => ({
      id: row.id,
      customSerialId: row.custom_serial_id,
      fullName: row.full_name,
      gender: row.gender,
      estimatedBirthYear: row.estimated_birth_year,
      primaryLocationId: row.primary_location_id,
      createdByStaffId: row.created_by_staff_id,
      version: row.version
    }));

    // 2. Gather dirty biometrics
    const dirtyBiometrics = await executeQuery('SELECT * FROM biometric_fingerprints WHERE is_dirty = 1');
    const mappedBiometrics = dirtyBiometrics.map(row => ({
      id: row.id,
      childId: row.child_id,
      fingerIndex: row.finger_index,
      templateBase64: row.template_data,
      qualityScore: row.quality_score,
      status: row.status,
      version: row.version
    }));

    // 3. Gather dirty reads
    const dirtyReads = await executeQuery('SELECT * FROM notification_reads WHERE is_dirty = 1');
    const mappedReads = dirtyReads.map(row => ({
      notificationId: row.notification_id,
      staffUserId: row.staff_user_id,
      readAt: row.read_at
    }));

    syncWorker.postMessage({
      type: 'RUN_SYNC',
      payload: {
        pending: {
          childrenProfiles: mappedChildren,
          biometricFingerprints: mappedBiometrics,
          notificationReads: mappedReads
        }
      }
    });
  } catch (error) {
    console.error('API: Failed to trigger sync:', error);
    updateSyncStatus('idle', `Sync trigger failed: ${error.message}`);
  }
}

// Apply delta response from server into local SQLite
async function applyDelta(delta) {
  const children = delta.childrenProfiles || [];
  const biometrics = delta.biometricFingerprints || [];
  const notifications = delta.notifications || [];

  console.log(`API: Applying sync delta: ${children.length} children, ${biometrics.length} biometrics, ${notifications.length} notifications`);

  // Apply Children
  for (const c of children) {
    await executeRun(
      `INSERT OR REPLACE INTO children_profiles 
      (id, custom_serial_id, full_name, gender, estimated_birth_year, primary_location_id, created_by_staff_id, image1, image2, image3, version, is_dirty, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
      childToDb(c)
    );
  }

  // Apply Biometrics
  for (const b of biometrics) {
    await executeRun(
      `INSERT OR REPLACE INTO biometric_fingerprints 
      (id, child_id, finger_index, template_data, quality_score, status, version, is_dirty, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
      biometricToDb(b)
    );
  }

  // Apply Notifications
  for (const n of notifications) {
    await executeRun(
      `INSERT OR REPLACE INTO notifications 
      (id, type, title, message, target_type, target_role_id, target_user_id, created_by_staff_id, expires_at, version, is_dirty, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
      notificationToDb(n)
    );
  }

  // Clear is_dirty for notification_reads that were successfully synced
  // (Since server doesn't return notification reads in delta, we mark local reads as synced once we successfully complete sync)
  await executeRun("UPDATE notification_reads SET is_dirty = 0, sync_status = 'synced' WHERE is_dirty = 1");

  await saveDB();
}

// Flush local queued public forms (Contact / Volunteer) when connection recovers
async function flushPublicQueues() {
  if (!navigator.onLine) return;

  // Flush Contact Submissions
  try {
    const contacts = await executeQuery('SELECT * FROM contact_submissions');
    for (const c of contacts) {
      const res = await fetch(`${API_BASE_URL}/api/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: c.full_name,
          email_address: c.email_address,
          message_subject: c.message_subject,
          message_content: c.message_content
        })
      });
      if (res.ok) {
        await executeRun('DELETE FROM contact_submissions WHERE id = ?', [c.id]);
      }
    }
  } catch (e) {
    console.error('API: Error flushing contact submissions:', e);
  }

  // Flush Volunteer Applications
  try {
    const volunteers = await executeQuery('SELECT * FROM volunteer_applications');
    for (const v of volunteers) {
      const res = await fetch(`${API_BASE_URL}/api/volunteer/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: v.full_name,
          email_address: v.email_address,
          phone_number: v.phone_number,
          volunteer_type: v.volunteer_type,
          message: v.message
        })
      });
      if (res.ok) {
        await executeRun('DELETE FROM volunteer_applications WHERE id = ?', [v.id]);
      }
    }
  } catch (e) {
    console.error('API: Error flushing volunteer applications:', e);
  }
}
