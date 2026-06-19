import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import type { CreateLocationRequestBody, UpdateLocationRequestBody } from '../types/locations.ts';
import * as locationsService from '../services/locationsService.ts';

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

export function createLocationsRouter(pool: Pool): Router {
    const router = Router();

    router.post(
        '/',
        requirePermission(pool, 'locations:create'),
        async (
            request: Request<unknown, unknown, CreateLocationRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const name = requireString(request.body.name, 'name');
                const description = optionalString(request.body.description, 'description');

                const location = await locationsService.createLocation(pool, id, name, description);
                response.status(201).json({ message: 'Location created successfully.', location });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/',
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const locations = await locationsService.listLocations(pool);
                response.status(200).json({ locations });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id',
        requirePermission(pool, 'locations:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const location = await locationsService.getLocation(pool, id);
                response.status(200).json({ location });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/:id',
        requirePermission(pool, 'locations:update'),
        async (
            request: Request<{ id: string }, unknown, UpdateLocationRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const name = requireString(request.body.name, 'name');
                const description = optionalString(request.body.description, 'description');

                const location = await locationsService.updateLocation(pool, id, name, description);
                response.status(200).json({ message: 'Location updated successfully.', location });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/:id',
        requirePermission(pool, 'locations:delete'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await locationsService.deleteLocation(pool, id);
                response.status(200).json({ message: 'Location deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
