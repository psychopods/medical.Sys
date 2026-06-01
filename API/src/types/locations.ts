export interface ChildLocation {
    id: string;
    name: string;
    description: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface CreateLocationRequestBody {
    id?: unknown;
    name?: unknown;
    description?: unknown;
}

export interface UpdateLocationRequestBody {
    name?: unknown;
    description?: unknown;
}
