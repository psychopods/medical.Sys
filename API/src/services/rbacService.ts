import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { Role, Permission, RoleWithPermissions } from '../types/rbac.ts';

// Helper to validate client-side generated UUIDv4 format
function validateUUIDv4(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, 'Client-side generated UUIDv4 is required for ID.');
    }
}

export async function createRole(
    pool: Pool,
    id: string,
    name: string,
    description: string | null
): Promise<Role> {
    validateUUIDv4(id);

    const normalizedName = name.trim();
    if (!normalizedName) {
        throw new HttpError(400, 'Role name cannot be empty.');
    }

    // Check if name is already taken
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM roles WHERE LOWER(name) = ? LIMIT 1',
        [normalizedName.toLowerCase()]
    );
    if (existing.length > 0) {
        throw new HttpError(409, `Role name '${normalizedName}' is already taken.`);
    }

    const lastModifiedAt = new Date().toISOString();
    await pool.execute(
        `INSERT INTO roles (id, name, description, version)
         VALUES (?, ?, ?, 1)`,
        [id, normalizedName, description]
    );

    return {
        id,
        name: normalizedName,
        description,
        version: 1,
        lastModifiedAt
    };
}

export async function listRoles(pool: Pool): Promise<Role[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, description, version, last_modified_at FROM roles ORDER BY name'
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        version: row.version,
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
    }));
}

export async function getRoleWithPermissions(pool: Pool, id: string): Promise<RoleWithPermissions> {
    // 1. Fetch role
    const [roleRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, description, version, last_modified_at FROM roles WHERE id = ? LIMIT 1',
        [id]
    );
    const roleRow = roleRows[0];
    if (!roleRow) {
        throw new HttpError(404, `Role with ID '${id}' not found.`);
    }

    // 2. Fetch associated permissions
    const [permRows] = await pool.execute<RowDataPacket[]>(
        `SELECT p.id, p.slug, p.description
         FROM permissions p
         INNER JOIN role_permissions rp ON rp.permission_id = p.id
         WHERE rp.role_id = ?
         ORDER BY p.slug`,
        [id]
    );

    return {
        id: roleRow.id,
        name: roleRow.name,
        description: roleRow.description,
        version: roleRow.version,
        lastModifiedAt: roleRow.last_modified_at ? new Date(roleRow.last_modified_at).toISOString() : undefined,
        permissions: permRows.map((row) => ({
            id: row.id,
            slug: row.slug,
            description: row.description
        }))
    };
}

export async function updateRole(
    pool: Pool,
    id: string,
    name: string,
    description: string | null
): Promise<Role> {
    const normalizedName = name.trim();
    if (!normalizedName) {
        throw new HttpError(400, 'Role name cannot be empty.');
    }

    // Check if role exists and fetch its version
    const [roleRows] = await pool.execute<RowDataPacket[]>(
        'SELECT version FROM roles WHERE id = ? LIMIT 1',
        [id]
    );
    const roleRow = roleRows[0];
    if (!roleRow) {
        throw new HttpError(404, `Role with ID '${id}' not found.`);
    }

    // Verify name is not taken by *another* role
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM roles WHERE LOWER(name) = ? AND id != ? LIMIT 1',
        [normalizedName.toLowerCase(), id]
    );
    if (existing.length > 0) {
        throw new HttpError(409, `Role name '${normalizedName}' is already taken by another role.`);
    }

    const nextVersion = roleRow.version + 1;

    await pool.execute(
        `UPDATE roles
         SET name = ?, description = ?, version = ?
         WHERE id = ?`,
        [normalizedName, description, nextVersion, id]
    );

    return {
        id,
        name: normalizedName,
        description,
        version: nextVersion,
        lastModifiedAt: new Date().toISOString()
    };
}

export async function deleteRole(pool: Pool, id: string): Promise<void> {
    // Check if role exists
    const [roleRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM roles WHERE id = ? LIMIT 1',
        [id]
    );
    if (roleRows.length === 0) {
        throw new HttpError(404, `Role with ID '${id}' not found.`);
    }

    // Check if any active staff member is using this role
    const [staffCheck] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM staff_users WHERE role_id = ? LIMIT 1',
        [id]
    );
    if (staffCheck.length > 0) {
        throw new HttpError(400, 'Cannot delete role because it is currently assigned to active staff users.');
    }

    // Delete it (Foreign keys to role_permissions will cascade delete)
    await pool.execute('DELETE FROM roles WHERE id = ?', [id]);
}

// ==========================================
// 2. PERMISSIONS SERVICE FUNCTIONS
// ==========================================

export async function createPermission(
    pool: Pool,
    id: string,
    slug: string,
    description: string | null
): Promise<Permission> {
    validateUUIDv4(id);

    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
        throw new HttpError(400, 'Permission slug cannot be empty.');
    }

    // Enforce clear naming convention for security slugs (e.g. 'domain:action')
    if (!normalizedSlug.includes(':')) {
        throw new HttpError(400, "Permission slug must follow the 'domain:action' format (e.g. 'children:create').");
    }

    // Check if slug is already taken
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM permissions WHERE slug = ? LIMIT 1',
        [normalizedSlug]
    );
    if (existing.length > 0) {
        throw new HttpError(409, `Permission slug '${normalizedSlug}' is already taken.`);
    }

    await pool.execute(
        `INSERT INTO permissions (id, slug, description)
         VALUES (?, ?, ?)`,
        [id, normalizedSlug, description]
    );

    return {
        id,
        slug: normalizedSlug,
        description
    };
}

export async function listPermissions(pool: Pool): Promise<Permission[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, slug, description FROM permissions ORDER BY slug'
    );

    return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        description: row.description
    }));
}

export async function getPermission(pool: Pool, id: string): Promise<Permission> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, slug, description FROM permissions WHERE id = ? LIMIT 1',
        [id]
    );
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Permission with ID '${id}' not found.`);
    }

    return {
        id: row.id,
        slug: row.slug,
        description: row.description
    };
}

export async function updatePermission(
    pool: Pool,
    id: string,
    slug: string,
    description: string | null
): Promise<Permission> {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
        throw new HttpError(400, 'Permission slug cannot be empty.');
    }

    if (!normalizedSlug.includes(':')) {
        throw new HttpError(400, "Permission slug must follow the 'domain:action' format (e.g. 'children:create').");
    }

    // Check if permission exists
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM permissions WHERE id = ? LIMIT 1',
        [id]
    );
    if (rows.length === 0) {
        throw new HttpError(404, `Permission with ID '${id}' not found.`);
    }

    // Verify slug is not taken by *another* permission
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM permissions WHERE slug = ? AND id != ? LIMIT 1',
        [normalizedSlug, id]
    );
    if (existing.length > 0) {
        throw new HttpError(409, `Permission slug '${normalizedSlug}' is already taken by another permission.`);
    }

    await pool.execute(
        `UPDATE permissions
         SET slug = ?, description = ?
         WHERE id = ?`,
        [normalizedSlug, description, id]
    );

    return {
        id,
        slug: normalizedSlug,
        description
    };
}

export async function deletePermission(pool: Pool, id: string): Promise<void> {
    // Check if permission exists
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM permissions WHERE id = ? LIMIT 1',
        [id]
    );
    if (rows.length === 0) {
        throw new HttpError(404, `Permission with ID '${id}' not found.`);
    }

    // Delete it (Foreign keys to role_permissions will cascade delete)
    await pool.execute('DELETE FROM permissions WHERE id = ?', [id]);
}

// ==========================================
// 3. ROLE-PERMISSIONS BRIDGE FUNCTIONS
// ==========================================

export async function assignPermissionToRole(
    pool: Pool,
    roleId: string,
    permissionId: string
): Promise<void> {
    // 1. Verify Role exists
    const [roleRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM roles WHERE id = ? LIMIT 1',
        [roleId]
    );
    if (roleRows.length === 0) {
        throw new HttpError(404, `Role with ID '${roleId}' not found.`);
    }

    // 2. Verify Permission exists
    const [permRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM permissions WHERE id = ? LIMIT 1',
        [permissionId]
    );
    if (permRows.length === 0) {
        throw new HttpError(404, `Permission with ID '${permissionId}' not found.`);
    }

    // 3. Check if relationship already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ? LIMIT 1',
        [roleId, permissionId]
    );
    if (existing.length > 0) {
        throw new HttpError(409, 'This permission is already assigned to this role.');
    }

    // 4. Link them
    await pool.execute(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        [roleId, permissionId]
    );
}

export async function removePermissionFromRole(
    pool: Pool,
    roleId: string,
    permissionId: string
): Promise<void> {
    // Check if relationship exists
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ? LIMIT 1',
        [roleId, permissionId]
    );
    if (existing.length === 0) {
        throw new HttpError(404, 'This permission is not assigned to this role.');
    }

    // Remove link
    await pool.execute(
        'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [roleId, permissionId]
    );
}
