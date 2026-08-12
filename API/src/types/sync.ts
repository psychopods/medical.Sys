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

export interface SyncMedicalBaselinePayload {
    id: string;
    childId: string;
    visitDate: string;
    firstVisit: number;
    recordedBy?: string | null;
    recordedByName?: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncChildVitalsPayload {
    id: string;
    childId: string;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    bmiStatus?: string | null;
    recordedBy?: string | null;
    recordedByName?: string | null;
    date: string;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncMedicationsGivenPayload {
    id: string;
    childId: string;
    ntdsMeds?: string | null;
    antibiotics?: string | null;
    otherMeds?: string | null;
    dateGiven: string;
    recordedBy?: string | null;
    recordedByName?: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncLaboratoryTestsPayload {
    id: string;
    childId: string;
    testType: string;
    result: string;
    date: string;
    recordedBy?: string | null;
    recordedByName?: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncServicesRenderedPayload {
    id: string;
    childId: string;
    serviceType: string;
    servicesList: string;
    date: string;
    recordedBy?: string | null;
    recordedByName?: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncSymptomsRecordedPayload {
    id: string;
    childId: string;
    symptoms?: string | null;
    visitNotes?: string | null;
    date: string;
    recordedBy?: string | null;
    recordedByName?: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncClothingProvisionsPayload {
    id: string;
    childId: string;
    shoes?: string | null;
    clothes?: string | null;
    date: string;
    recordedBy?: string | null;
    recordedByName?: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface SyncPushRequestBody {
    childrenProfiles?: SyncChildProfilePayload[];
    biometricFingerprints?: SyncBiometricPayload[];
    notificationReads?: SyncNotificationReadPayload[];
    medicalBaselines?: SyncMedicalBaselinePayload[];
    childVitals?: SyncChildVitalsPayload[];
    medicationsGiven?: SyncMedicationsGivenPayload[];
    laboratoryTests?: SyncLaboratoryTestsPayload[];
    servicesRendered?: SyncServicesRenderedPayload[];
    symptomsRecorded?: SyncSymptomsRecordedPayload[];
    clothingProvisions?: SyncClothingProvisionsPayload[];
}

export interface SyncDeltaQuery {
    since?: string;
}

export interface SyncConflict {
    domain: 'children_profiles' | 'biometric_fingerprints' | 'notification_reads' | 'medical_baselines' | 'child_vitals' | 'medications_given' | 'laboratory_tests' | 'services_rendered' | 'symptoms_recorded' | 'clothing_provisions';
    id: string;
    reason: string;
}
