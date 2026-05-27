import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import type {
    EnrollFingerprintRequestBody,
    IdentifyOneToManyRequestBody,
    VerifyOneToOneRequestBody
} from '../types/biometrics.ts';
import * as biometricsService from '../services/biometricsService.ts';

function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value.trim();
}

function requireInteger(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new HttpError(400, `${fieldName} is required and must be an integer.`);
    }
    return value;
}

function optionalInteger(value: unknown, fieldName: string): number | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new HttpError(400, `${fieldName} must be an integer if provided.`);
    }
    return value;
}

function requireNumber(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new HttpError(400, `${fieldName} is required and must be a number.`);
    }
    return value;
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

function optionalIntegerNoNull(value: unknown, fieldName: string): number | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new HttpError(400, `${fieldName} must be an integer if provided.`);
    }
    return value;
}

export function createBiometricsRouter(pool: Pool): Router {
    const router = Router();

    router.post(
        '/enroll',
        requirePermission(pool, 'biometrics:create'),
        async (
            request: Request<unknown, unknown, EnrollFingerprintRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const childId = requireString(request.body.childId, 'childId');
                const fingerIndex = requireInteger(request.body.fingerIndex, 'fingerIndex');
                const templateBase64 = requireString(request.body.templateBase64, 'templateBase64');
                const qualityScore = optionalInteger(request.body.qualityScore, 'qualityScore');

                const result = await biometricsService.enrollFingerprint(
                    pool,
                    id,
                    childId,
                    fingerIndex,
                    templateBase64,
                    qualityScore
                );

                response.status(201).json(result);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.get(
        '/child/:childId',
        requirePermission(pool, 'biometrics:read'),
        async (request: Request<{ childId: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const childId = requireString(request.params.childId, 'childId');
                const result = await biometricsService.listChildFingerprints(pool, childId);
                response.status(200).json(result);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/verify-1to1',
        requirePermission(pool, 'biometrics:read'),
        async (
            request: Request<unknown, unknown, VerifyOneToOneRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const childId = requireString(request.body.childId, 'childId');
                const templateBase64 = requireString(request.body.templateBase64, 'templateBase64');
                const matched = requireBoolean(request.body.matched, 'matched');
                const score = requireNumber(request.body.score, 'score');
                const threshold = requireNumber(request.body.threshold, 'threshold');
                const fingerIndex = optionalIntegerNoNull(request.body.fingerIndex, 'fingerIndex');

                const result = await biometricsService.verifyOneToOne(
                    pool,
                    childId,
                    templateBase64,
                    matched,
                    score,
                    threshold,
                    fingerIndex
                );

                response.status(200).json(result);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.post(
        '/identify-1toN',
        requirePermission(pool, 'biometrics:read'),
        async (
            request: Request<unknown, unknown, IdentifyOneToManyRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const templateBase64 = requireString(request.body.templateBase64, 'templateBase64');
                const matched = requireBoolean(request.body.matched, 'matched');
                const score = requireNumber(request.body.score, 'score');
                const threshold = requireNumber(request.body.threshold, 'threshold');
                const candidateChildId = optionalString(request.body.candidateChildId, 'candidateChildId');
                const candidateFingerprintId = optionalString(request.body.candidateFingerprintId, 'candidateFingerprintId');

                const result = await biometricsService.identifyOneToMany(
                    pool,
                    templateBase64,
                    matched,
                    score,
                    threshold,
                    candidateChildId,
                    candidateFingerprintId
                );

                response.status(200).json(result);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    router.delete(
        '/:id',
        requirePermission(pool, 'biometrics:delete'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await biometricsService.deleteFingerprint(pool, id);
                response.status(200).json({ message: 'Fingerprint record deleted successfully.' });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
