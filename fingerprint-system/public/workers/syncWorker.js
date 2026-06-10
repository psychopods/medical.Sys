let config = null;
let isOnline = true;
let timer = null;
let isRunning = false;
let lastSince = null;
let pendingQueue = {
  childrenProfiles: [],
  biometricFingerprints: [],
  notificationReads: []
};

function post(message) {
  self.postMessage(message);
}

async function postJson(path, body) {
  if (!config) {
    throw new Error('Sync worker is not initialized.');
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${config.accessToken}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST ${path} failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function getJson(path) {
  if (!config) {
    throw new Error('Sync worker is not initialized.');
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: 'GET',
    headers: {
      'authorization': `Bearer ${config.accessToken}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${path} failed (${response.status}): ${text}`);
  }

  return response.json();
}

function mergePending(source) {
  if (source.childrenProfiles) {
    pendingQueue.childrenProfiles = [...pendingQueue.childrenProfiles, ...source.childrenProfiles];
  }
  if (source.biometricFingerprints) {
    pendingQueue.biometricFingerprints = [...pendingQueue.biometricFingerprints, ...source.biometricFingerprints];
  }
  if (source.notificationReads) {
    pendingQueue.notificationReads = [...pendingQueue.notificationReads, ...source.notificationReads];
  }
}

async function runSyncOnce(explicitSince) {
  if (isRunning) {
    return;
  }

  isRunning = true;
  post({ type: 'SYNC_STATUS', payload: { state: 'running', message: 'Synchronization started.' } });

  try {
    if (!config) {
      throw new Error('Sync worker is not initialized.');
    }
    if (!isOnline) {
      post({ type: 'SYNC_STATUS', payload: { state: 'offline', message: 'Network offline. Sync paused.' } });
      return;
    }

    let pushResult = null;
    const pendingChildren = pendingQueue.childrenProfiles;
    const pendingBiometrics = pendingQueue.biometricFingerprints;
    const pendingReads = pendingQueue.notificationReads;

    if (pendingChildren.length > 0 || pendingBiometrics.length > 0 || pendingReads.length > 0) {
      // Snapshot and clear the queue before making the network call
      pendingQueue = {
        childrenProfiles: [],
        biometricFingerprints: [],
        notificationReads: []
      };

      try {
        pushResult = await postJson('/api/sync/push', {
          childrenProfiles: pendingChildren,
          biometricFingerprints: pendingBiometrics,
          notificationReads: pendingReads
        });
      } catch (pushError) {
        // Restore pending items to queue on error to avoid data loss
        pendingQueue.childrenProfiles = [...pendingChildren, ...pendingQueue.childrenProfiles];
        pendingQueue.biometricFingerprints = [...pendingBiometrics, ...pendingQueue.biometricFingerprints];
        pendingQueue.notificationReads = [...pendingReads, ...pendingQueue.notificationReads];
        throw pushError;
      }
    }

    const since = explicitSince ?? lastSince;
    const delta = await getJson(`/api/sync/delta${since ? `?since=${encodeURIComponent(since)}` : ''}`);
    
    const serverTime = typeof delta === 'object' && delta && 'serverTime' in delta
      ? String(delta.serverTime)
      : new Date().toISOString();
    
    lastSince = serverTime;

    post({ type: 'SYNC_RESULT', payload: { pushResult, delta, serverTime } });
    post({ type: 'SYNC_STATUS', payload: { state: 'idle', message: 'Synchronization completed.' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync failure.';
    post({ type: 'SYNC_ERROR', payload: { message } });
    post({ type: 'SYNC_STATUS', payload: { state: 'idle', message: `Sync error: ${message}` } });
  } finally {
    isRunning = false;
  }
}

function startTimer() {
  if (!config || timer !== null) {
    return;
  }

  const pollIntervalMs = config.pollIntervalMs ?? 30_000;
  timer = self.setInterval(() => {
    void runSyncOnce();
  }, pollIntervalMs);
}

function stopTimer() {
  if (timer !== null) {
    self.clearInterval(timer);
    timer = null;
  }
}

self.onmessage = (event) => {
  const message = event.data;

  if (message.type === 'INIT') {
    config = message.payload;
    if (message.payload.since) {
      lastSince = message.payload.since;
    }
    startTimer();
    post({ type: 'READY' });
    return;
  }

  if (message.type === 'NETWORK_STATUS') {
    isOnline = message.payload.online;
    if (isOnline) {
      void runSyncOnce();
    } else {
      post({ type: 'SYNC_STATUS', payload: { state: 'offline', message: 'Worker marked offline.' } });
    }
    return;
  }

  if (message.type === 'RUN_SYNC') {
    if (message.payload.pending) {
      mergePending(message.payload.pending);
    }
    void runSyncOnce(message.payload.since);
    return;
  }

  if (message.type === 'STOP') {
    stopTimer();
    post({ type: 'SYNC_STATUS', payload: { state: 'idle', message: 'Worker stopped.' } });
  }
};
