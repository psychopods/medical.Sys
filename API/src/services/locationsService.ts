import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { ChildLocation } from '../types/locations.ts';

function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

export async function createLocation(
    pool: Pool,
    id: string,
    name: string,
    description: string | null
): Promise<ChildLocation> {
    validateUUIDv4(id, 'location ID');

    const normalizedName = name.trim();
    if (!normalizedName) {
        throw new HttpError(400, 'Location name cannot be empty.');
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM child_locations WHERE LOWER(name) = ? LIMIT 1',
        [normalizedName.toLowerCase()]
    );
    if (existing.length > 0) {
        throw new HttpError(409, `Location name '${normalizedName}' is already in use.`);
    }

    await pool.execute(
        'INSERT INTO child_locations (id, name, description, version) VALUES (?, ?, ?, 1)',
        [id, normalizedName, description]
    );

    return {
        id,
        name: normalizedName,
        description,
        version: 1,
        lastModifiedAt: new Date().toISOString()
    };
}

export async function listLocations(pool: Pool): Promise<ChildLocation[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, description, version, last_modified_at FROM child_locations ORDER BY name'
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        version: row.version,
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
    }));
}

export async function getLocation(pool: Pool, id: string): Promise<ChildLocation> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, description, version, last_modified_at FROM child_locations WHERE id = ? LIMIT 1',
        [id]
    );

    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Location with ID '${id}' not found.`);
    }

    return {
        id: row.id,
        name: row.name,
        description: row.description,
        version: row.version,
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
    };
}

export async function updateLocation(
    pool: Pool,
    id: string,
    name: string,
    description: string | null
): Promise<ChildLocation> {
    const normalizedName = name.trim();
    if (!normalizedName) {
        throw new HttpError(400, 'Location name cannot be empty.');
    }

    const [existingRows] = await pool.execute<RowDataPacket[]>(
        'SELECT version FROM child_locations WHERE id = ? LIMIT 1',
        [id]
    );
    const existing = existingRows[0];
    if (!existing) {
        throw new HttpError(404, `Location with ID '${id}' not found.`);
    }

    const [conflictRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM child_locations WHERE LOWER(name) = ? AND id != ? LIMIT 1',
        [normalizedName.toLowerCase(), id]
    );
    if (conflictRows.length > 0) {
        throw new HttpError(409, `Location name '${normalizedName}' is already in use by another location.`);
    }

    const nextVersion = Number(existing.version) + 1;

    await pool.execute(
        'UPDATE child_locations SET name = ?, description = ?, version = ? WHERE id = ?',
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

export async function deleteLocation(pool: Pool, id: string): Promise<void> {
    const [existingRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM child_locations WHERE id = ? LIMIT 1',
        [id]
    );
    if (existingRows.length === 0) {
        throw new HttpError(404, `Location with ID '${id}' not found.`);
    }

    const [usageRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM children_profiles WHERE primary_location_id = ? LIMIT 1',
        [id]
    );
    if (usageRows.length > 0) {
        throw new HttpError(400, 'Cannot delete location because it is currently assigned to one or more child profiles.');
    }

    await pool.execute('DELETE FROM child_locations WHERE id = ?', [id]);
}
