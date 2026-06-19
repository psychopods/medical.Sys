type SyncWorkerConfig = {
    apiBaseUrl: string;
    accessToken: string;
    pollIntervalMs?: number;
};

type PendingChanges = {
    childrenProfiles?: unknown[];
    biometricFingerprints?: unknown[];
};

type InitMessage = { type: 'INIT'; payload: SyncWorkerConfig };
type NetworkMessage = { type: 'NETWORK_STATUS'; payload: { online: boolean } };
type RunSyncMessage = { type: 'RUN_SYNC'; payload: { since?: string; pending?: PendingChanges } };
type StopMessage = { type: 'STOP' };
type WorkerInboundMessage = InitMessage | NetworkMessage | RunSyncMessage | StopMessage;

type WorkerOutboundMessage =
    | { type: 'READY' }
    | { type: 'SYNC_STATUS'; payload: { state: 'idle' | 'running' | 'offline'; message: string } }
    | { type: 'SYNC_RESULT'; payload: { serverTime?: string; delta?: unknown; pushResult?: unknown } }
    | { type: 'SYNC_ERROR'; payload: { message: string } };

let config: SyncWorkerConfig | null = null;
let isOnline = true;
let timer: number | null = null;
let isRunning = false;
let lastSince: string | undefined;
let pendingQueue: PendingChanges = {};

function post(message: WorkerOutboundMessage): void {
    self.postMessage(message);
}

async function postJson(path: string, body: unknown): Promise<unknown> {
    if (!config) {
        throw new Error('Sync worker is not initialized.');
    }

    const response = await fetch(`${config.apiBaseUrl}${path}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${config.accessToken}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`POST ${path} failed (${response.status}): ${text}`);
    }

    return response.json();
}

async function getJson(path: string): Promise<unknown> {
    if (!config) {
        throw new Error('Sync worker is not initialized.');
    }

    const response = await fetch(`${config.apiBaseUrl}${path}`, {
        method: 'GET',
        headers: {
            authorization: `Bearer ${config.accessToken}`
        }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GET ${path} failed (${response.status}): ${text}`);
    }

    return response.json();
}

function mergePending(source: PendingChanges): void {
    const children = source.childrenProfiles ?? [];
    const biometrics = source.biometricFingerprints ?? [];
    pendingQueue.childrenProfiles = [...(pendingQueue.childrenProfiles ?? []), ...children];
    pendingQueue.biometricFingerprints = [...(pendingQueue.biometricFingerprints ?? []), ...biometrics];
}

async function runSyncOnce(explicitSince?: string): Promise<void> {
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

        let pushResult: unknown;
        const pendingChildren = pendingQueue.childrenProfiles ?? [];
        const pendingBiometrics = pendingQueue.biometricFingerprints ?? [];

        if (pendingChildren.length > 0 || pendingBiometrics.length > 0) {
            // Snapshot and clear the queue before making the async network call
            pendingQueue = {};
            try {
                pushResult = await postJson('/api/sync/push', {
                    childrenProfiles: pendingChildren,
                    biometricFingerprints: pendingBiometrics
                });
            } catch (pushError) {
                // Restore pending queue items to avoid data loss
                pendingQueue.childrenProfiles = [...pendingChildren, ...(pendingQueue.childrenProfiles ?? [])];
                pendingQueue.biometricFingerprints = [...pendingBiometrics, ...(pendingQueue.biometricFingerprints ?? [])];
                throw pushError;
            }
        }

        const since = explicitSince ?? lastSince;
        const delta = await getJson(`/api/sync/delta${since ? `?since=${encodeURIComponent(since)}` : ''}`);
        const serverTime = typeof delta === 'object' && delta && 'serverTime' in delta
            ? String((delta as { serverTime: unknown }).serverTime)
            : new Date().toISOString();
        lastSince = serverTime;

        post({ type: 'SYNC_RESULT', payload: { pushResult, delta, serverTime } });
        post({ type: 'SYNC_STATUS', payload: { state: 'idle', message: 'Synchronization completed.' } });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown sync failure.';
        post({ type: 'SYNC_ERROR', payload: { message } });
    } finally {
        isRunning = false;
    }
}

function startTimer(): void {
    if (!config || timer !== null) {
        return;
    }

    const pollIntervalMs = config.pollIntervalMs ?? 30_000;
    timer = self.setInterval(() => {
        void runSyncOnce();
    }, pollIntervalMs);
}

function stopTimer(): void {
    if (timer !== null) {
        self.clearInterval(timer);
        timer = null;
    }
}

self.onmessage = (event: MessageEvent<WorkerInboundMessage>): void => {
    const message = event.data;

    if (message.type === 'INIT') {
        config = message.payload;
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
