export interface SyncChildProfilePayload {
    id: string;
    customSerialId: string;
    fullName: string;
    gender: 'Male' | 'Female';
    estimatedBirthYear: number | null;
    primaryLocationId: string;
    createdByStaffId: string;
    image1?: string | null;
    image2?: string | null;
    image3?: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncBiometricPayload {
    id: string;
    childId: string;
    fingerIndex: number;
    templateBase64: string;
    qualityScore: number | null;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    version: number;
    lastModifiedAt?: string;
}

export interface SyncNotificationPayload {
    id: string;
    type: 'SYSTEM' | 'ANNOUNCEMENT' | 'EVENT';
    title: string;
    message: string;
    targetType: 'ALL' | 'ROLE' | 'USER';
    targetRoleId: string | null;
    targetUserId: string | null;
    createdByStaffId: string | null;
    expiresAt: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncNotificationReadPayload {
    notificationId: string;
    staffUserId: string;
    readAt: string;
}

export interface SyncPushRequestBody {
    childrenProfiles?: SyncChildProfilePayload[];
    biometricFingerprints?: SyncBiometricPayload[];
    notificationReads?: SyncNotificationReadPayload[];
}

export interface SyncDeltaQuery {
    since?: string;
}

export interface SyncConflict {
    domain: 'children_profiles' | 'biometric_fingerprints' | 'notification_reads';
    id: string;
    reason: string;
}

