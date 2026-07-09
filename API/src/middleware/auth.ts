import type { NextFunction, Request, Response } from 'express';
import type { Pool } from 'mysql2/promise';
import { buildSessionFromToken, loadCurrentPermissions, verifyAccessToken } from '../services/authService.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';

function readBearerToken(request: Request): string {
    // 1. Try to read from cookies (if express cookie-parser is active)
    // @ts-ignore
    const cookieToken = request.cookies?.token;
    if (cookieToken) {
        return cookieToken;
    }

    // 2. Fallback: Parse cookie manually from raw header
    const rawCookie = request.headers.cookie;
    if (rawCookie) {
        const match = rawCookie.match(/(^|; )token=([^;]*)/);
        if (match) {
            return decodeURIComponent(match[2]);
        }
    }

    // 3. Fallback: Authorization header
    const header = request.header('authorization');

    if (!header?.startsWith('Bearer ')) {
        throw new HttpError(401, 'Missing session token.');
    }

    const token = header.slice('Bearer '.length).trim();

    if (!token) {
        throw new HttpError(401, 'Missing session token.');
    }

    return token;
}

export function requireAuthenticated(pool: Pool) {
    return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
        try {
            request.authSession = await buildSessionFromToken(pool, readBearerToken(request));
            next();
        } catch (error) {
            next(toHttpError(error));
        }
    };
}

export function requirePermission(pool: Pool, permissionSlug: string) {
    return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
        try {
            const claims = verifyAccessToken(readBearerToken(request));
            const permissions = await loadCurrentPermissions(pool, claims.sub);

            if (!permissions.includes(permissionSlug)) {
                throw new HttpError(403, `Missing required permission: ${permissionSlug}`);
            }

            request.authSession = {
                sessionId: claims.sid,
                staffUserId: claims.sub,
                username: claims.username,
                email: claims.email,
                roleId: claims.roleId,
                permissions,
                issuedAt: claims.iat ? new Date(claims.iat * 1000).toISOString() : '',
                expiresAt: claims.exp ? new Date(claims.exp * 1000).toISOString() : ''
            };

            next();
        } catch (error) {
            next(toHttpError(error));
        }
    };
}
