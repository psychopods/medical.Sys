import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import type { CreateChildProfileRequestBody, Gender, UpdateChildProfileRequestBody } from '../types/children.ts';
import {
    createChildProfile,
    deleteChildProfile,
    getChildProfile,
    listChildProfiles,
    updateChildProfile
} from '../services/childrenService.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }

    return value.trim();
}

function requireGender(value: unknown): Gender {
    if (value === 'Male' || value === 'Female') {
        return value;
    }

    throw new HttpError(400, "gender must be either 'Male' or 'Female'.");
}

function optionalBirthYear(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new HttpError(400, 'estimatedBirthYear must be an integer if provided.');
    }

    return value;
}

export function createChildrenRouter(pool: Pool): Router {
    const router = Router();

    router.post(
        '/',
        requirePermission(pool, 'children:create'),
        async (
            request: Request<unknown, { child: unknown } | { message: string }, CreateChildProfileRequestBody>,
            response: Response<{ child: unknown } | { message: string }>,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const customSerialId = requireString(request.body.customSerialId, 'customSerialId');
                const fullName = requireString(request.body.fullName, 'fullName');
                const gender = requireGender(request.body.gender);
                const estimatedBirthYear = optionalBirthYear(request.body.estimatedBirthYear);
                const primaryLocationId = requireString(request.body.primaryLocationId, 'primaryLocationId');
                const createdByStaffId = request.authSession?.staffUserId;

                if (!createdByStaffId) {
                    throw new HttpError(401, 'Missing authenticated staff session.');
                }

                const child = await createChildProfile(
                    pool,
                    id,
                    customSerialId,
                    fullName,
                    gender,
                    estimatedBirthYear,
                    primaryLocationId,
                    createdByStaffId
                );

                response.status(201).json({ child });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/',
        requirePermission(pool, 'children:read'),
        async (_request: Request, response: Response<{ children: unknown[] } | { message: string }>, next: NextFunction): Promise<void> => {
            try {
                const children = await listChildProfiles(pool);
                response.status(200).json({ children });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response<{ child: unknown } | { message: string }>, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const child = await getChildProfile(pool, id);
                response.status(200).json({ child });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/:id',
        requirePermission(pool, 'children:update'),
        async (
            request: Request<{ id: string }, { child: unknown } | { message: string }, UpdateChildProfileRequestBody>,
            response: Response<{ child: unknown } | { message: string }>,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const customSerialId = requireString(request.body.customSerialId, 'customSerialId');
                const fullName = requireString(request.body.fullName, 'fullName');
                const gender = requireGender(request.body.gender);
                const estimatedBirthYear = optionalBirthYear(request.body.estimatedBirthYear);
                const primaryLocationId = requireString(request.body.primaryLocationId, 'primaryLocationId');

                const child = await updateChildProfile(
                    pool,
                    id,
                    customSerialId,
                    fullName,
                    gender,
                    estimatedBirthYear,
                    primaryLocationId
                );

                response.status(200).json({ child });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/:id',
        requirePermission(pool, 'children:delete'),
        async (request: Request<{ id: string }>, response: Response<{ message: string }>, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await deleteChildProfile(pool, id);
                response.status(200).json({ message: 'Child profile deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
