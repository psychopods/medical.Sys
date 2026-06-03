import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import * as childrenService from '../services/childrenService.ts';
import type { CreateChildProfileRequestBody, UpdateChildProfileRequestBody, Gender } from '../types/children.ts';

// Helper validations
function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value.trim();
}

function requireGender(value: unknown): Gender {
    if (value !== 'Male' && value !== 'Female') {
        throw new HttpError(400, "Gender is required and must be either 'Male' or 'Female'.");
    }
    return value as Gender;
}

function parseBirthYear(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const num = Number(value);
    if (!Number.isInteger(num)) {
        throw new HttpError(400, 'Estimated birth year must be an integer.');
    }
    return num;
}

function optionalString(value: unknown): string | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new HttpError(400, 'Value must be a string if provided.');
    }
    return value.trim();
}

function optionalImageString(value: unknown, fieldName: string): string | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    if (typeof value !== 'string') {
        throw new HttpError(400, `${fieldName} must be a string.`);
    }
    const trimmed = value.trim();
    if (trimmed.length > 0 && !trimmed.startsWith('data:image/')) {
        throw new HttpError(400, `${fieldName} must be a valid base64 image data URL (start with data:image/).`);
    }
    return trimmed;
}

export function createChildrenRouter(pool: Pool): Router {
    const router = Router();

    // 1. CREATE Child Profile
    router.post(
        '/',
        requirePermission(pool, 'children:create'),
        async (
            request: Request<unknown, unknown, CreateChildProfileRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const customSerialId = requireString(request.body.customSerialId, 'customSerialId');
                const fullName = requireString(request.body.fullName, 'fullName');
                const gender = requireGender(request.body.gender);
                const estimatedBirthYear = parseBirthYear(request.body.estimatedBirthYear);
                const primaryLocationId = requireString(request.body.primaryLocationId, 'primaryLocationId');

                // Auto-bind creator staff user ID from session token,
                // but allow explicit payload input for offline synchronization logs
                const sessionStaffId = request.authSession?.staffUserId;
                if (!sessionStaffId) {
                    throw new HttpError(401, 'No active authenticated session staff ID found.');
                }
                const bodyStaffId = optionalString(request.body.createdByStaffId);
                const createdByStaffId = bodyStaffId || sessionStaffId;

                const image1 = optionalImageString(request.body.image1, 'image1');
                const image2 = optionalImageString(request.body.image2, 'image2');
                const image3 = optionalImageString(request.body.image3, 'image3');

                const child = await childrenService.createChildProfile(
                    pool,
                    id,
                    customSerialId,
                    fullName,
                    gender,
                    estimatedBirthYear,
                    primaryLocationId,
                    createdByStaffId,
                    image1,
                    image2,
                    image3
                );

                response.status(201).json({
                    message: 'Patient profile created successfully.',
                    child
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 2. LIST Child Profiles
    router.get(
        '/',
        requirePermission(pool, 'children:read'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const registrationDateRaw = request.query.registrationDate;
                const registrationDate = typeof registrationDateRaw === 'string' && registrationDateRaw.trim().length > 0
                    ? registrationDateRaw.trim()
                    : undefined;
                const children = await childrenService.listChildProfiles(pool, registrationDate);
                response.status(200).json({ children });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 3. GET Single Child Profile
    router.get(
        '/:id',
        requirePermission(pool, 'children:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const child = await childrenService.getChildProfile(pool, id);

                response.status(200).json({ child });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 4. UPDATE Child Profile
    router.put(
        '/:id',
        requirePermission(pool, 'children:update'),
        async (
            request: Request<{ id: string }, unknown, UpdateChildProfileRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const customSerialId = requireString(request.body.customSerialId, 'customSerialId');
                const fullName = requireString(request.body.fullName, 'fullName');
                const gender = requireGender(request.body.gender);
                const estimatedBirthYear = parseBirthYear(request.body.estimatedBirthYear);
                const primaryLocationId = requireString(request.body.primaryLocationId, 'primaryLocationId');

                const image1 = optionalImageString(request.body.image1, 'image1');
                const image2 = optionalImageString(request.body.image2, 'image2');
                const image3 = optionalImageString(request.body.image3, 'image3');

                const child = await childrenService.updateChildProfile(
                    pool,
                    id,
                    customSerialId,
                    fullName,
                    gender,
                    estimatedBirthYear,
                    primaryLocationId,
                    image1,
                    image2,
                    image3
                );

                response.status(200).json({
                    message: 'Patient profile updated successfully.',
                    child
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 5. DELETE Child Profile
    router.delete(
        '/:id',
        requirePermission(pool, 'children:delete'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await childrenService.deleteChildProfile(pool, id);

                response.status(200).json({
                    message: 'Patient profile deleted successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
