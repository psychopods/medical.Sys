import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import * as volunteerService from '../services/volunteerService.ts';
import type { CreateVolunteerApplicationBody } from '../types/volunteer.ts';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value.trim();
}

export function createVolunteerRouter(pool: Pool): Router {
    const router = Router();

    // --- Public Endpoint ---

    router.post(
        '/submit',
        async (
            request: Request<unknown, unknown, CreateVolunteerApplicationBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const fullName = requireString(request.body.full_name, 'full_name');
                const emailAddress = requireString(request.body.email_address, 'email_address');
                const phoneNumber = requireString(request.body.phone_number, 'phone_number');
                const volunteerType = requireString(request.body.volunteer_type, 'volunteer_type') as any;
                const message = requireString(request.body.message, 'message');

                const application = await volunteerService.submitApplication(
                    pool,
                    fullName,
                    emailAddress,
                    phoneNumber,
                    volunteerType,
                    message
                );

                response.status(201).json({
                    success: true,
                    message: 'Volunteer application submitted successfully.',
                    application
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // --- Admin Endpoints ---

    router.get(
        '/applications',
        requirePermission(pool, 'support:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const applications = await volunteerService.listApplications(pool);
                response.status(200).json({ success: true, applications });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/applications/:id',
        requirePermission(pool, 'support:delete'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await volunteerService.deleteApplication(pool, id);
                response.status(200).json({ success: true, message: 'Volunteer application deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
