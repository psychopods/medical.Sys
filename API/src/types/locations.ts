export interface ChildLocation {
    id: string;
    name: string;
    description: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    childrenCount?: number;
    version: number;
    lastModifiedAt?: string;
}

export interface PublicLocationSummaryResponse {
    success: boolean;
    totalChildren: number;
    totalLocations: number;
    genderBreakdown: {
        male: number;
        female: number;
        other: number;
    };
    locations: ChildLocation[];
}

export interface CreateLocationRequestBody {
    id?: unknown;
    name?: unknown;
    description?: unknown;
    address?: unknown;
    lat?: unknown;
    lng?: unknown;
    latitude?: unknown;
    longitude?: unknown;
}

export interface UpdateLocationRequestBody {
    name?: unknown;
    description?: unknown;
    address?: unknown;
    lat?: unknown;
    lng?: unknown;
    latitude?: unknown;
    longitude?: unknown;
}
