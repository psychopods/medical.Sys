export interface ResolveIdentityRequestBody {
    templateBase64?: unknown;
    localMatched?: unknown;
    localChildId?: unknown;
    runCentralLookup?: unknown;
}

export interface IdentityMatchProfile {
    childId: string;
    customSerialId: string;
    fullName: string;
    gender: 'Male' | 'Female';
    estimatedBirthYear: number | null;
    primaryLocationId: string;
    createdByStaffId: string;
    version: number;
}

export interface ResolveIdentityResult {
    stage: 'local' | 'central' | 'none';
    found: boolean;
    child: IdentityMatchProfile | null;
    matchFingerprintId: string | null;
    message: string;
}
