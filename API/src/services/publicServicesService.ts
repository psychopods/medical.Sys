import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { PublicService } from '../types/publicServices.ts';

function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

export async function listPublicServices(pool: Pool): Promise<PublicService[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, title, description, image_url, display_order, version, created_at, last_modified_at
         FROM public_services
         ORDER BY display_order ASC, created_at ASC`
    );

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        displayOrder: Number(row.display_order || 0),
        version: Number(row.version || 1),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : undefined
    }));
}

export async function createPublicService(
    pool: Pool,
    id: string,
    title: string,
    description: string,
    imageUrl: string | null = null,
    displayOrder: number = 0
): Promise<PublicService> {
    validateUUIDv4(id, 'service ID');

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
        throw new HttpError(400, 'Service title cannot be empty.');
    }

    const normalizedDescription = description.trim();
    if (!normalizedDescription) {
        throw new HttpError(400, 'Service description cannot be empty.');
    }

    await pool.execute(
        `INSERT INTO public_services (id, title, description, image_url, display_order, version)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, normalizedTitle, normalizedDescription, imageUrl, displayOrder]
    );

    return {
        id,
        title: normalizedTitle,
        description: normalizedDescription,
        imageUrl,
        displayOrder,
        version: 1,
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString()
    };
}

export async function updatePublicService(
    pool: Pool,
    id: string,
    title: string,
    description: string,
    imageUrl: string | null = null,
    displayOrder: number = 0
): Promise<PublicService> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
        throw new HttpError(400, 'Service title cannot be empty.');
    }

    const normalizedDescription = description.trim();
    if (!normalizedDescription) {
        throw new HttpError(400, 'Service description cannot be empty.');
    }

    const [existingRows] = await pool.execute<RowDataPacket[]>(
        'SELECT version FROM public_services WHERE id = ? LIMIT 1',
        [id]
    );
    const existing = existingRows[0];
    if (!existing) {
        throw new HttpError(404, `Public service with ID '${id}' not found.`);
    }

    const nextVersion = Number(existing.version || 1) + 1;

    await pool.execute(
        `UPDATE public_services
         SET title = ?, description = ?, image_url = ?, display_order = ?, version = ?
         WHERE id = ?`,
        [normalizedTitle, normalizedDescription, imageUrl, displayOrder, nextVersion, id]
    );

    return {
        id,
        title: normalizedTitle,
        description: normalizedDescription,
        imageUrl,
        displayOrder,
        version: nextVersion,
        lastModifiedAt: new Date().toISOString()
    };
}

export async function deletePublicService(pool: Pool, id: string): Promise<void> {
    const [existingRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM public_services WHERE id = ? LIMIT 1',
        [id]
    );
    if (existingRows.length === 0) {
        throw new HttpError(404, `Public service with ID '${id}' not found.`);
    }

    await pool.execute('DELETE FROM public_services WHERE id = ?', [id]);
}
