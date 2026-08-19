export interface PublicService {
    id: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    displayOrder: number;
    version: number;
    createdAt?: string;
    lastModifiedAt?: string;
}

export interface CreatePublicServiceRequestBody {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    imageUrl?: unknown;
    displayOrder?: unknown;
}

export interface UpdatePublicServiceRequestBody {
    title?: unknown;
    description?: unknown;
    imageUrl?: unknown;
    displayOrder?: unknown;
}
