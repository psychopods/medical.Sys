import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import type { CreatePublicServiceRequestBody, UpdatePublicServiceRequestBody } from '../types/publicServices.ts';
import * as publicServicesService from '../services/publicServicesService.ts';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value.trim();
}

function optionalString(value: unknown, fieldName: string): string | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new HttpError(400, `${fieldName} must be a string if provided.`);
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function optionalNumber(value: unknown, _fieldName: string, defaultValue: number = 0): number {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
}

export function createPublicServicesRouter(pool: Pool): Router {
    const router = Router();

    // Public Endpoint - List all public services
    router.get(
        '/',
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const services = await publicServicesService.listPublicServices(pool);
                response.status(200).json({ success: true, services });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Protected Endpoint - Create public service (Admin)
    router.post(
        '/',
        requirePermission(pool, 'admin:create'),
        async (
            request: Request<unknown, unknown, CreatePublicServiceRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const title = requireString(request.body.title, 'title');
                const description = requireString(request.body.description, 'description');
                const imageUrl = optionalString(request.body.imageUrl, 'imageUrl');
                const displayOrder = optionalNumber(request.body.displayOrder, 'displayOrder', 0);

                const service = await publicServicesService.createPublicService(
                    pool,
                    id,
                    title,
                    description,
                    imageUrl,
                    displayOrder
                );

                response.status(201).json({ success: true, message: 'Public service created successfully.', service });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Protected Endpoint - Update public service (Admin)
    router.put(
        '/:id',
        requirePermission(pool, 'admin:update'),
        async (
            request: Request<{ id: string }, unknown, UpdatePublicServiceRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const title = requireString(request.body.title, 'title');
                const description = requireString(request.body.description, 'description');
                const imageUrl = optionalString(request.body.imageUrl, 'imageUrl');
                const displayOrder = optionalNumber(request.body.displayOrder, 'displayOrder', 0);

                const service = await publicServicesService.updatePublicService(
                    pool,
                    id,
                    title,
                    description,
                    imageUrl,
                    displayOrder
                );

                response.status(200).json({ success: true, message: 'Public service updated successfully.', service });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // Protected Endpoint - Delete public service (Admin)
    router.delete(
        '/:id',
        requirePermission(pool, 'admin:delete'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await publicServicesService.deletePublicService(pool, id);
                response.status(200).json({ success: true, message: 'Public service deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
