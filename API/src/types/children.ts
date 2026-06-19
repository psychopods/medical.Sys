export type Gender = 'Male' | 'Female';

export interface ChildProfile {
    id: string;
    customSerialId: string;
    fullName: string;
    gender: Gender;
    estimatedBirthYear: number | null;
    primaryLocationId: string;
    createdByStaffId: string;
    image1?: string | null;
    image2?: string | null;
    image3?: string | null;
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
    createdByStaffId?: unknown;
    image1?: unknown;
    image2?: unknown;
    image3?: unknown;
}

export interface UpdateChildProfileRequestBody {
    customSerialId?: unknown;
    fullName?: unknown;
    gender?: unknown;
    estimatedBirthYear?: unknown;
    primaryLocationId?: unknown;
    image1?: unknown;
    image2?: unknown;
    image3?: unknown;
}
