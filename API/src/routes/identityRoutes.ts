import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import type { ResolveIdentityRequestBody } from '../types/identity.ts';
import { resolveIdentity } from '../services/identityService.ts';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }

    return value.trim();
}

function requireBoolean(value: unknown, fieldName: string): boolean {
    if (typeof value !== 'boolean') {
        throw new HttpError(400, `${fieldName} is required and must be a boolean.`);
    }

    return value;
}

function optionalString(value: unknown, fieldName: string): string | null {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} must be a non-empty string if provided.`);
    }

    return value.trim();
}

export function createIdentityRouter(pool: Pool): Router {
    const router = Router();

    router.post(
        '/resolve',
        requirePermission(pool, 'biometrics:read'),
        async (
            request: Request<unknown, unknown, ResolveIdentityRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const templateBase64 = requireString(request.body.templateBase64, 'templateBase64');
                const localMatched = requireBoolean(request.body.localMatched, 'localMatched');
                const localChildId = optionalString(request.body.localChildId, 'localChildId');
                const runCentralLookup = request.body.runCentralLookup === undefined
                    ? true
                    : requireBoolean(request.body.runCentralLookup, 'runCentralLookup');

                const result = await resolveIdentity(
                    pool,
                    templateBase64,
                    localMatched,
                    localChildId,
                    runCentralLookup
                );

                response.status(200).json(result);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
