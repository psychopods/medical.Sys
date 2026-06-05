import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { GalleryCategory, GalleryItem } from '../types/gallery.ts';

function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

// --- Categories ---

export async function listCategories(pool: Pool): Promise<GalleryCategory[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT category_key, category_name, category_icon FROM gallery_categories ORDER BY category_name'
    );
    return rows.map((row) => ({
        categoryKey: row.category_key,
        categoryName: row.category_name,
        categoryIcon: row.category_icon
    }));
}

export async function createCategory(
    pool: Pool,
    categoryKey: string,
    categoryName: string,
    categoryIcon: string
): Promise<GalleryCategory> {
    const normalizedKey = categoryKey.trim().toLowerCase();
    const normalizedName = categoryName.trim();
    const normalizedIcon = categoryIcon.trim();

    if (!normalizedKey || !normalizedName || !normalizedIcon) {
        throw new HttpError(400, 'categoryKey, categoryName, and categoryIcon cannot be empty.');
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM gallery_categories WHERE category_key = ? LIMIT 1',
        [normalizedKey]
    );
    if (existing.length > 0) {
        throw new HttpError(409, `Category key '${normalizedKey}' is already in use.`);
    }

    await pool.execute(
        'INSERT INTO gallery_categories (category_key, category_name, category_icon) VALUES (?, ?, ?)',
        [normalizedKey, normalizedName, normalizedIcon]
    );

    return {
        categoryKey: normalizedKey,
        categoryName: normalizedName,
        categoryIcon: normalizedIcon
    };
}

export async function updateCategory(
    pool: Pool,
    categoryKey: string,
    categoryName: string,
    categoryIcon: string
): Promise<GalleryCategory> {
    const normalizedName = categoryName.trim();
    const normalizedIcon = categoryIcon.trim();

    if (!normalizedName || !normalizedIcon) {
        throw new HttpError(400, 'categoryName and categoryIcon cannot be empty.');
    }

    const [existingRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM gallery_categories WHERE category_key = ? LIMIT 1',
        [categoryKey]
    );
    if (existingRows.length === 0) {
        throw new HttpError(404, `Category with key '${categoryKey}' not found.`);
    }

    await pool.execute(
        'UPDATE gallery_categories SET category_name = ?, category_icon = ? WHERE category_key = ?',
        [normalizedName, normalizedIcon, categoryKey]
    );

    return {
        categoryKey,
        categoryName: normalizedName,
        categoryIcon: normalizedIcon
    };
}

export async function deleteCategory(pool: Pool, categoryKey: string): Promise<void> {
    const [existingRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM gallery_categories WHERE category_key = ? LIMIT 1',
        [categoryKey]
    );
    if (existingRows.length === 0) {
        throw new HttpError(404, `Category with key '${categoryKey}' not found.`);
    }

    // Check usage
    const [usageRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM gallery_items WHERE category_key = ? LIMIT 1',
        [categoryKey]
    );
    if (usageRows.length > 0) {
        throw new HttpError(400, 'Cannot delete category because it is currently assigned to one or more gallery items.');
    }

    await pool.execute('DELETE FROM gallery_categories WHERE category_key = ?', [categoryKey]);
}

// --- Gallery Items ---

export async function listItems(pool: Pool, categoryKey?: string): Promise<GalleryItem[]> {
    let query = `
        SELECT id, media_type, category_key, title, description, image_url, thumbnail_url, video_url, created_at, last_modified_at
        FROM gallery_items
    `;
    const params: string[] = [];

    if (categoryKey) {
        query += ' WHERE category_key = ?';
        params.push(categoryKey);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return rows.map((row) => ({
        id: row.id,
        mediaType: row.media_type as 'image' | 'video',
        categoryKey: row.category_key,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        videoUrl: row.video_url,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : ''
    }));
}

export async function getItem(pool: Pool, id: string): Promise<GalleryItem> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, media_type, category_key, title, description, image_url, thumbnail_url, video_url, created_at, last_modified_at
         FROM gallery_items WHERE id = ? LIMIT 1`,
        [id]
    );
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Gallery item with ID '${id}' not found.`);
    }
    return {
        id: row.id,
        mediaType: row.media_type as 'image' | 'video',
        categoryKey: row.category_key,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        videoUrl: row.video_url,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
        lastModifiedAt: row.last_modified_at ? new Date(row.last_modified_at).toISOString() : ''
    };
}

export async function createItem(
    pool: Pool,
    id: string,
    mediaType: 'image' | 'video',
    categoryKey: string,
    title: string,
    description: string,
    imageUrl: string | null,
    thumbnailUrl: string | null,
    videoUrl: string | null
): Promise<GalleryItem> {
    validateUUIDv4(id, 'item ID');

    if (!['image', 'video'].includes(mediaType)) {
        throw new HttpError(400, "mediaType must be 'image' or 'video'.");
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
        throw new HttpError(400, 'title and description cannot be empty.');
    }

    // Verify category exists
    const [catRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM gallery_categories WHERE category_key = ? LIMIT 1',
        [categoryKey]
    );
    if (catRows.length === 0) {
        throw new HttpError(400, `Category key '${categoryKey}' does not exist.`);
    }

    await pool.execute(
        `INSERT INTO gallery_items (id, media_type, category_key, title, description, image_url, thumbnail_url, video_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, mediaType, categoryKey, trimmedTitle, trimmedDescription, imageUrl, thumbnailUrl, videoUrl]
    );

    return getItem(pool, id);
}

export async function updateItem(
    pool: Pool,
    id: string,
    mediaType: 'image' | 'video',
    categoryKey: string,
    title: string,
    description: string,
    imageUrl: string | null,
    thumbnailUrl: string | null,
    videoUrl: string | null
): Promise<GalleryItem> {
    if (!['image', 'video'].includes(mediaType)) {
        throw new HttpError(400, "mediaType must be 'image' or 'video'.");
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
        throw new HttpError(400, 'title and description cannot be empty.');
    }

    // Verify item exists
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM gallery_items WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Gallery item with ID '${id}' not found.`);
    }

    // Verify category exists
    const [catRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM gallery_categories WHERE category_key = ? LIMIT 1',
        [categoryKey]
    );
    if (catRows.length === 0) {
        throw new HttpError(400, `Category key '${categoryKey}' does not exist.`);
    }

    await pool.execute(
        `UPDATE gallery_items 
         SET media_type = ?, category_key = ?, title = ?, description = ?, image_url = ?, thumbnail_url = ?, video_url = ?
         WHERE id = ?`,
        [mediaType, categoryKey, trimmedTitle, trimmedDescription, imageUrl, thumbnailUrl, videoUrl, id]
    );

    return getItem(pool, id);
}

export async function deleteItem(pool: Pool, id: string): Promise<void> {
    const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM gallery_items WHERE id = ? LIMIT 1',
        [id]
    );
    if (existing.length === 0) {
        throw new HttpError(404, `Gallery item with ID '${id}' not found.`);
    }

    await pool.execute('DELETE FROM gallery_items WHERE id = ?', [id]);
}

export async function getCategory(pool: Pool, categoryKey: string): Promise<GalleryCategory> {
    const normalizedKey = categoryKey.trim().toLowerCase();
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT category_key, category_name, category_icon FROM gallery_categories WHERE category_key = ? LIMIT 1',
        [normalizedKey]
    );
    const row = rows[0];
    if (!row) {
        throw new HttpError(404, `Gallery category with key '${normalizedKey}' not found.`);
    }
    return {
        categoryKey: row.category_key,
        categoryName: row.category_name,
        categoryIcon: row.category_icon
    };
}

