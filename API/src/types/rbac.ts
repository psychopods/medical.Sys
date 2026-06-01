export interface Role {
    id: string;
    name: string;
    description: string | null;
    version: number;
    lastModifiedAt?: string;
}

export interface PermissionCategory {
    id: number;
    name: string;
    description: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface Permission {
    id: string;
    slug: string;
    description: string | null;
    categoryId?: number | null;
}

export interface RoleWithPermissions extends Role {
    permissions: Permission[];
}

export interface CreateRoleRequestBody {
    id?: unknown;
    name?: unknown;
    description?: unknown;
}

export interface UpdateRoleRequestBody {
    name?: unknown;
    description?: unknown;
}

export interface CreatePermissionRequestBody {
    id?: unknown;
    slug?: unknown;
    description?: unknown;
    categoryId?: unknown;
}

export interface UpdatePermissionRequestBody {
    slug?: unknown;
    description?: unknown;
    categoryId?: unknown;
}

export interface AssignPermissionRequestBody {
    permissionId?: unknown;
}
