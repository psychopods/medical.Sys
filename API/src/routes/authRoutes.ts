import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'mysql2/promise';
import { authenticateStaff, registerStaff } from '../services/authService.ts';
import { requireAuthenticated } from '../middleware/auth.ts';
import type { LoginRequestBody, LoginResponseBody, SignupRequestBody, SignupResponseBody } from '../types/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';

const LOCAL_SESSION_STORAGE_KEY = 'field_outreach.auth.session.v1';
const LOCAL_PERMISSION_CACHE_KEY = 'field_outreach.auth.permissions.v1';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required.`);
    }

    return value;
}

export function createAuthRouter(pool: Pool): Router {
    const router = Router();

    router.post(
        '/login',
        async (
            request: Request<unknown, LoginResponseBody | { message: string }, LoginRequestBody>,
            response: Response<LoginResponseBody | { message: string }>,
            next: NextFunction
        ): Promise<void> => {
            try {
                const usernameOrEmail = requireString(request.body.usernameOrEmail, 'usernameOrEmail');
                const password = requireString(request.body.password, 'password');
                const { accessToken, session } = await authenticateStaff(pool, usernameOrEmail, password);

                response.status(200).json({
                    accessToken,
                    session,
                    localSession: {
                        storageKey: LOCAL_SESSION_STORAGE_KEY,
                        permissionCacheKey: LOCAL_PERMISSION_CACHE_KEY,
                        expiresAt: session.expiresAt
                    }
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/signup',
        async (
            request: Request<unknown, SignupResponseBody | { message: string }, SignupRequestBody>,
            response: Response<SignupResponseBody | { message: string }>,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const username = requireString(request.body.username, 'username');
                const email = requireString(request.body.email, 'email');
                const password = requireString(request.body.password, 'password');
                const roleId = requireString(request.body.roleId, 'roleId');

                const user = await registerStaff(pool, id, username, email, password, roleId);

                response.status(201).json({
                    message: 'Staff user registered successfully.',
                    user
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get('/session', requireAuthenticated(pool), (request: Request, response: Response): void => {
        response.status(200).json({ session: request.authSession });
    });

    router.post('/logout', (_request: Request, response: Response): void => {
        response.status(200).json({
            message: 'Local session cleared by client. Bearer token should be discarded from local storage.'
        });
    });

    return router;
}