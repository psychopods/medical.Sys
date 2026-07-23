export interface FingerprintTemplateRecord {
    id: string;
    childId: string;
    fingerIndex: number;
    templateBase64?: string;
    qualityScore: number | null;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    version: number;
    createdAt?: string;
    lastModifiedAt?: string;
    imageDataUrl?: string | null;
}

export interface EnrollmentStatus {
    childId: string;
    capturedFingerIndexes: number[];
    missingFingerIndexes: number[];
    isComplete: boolean;
}

export interface EnrollFingerprintRequestBody {
    id?: unknown;
    childId?: unknown;
    fingerIndex?: unknown;
    templateBase64?: unknown;
    qualityScore?: unknown;
    capturedAt?: unknown;
    matcherVersion?: unknown;
    imageDataUrl?: unknown;
    imageBase64?: unknown;
    image_data?: unknown;
    image?: unknown;
}

export interface VerifyOneToOneRequestBody {
    childId?: unknown;
    templateBase64?: unknown;
    matched?: unknown;
    score?: unknown;
    threshold?: unknown;
    fingerIndex?: unknown;
    matcherVersion?: unknown;
    capturedAt?: unknown;
}

export interface IdentifyOneToManyRequestBody {
    templateBase64?: unknown;
    matched?: unknown;
    score?: unknown;
    threshold?: unknown;
    candidateChildId?: unknown;
    candidateFingerprintId?: unknown;
    matcherVersion?: unknown;
    capturedAt?: unknown;
}

export interface VerifyOneToOneResult {
    matched: boolean;
    childId: string;
    fingerIndex?: number;
    score: number;
    threshold: number;
}

export interface IdentifyOneToManyResult {
    matched: boolean;
    candidateChildId: string | null;
    candidateFingerprintId: string | null;
    score: number;
    threshold: number;
}

export interface BridgeScanResponse {
    templateBase64: string;
    qualityScore: number | null;
    deviceId: string;
    capturedAt: string;
}

export interface BridgeMatchResponse {
    matched: boolean;
    score: number;
    threshold: number;
    matcherVersion?: string;
}
