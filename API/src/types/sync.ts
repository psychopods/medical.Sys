export interface SyncChildProfilePayload {
    id: string;
    customSerialId: string;
    fullName: string;
    gender: 'Male' | 'Female' | 'Unknown';
    estimatedBirthYear: number | null;
    primaryLocationId: string;
    createdByStaffId: string;
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

export interface SyncPushRequestBody {
    childrenProfiles?: SyncChildProfilePayload[];
    biometricFingerprints?: SyncBiometricPayload[];
}

export interface SyncDeltaQuery {
    since?: string;
}

export interface SyncConflict {
    domain: 'children_profiles' | 'biometric_fingerprints';
    id: string;
    reason: string;
}
