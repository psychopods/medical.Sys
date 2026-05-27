export type Gender = 'Male' | 'Female';

export interface ChildProfile {
    id: string;
    customSerialId: string;
    fullName: string;
    gender: Gender;
    estimatedBirthYear: number | null;
    primaryLocationId: string;
    createdByStaffId: string;
    version: number;
    createdAt?: string;
    lastModifiedAt?: string;
}

export interface CreateChildProfileRequestBody {
    id?: unknown;
    customSerialId?: unknown;
    fullName?: unknown;
    gender?: unknown;
    estimatedBirthYear?: unknown;
    primaryLocationId?: unknown;
}

export interface UpdateChildProfileRequestBody {
    customSerialId?: unknown;
    fullName?: unknown;
    gender?: unknown;
    estimatedBirthYear?: unknown;
    primaryLocationId?: unknown;
}
