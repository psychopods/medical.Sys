import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import type { CreateNotificationRequestBody, NotificationType, TargetType } from '../types/notifications.ts';
import * as notificationsService from '../services/notificationsService.ts';

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

export function createNotificationsRouter(pool: Pool): Router {
    const router = Router();

    // 1. CREATE Notification
    router.post(
        '/',
        requirePermission(pool, 'notifications:create'),
        async (
            request: Request<unknown, unknown, CreateNotificationRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const type = requireString(request.body.type, 'type') as NotificationType;
                const title = requireString(request.body.title, 'title');
                const message = requireString(request.body.message, 'message');
                const targetType = requireString(request.body.targetType, 'targetType') as TargetType;

                const targetRoleId = optionalString(request.body.targetRoleId, 'targetRoleId');
                const targetUserId = optionalString(request.body.targetUserId, 'targetUserId');
                const expiresAt = optionalString(request.body.expiresAt, 'expiresAt');

                const createdByStaffId = request.authSession?.staffUserId ?? null;

                const notification = await notificationsService.createNotification(
                    pool,
                    id,
                    type,
                    title,
                    message,
                    targetType,
                    targetRoleId,
                    targetUserId,
                    createdByStaffId,
                    expiresAt
                );

                response.status(201).json({
                    message: 'Notification created successfully.',
                    notification
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 2. LIST user notifications
    router.get(
        '/',
        requirePermission(pool, 'notifications:read'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const staffUserId = request.authSession?.staffUserId;
                const roleId = request.authSession?.roleId;
                if (!staffUserId || !roleId) {
                    throw new HttpError(401, 'Unauthorized active session staff parameters.');
                }

                const includeRead = request.query.includeRead === 'true';

                const notifications = await notificationsService.listUserNotifications(
                    pool,
                    staffUserId,
                    roleId,
                    includeRead
                );

                response.status(200).json(notifications);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 3. MARK notification as read
    router.put(
        '/:id/read',
        requirePermission(pool, 'notifications:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const staffUserId = request.authSession?.staffUserId;
                if (!staffUserId) {
                    throw new HttpError(401, 'Unauthorized active session staff parameters.');
                }

                await notificationsService.markNotificationAsRead(pool, id, staffUserId);

                response.status(200).json({
                    message: 'Notification marked as read.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // 4. DELETE notification
    router.delete(
        '/:id',
        requirePermission(pool, 'notifications:delete'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');

                await notificationsService.deleteNotification(pool, id);

                response.status(200).json({
                    message: 'Notification deleted successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/all',
        requirePermission(pool, 'notifications:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const result = await notificationsService.listAllNotifications(pool);
                response.status(200).json({ success: true, notifications: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/reads',
        requirePermission(pool, 'notifications:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const result = await notificationsService.listAllNotificationReads(pool);
                response.status(200).json({ success: true, reads: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/reads',
        requirePermission(pool, 'notifications:create'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const notificationId = requireString(request.body.notificationId, 'notificationId');
                const staffUserId = requireString(request.body.staffUserId, 'staffUserId');

                await notificationsService.markNotificationAsReadManual(pool, notificationId, staffUserId);
                response.status(201).json({ success: true, message: 'Notification read record created successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/reads/:notificationId/:staffUserId',
        requirePermission(pool, 'notifications:delete'),
        async (request: Request<{ notificationId: string; staffUserId: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const notificationId = requireString(request.params.notificationId, 'notificationId');
                const staffUserId = requireString(request.params.staffUserId, 'staffUserId');

                await notificationsService.deleteNotificationRead(pool, notificationId, staffUserId);
                response.status(200).json({ success: true, message: 'Notification read record deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/:id',
        requirePermission(pool, 'notifications:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const result = await notificationsService.getNotification(pool, id);
                response.status(200).json({ success: true, notification: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.put(
        '/:id',
        requirePermission(pool, 'notifications:update'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const type = requireString(request.body.type, 'type') as NotificationType;
                const title = requireString(request.body.title, 'title');
                const message = requireString(request.body.message, 'message');
                const targetType = requireString(request.body.targetType, 'targetType') as TargetType;

                const targetRoleId = optionalString(request.body.targetRoleId, 'targetRoleId');
                const targetUserId = optionalString(request.body.targetUserId, 'targetUserId');
                const expiresAt = optionalString(request.body.expiresAt, 'expiresAt');

                const result = await notificationsService.updateNotification(
                    pool,
                    id,
                    type,
                    title,
                    message,
                    targetType,
                    targetRoleId,
                    targetUserId,
                    expiresAt
                );
                response.status(200).json({ success: true, message: 'Notification updated successfully.', notification: result });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
