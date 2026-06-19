import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { requireAuthenticated } from '../middleware/auth.ts';
import { toHttpError } from '../utils/httpError.ts';
import type { SyncDeltaQuery, SyncPushRequestBody } from '../types/sync.ts';
import { getSyncDelta, pushSyncBatch } from '../services/syncService.ts';

export function createSyncRouter(pool: Pool): Router {
    const router = Router();

    router.post(
        '/push',
        requireAuthenticated(pool),
        async (
            request: Request<unknown, unknown, SyncPushRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const result = await pushSyncBatch(pool, request.body ?? {});
                response.status(200).json({
                    message: 'Sync push accepted.',
                    ...result
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/delta',
        requireAuthenticated(pool),
        async (
            request: Request<unknown, unknown, unknown, SyncDeltaQuery>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const delta = await getSyncDelta(pool, request.query.since);
                response.status(200).json(delta);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
