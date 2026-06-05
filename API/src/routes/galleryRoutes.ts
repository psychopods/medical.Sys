import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import * as galleryService from '../services/galleryService.ts';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value.trim();
}

function optionalString(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function createGalleryRouter(pool: Pool): Router {
    const router = Router();

    // --- Public Endpoints ---

    router.get('/categories', async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const categories = await galleryService.listCategories(pool);
            response.status(200).json({ success: true, categories });
        } catch (error) {
            next(toHttpError(error));
        }
    });

    router.get('/items', async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const category = typeof request.query.category === 'string' ? request.query.category : undefined;
            const items = await galleryService.listItems(pool, category);
            response.status(200).json({ success: true, items });
        } catch (error) {
            next(toHttpError(error));
        }
    });

    // --- Admin Endpoints ---

    router.post(
        '/categories',
        requirePermission(pool, 'gallery:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const categoryKey = requireString(request.body.categoryKey, 'categoryKey');
                const categoryName = requireString(request.body.categoryName, 'categoryName');
                const categoryIcon = requireString(request.body.categoryIcon, 'categoryIcon');

                const category = await galleryService.createCategory(pool, categoryKey, categoryName, categoryIcon);
                response.status(201).json({ success: true, message: 'Category created successfully.', category });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/categories/:categoryKey',
        requirePermission(pool, 'gallery:update'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const categoryKey = requireString(request.params.categoryKey, 'categoryKey');
                const categoryName = requireString(request.body.categoryName, 'categoryName');
                const categoryIcon = requireString(request.body.categoryIcon, 'categoryIcon');

                const category = await galleryService.updateCategory(pool, categoryKey, categoryName, categoryIcon);
                response.status(200).json({ success: true, message: 'Category updated successfully.', category });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/categories/:categoryKey',
        requirePermission(pool, 'gallery:delete'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const categoryKey = requireString(request.params.categoryKey, 'categoryKey');
                await galleryService.deleteCategory(pool, categoryKey);
                response.status(200).json({ success: true, message: 'Category deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/items',
        requirePermission(pool, 'gallery:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const mediaType = requireString(request.body.mediaType, 'mediaType') as 'image' | 'video';
                const categoryKey = requireString(request.body.categoryKey, 'categoryKey');
                const title = requireString(request.body.title, 'title');
                const description = requireString(request.body.description, 'description');
                const imageUrl = optionalString(request.body.imageUrl);
                const thumbnailUrl = optionalString(request.body.thumbnailUrl);
                const videoUrl = optionalString(request.body.videoUrl);

                const item = await galleryService.createItem(
                    pool,
                    id,
                    mediaType,
                    categoryKey,
                    title,
                    description,
                    imageUrl,
                    thumbnailUrl,
                    videoUrl
                );
                response.status(201).json({ success: true, message: 'Gallery item created successfully.', item });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/items/:id',
        requirePermission(pool, 'gallery:update'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const mediaType = requireString(request.body.mediaType, 'mediaType') as 'image' | 'video';
                const categoryKey = requireString(request.body.categoryKey, 'categoryKey');
                const title = requireString(request.body.title, 'title');
                const description = requireString(request.body.description, 'description');
                const imageUrl = optionalString(request.body.imageUrl);
                const thumbnailUrl = optionalString(request.body.thumbnailUrl);
                const videoUrl = optionalString(request.body.videoUrl);

                const item = await galleryService.updateItem(
                    pool,
                    id,
                    mediaType,
                    categoryKey,
                    title,
                    description,
                    imageUrl,
                    thumbnailUrl,
                    videoUrl
                );
                response.status(200).json({ success: true, message: 'Gallery item updated successfully.', item });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/items/:id',
        requirePermission(pool, 'gallery:delete'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await galleryService.deleteItem(pool, id);
                response.status(200).json({ success: true, message: 'Gallery item deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/categories/:categoryKey',
        requirePermission(pool, 'gallery:read'),
        async (request: Request<{ categoryKey: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const categoryKey = requireString(request.params.categoryKey, 'categoryKey');
                const result = await galleryService.getCategory(pool, categoryKey);
                response.status(200).json({ success: true, category: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/items/:id',
        requirePermission(pool, 'gallery:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const result = await galleryService.getItem(pool, id);
                response.status(200).json({ success: true, item: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
