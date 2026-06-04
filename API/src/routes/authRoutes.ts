import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import {
    authenticateStaff,
    registerStaff,
    listStaffUsers,
    generateStaffUsername,
    updateStaffUser,
    deleteStaffUser,
    getActiveOnlineStaffCount
} from '../services/authService.ts';
import { requestPasswordResetLink, resetPasswordWithToken, verifyPasswordResetOtp, resetPasswordWithOtp } from '../services/passwordResetService.ts';
import { requireAuthenticated, requirePermission } from '../middleware/auth.ts';
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
                const { accessToken, session, user } = await authenticateStaff(pool, usernameOrEmail, password);

                const mappedRole = user.roleName.toLowerCase().replace(/[^a-z0-9_]/g, '');

                response.status(200).json({
                    accessToken,
                    session,
                    localSession: {
                        storageKey: LOCAL_SESSION_STORAGE_KEY,
                        permissionCacheKey: LOCAL_PERMISSION_CACHE_KEY,
                        expiresAt: session.expiresAt
                    },
                    success: true,
                    token: accessToken,
                    user: {
                        user_id: user.id,
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role_id: user.roleId,
                        first_name: user.firstName,
                        last_name: user.lastName,
                        phone_number: user.phone,
                        role: mappedRole,
                        permissions: session.permissions
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
                const firstName = requireString(request.body.firstName, 'firstName');
                const lastName = requireString(request.body.lastName, 'lastName');
                const phone = requireString(request.body.phone, 'phone');

                const user = await registerStaff(pool, id, username, email, password, roleId, firstName, lastName, phone);

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

    router.post('/forgot-password', async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const email = requireString(request.body?.email, 'email');
            await requestPasswordResetLink(pool, email);
            response.status(200).json({
                success: true,
                message: 'If the account exists, a password reset link has been sent to the registered email address.'
            });
        } catch (error) {
            next(toHttpError(error));
        }
    });

    router.post('/verify-otp', async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const email = requireString(request.body?.email, 'email');
            const otp = requireString(request.body?.otp, 'otp');
            await verifyPasswordResetOtp(pool, email, otp);
            response.status(200).json({
                success: true,
                message: 'OTP verified successfully.'
            });
        } catch (error) {
            next(toHttpError(error));
        }
    });

    router.post('/resend-otp', async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const email = requireString(request.body?.email, 'email');
            await requestPasswordResetLink(pool, email);
            response.status(200).json({
                success: true,
                message: 'OTP resent successfully.'
            });
        } catch (error) {
            next(toHttpError(error));
        }
    });

    router.post('/reset-password', async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        try {
            const otp = request.body?.otp;
            if (otp !== undefined) {
                // OTP reset flow
                const email = requireString(request.body?.email, 'email');
                const newPassword = requireString(request.body?.new_password || request.body?.newPassword, 'new_password');
                await resetPasswordWithOtp(pool, email, otp, newPassword);
                response.status(200).json({
                    success: true,
                    message: 'Password reset successfully.'
                });
            } else {
                // Token-based fallback flow
                const token = requireString(request.body?.token, 'token');
                const newPassword = requireString(request.body?.new_password, 'new_password');
                const confirmPassword = requireString(request.body?.confirm_password, 'confirm_password');

                if (newPassword !== confirmPassword) {
                    response.status(400).json({ success: false, message: 'Passwords do not match.' });
                    return;
                }

                await resetPasswordWithToken(pool, token, newPassword);

                response.status(200).json({
                    success: true,
                    message: 'Password reset successfully.'
                });
            }
        } catch (error) {
            next(toHttpError(error));
        }
    });

    router.get(
        '/users',
        requirePermission(pool, 'admin:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const users = await listStaffUsers(pool);
                response.status(200).json(users);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/online-count',
        requirePermission(pool, 'admin:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const activeOnlineCount = await getActiveOnlineStaffCount(pool);
                response.status(200).json({ activeOnlineCount });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/online_users',
        requirePermission(pool, 'admin:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const activeOnlineCount = await getActiveOnlineStaffCount(pool);
                response.status(200).json({ count: activeOnlineCount });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/send_credentials',
        requirePermission(pool, 'admin:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const toEmail = requireString(request.body?.toEmail, 'toEmail');
                await requestPasswordResetLink(pool, toEmail, request.authSession?.staffUserId ?? null);
                response.status(200).json({
                    success: true,
                    message: `Password reset link queued for ${toEmail}.`
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/users/:id/password-reset-link',
        requirePermission(pool, 'admin:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const [rows] = await pool.execute<RowDataPacket[]>(
                    'SELECT id, email FROM staff_users WHERE id = ? LIMIT 1',
                    [id]
                );
                const target = rows[0];
                if (!target) {
                    throw new HttpError(404, 'Staff user not found.');
                }

                await requestPasswordResetLink(pool, target.email, request.authSession?.staffUserId ?? null);
                response.status(200).json({
                    success: true,
                    message: `Password reset link queued for ${target.email}.`
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/users/:id/reset-password',
        requirePermission(pool, 'admin:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const newPassword = requireString(request.body.password, 'password');

                if (newPassword.length < 6) {
                    throw new HttpError(400, 'Password must be at least 6 characters long.');
                }

                const bcrypt = await import('bcrypt');
                const passwordHash = await bcrypt.default.hash(newPassword, 10);

                await pool.execute(
                    'UPDATE staff_users SET password_hash = ?, version = version + 1, last_modified_at = NOW() WHERE id = ?',
                    [passwordHash, id]
                );

                response.status(200).json({
                    success: true,
                    message: 'Staff user password reset successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/users/generate_username',
        requirePermission(pool, 'admin:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const year = parseInt(request.query.year as string, 10) || new Date().getFullYear();
                const username = await generateStaffUsername(pool, year);
                response.status(200).json({ username });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/users',
        requirePermission(pool, 'admin:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const username = requireString(request.body.username, 'username');
                const email = requireString(request.body.email, 'email');
                const password = requireString(request.body.password, 'password');
                const rawRoleId = request.body.roleId || request.body.role_id;
                
                let roleId: string;
                if (typeof rawRoleId === 'number' || !isNaN(Number(rawRoleId))) {
                    const roleIndex = Number(rawRoleId);
                    const [roleRows] = await pool.execute<RowDataPacket[]>(
                        `SELECT id FROM roles ORDER BY name LIMIT 1 OFFSET ?`,
                        [roleIndex - 1]
                    );
                    if (roleRows.length === 0) {
                        throw new HttpError(400, `Role number ${roleIndex} does not exist.`);
                    }
                    roleId = roleRows[0].id;
                } else {
                    roleId = requireString(rawRoleId, 'roleId');
                }

                const firstName = requireString(request.body.firstName || request.body.first_name, 'firstName');
                const lastName = requireString(request.body.lastName || request.body.last_name, 'lastName');
                const phone = requireString(request.body.phone || request.body.phoneNumber || request.body.phone_number, 'phone');

                const user = await registerStaff(pool, id, username, email, password, roleId, firstName, lastName, phone);

                response.status(201).json({
                    message: 'Staff user registered successfully.',
                    user
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/users/:id',
        requirePermission(pool, 'admin:update'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const username = requireString(request.body.username, 'username');
                const email = requireString(request.body.email, 'email');
                const rawRoleId = request.body.roleId || request.body.role_id;
                
                let roleId: string;
                if (typeof rawRoleId === 'number' || !isNaN(Number(rawRoleId))) {
                    const roleIndex = Number(rawRoleId);
                    const [roleRows] = await pool.execute<RowDataPacket[]>(
                        `SELECT id FROM roles ORDER BY name LIMIT 1 OFFSET ?`,
                        [roleIndex - 1]
                    );
                    if (roleRows.length === 0) {
                        throw new HttpError(400, `Role number ${roleIndex} does not exist.`);
                    }
                    roleId = roleRows[0].id;
                } else {
                    roleId = requireString(rawRoleId, 'roleId');
                }

                const firstName = requireString(request.body.firstName || request.body.first_name, 'firstName');
                const lastName = requireString(request.body.lastName || request.body.last_name, 'lastName');
                const phone = requireString(request.body.phone || request.body.phoneNumber || request.body.phone_number, 'phone');

                const user = await updateStaffUser(pool, id, username, email, roleId, firstName, lastName, phone);

                response.status(200).json({
                    message: 'Staff user updated successfully.',
                    user
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/users/:id',
        requirePermission(pool, 'admin:delete'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await deleteStaffUser(pool, id);
                response.status(200).json({
                    message: 'Staff user deleted successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
