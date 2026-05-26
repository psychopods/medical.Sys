import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { AuthenticatedStaffSession, JwtSessionClaims } from '../types/auth.ts';
import { HttpError } from '../utils/httpError.ts';

type StaffAuthRow = RowDataPacket & {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    role_id: string;
    permission_slugs: string | null;
};

type PermissionRow = RowDataPacket & {
    slug: string;
};

const DEFAULT_SESSION_TTL_SECONDS = 12 * 60 * 60;

function getJwtSecret(): string {
    const secret = process.env.JWT_SESSION_SECRET;

    if (!secret || secret.trim().length < 32) {
        throw new HttpError(500, 'JWT_SESSION_SECRET must be configured with at least 32 characters.');
    }

    return secret;
}

function getSessionTtlSeconds(): number {
    const parsed = Number(process.env.SESSION_TTL_SECONDS ?? DEFAULT_SESSION_TTL_SECONDS);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_SESSION_TTL_SECONDS;
    }

    return Math.floor(parsed);
}

function parsePermissionSlugs(value: string | null): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(',')
        .map((slug) => slug.trim())
        .filter((slug) => slug.length > 0);
}

function buildSession(row: StaffAuthRow, permissions: string[], ttlSeconds: number): AuthenticatedStaffSession {
    const issuedAtMs = Date.now();
    const expiresAtMs = issuedAtMs + ttlSeconds * 1000;

    return {
        sessionId: randomUUID(),
        staffUserId: row.id,
        username: row.username,
        email: row.email,
        roleId: row.role_id,
        permissions,
        issuedAt: new Date(issuedAtMs).toISOString(),
        expiresAt: new Date(expiresAtMs).toISOString()
    };
}

export async function authenticateStaff(
    pool: Pool,
    usernameOrEmail: string,
    password: string
): Promise<{ accessToken: string; session: AuthenticatedStaffSession }> {
    const normalizedIdentifier = usernameOrEmail.trim().toLowerCase();

    const [rows] = await pool.execute<StaffAuthRow[]>(
        `
            SELECT
                su.id,
                su.username,
                su.email,
                su.password_hash,
                su.role_id,
                GROUP_CONCAT(DISTINCT p.slug ORDER BY p.slug SEPARATOR ',') AS permission_slugs
            FROM staff_users su
            LEFT JOIN role_permissions rp ON rp.role_id = su.role_id
            LEFT JOIN permissions p ON p.id = rp.permission_id
            WHERE LOWER(su.username) = ? OR LOWER(su.email) = ?
            GROUP BY su.id, su.username, su.email, su.password_hash, su.role_id
            LIMIT 1
        `,
        [normalizedIdentifier, normalizedIdentifier]
    );

    const staffUser = rows[0];

    if (!staffUser) {
        throw new HttpError(401, 'Invalid username/email or password.');
    }

    const passwordMatches = await bcrypt.compare(password, staffUser.password_hash);

    if (!passwordMatches) {
        throw new HttpError(401, 'Invalid username/email or password.');
    }

    const ttlSeconds = getSessionTtlSeconds();
    const session = buildSession(staffUser, parsePermissionSlugs(staffUser.permission_slugs), ttlSeconds);
    const claims: JwtSessionClaims = {
        sid: session.sessionId,
        sub: session.staffUserId,
        username: session.username,
        email: session.email,
        roleId: session.roleId
    };

    const accessToken = jwt.sign(claims, getJwtSecret(), {
        expiresIn: ttlSeconds,
        issuer: process.env.JWT_ISSUER ?? 'field-outreach-api',
        audience: process.env.JWT_AUDIENCE ?? 'field-outreach-pwa'
    });

    return { accessToken, session };
}

export function verifyAccessToken(accessToken: string): JwtSessionClaims {
    const decoded = jwt.verify(accessToken, getJwtSecret(), {
        issuer: process.env.JWT_ISSUER ?? 'field-outreach-api',
        audience: process.env.JWT_AUDIENCE ?? 'field-outreach-pwa'
    });

    if (typeof decoded === 'string') {
        throw new HttpError(401, 'Invalid session token.');
    }

    const partial = decoded as Partial<JwtSessionClaims>;

    if (!partial.sid || !partial.sub || !partial.username || !partial.email || !partial.roleId) {
        throw new HttpError(401, 'Invalid session token.');
    }

    return {
        sid: partial.sid,
        sub: partial.sub,
        username: partial.username,
        email: partial.email,
        roleId: partial.roleId,
        iat: typeof partial.iat === 'number' ? partial.iat : undefined,
        exp: typeof partial.exp === 'number' ? partial.exp : undefined
    };
}

export async function loadCurrentPermissions(pool: Pool, staffUserId: string): Promise<string[]> {
    const [rows] = await pool.execute<PermissionRow[]>(
        `
            SELECT DISTINCT p.slug
            FROM staff_users su
            INNER JOIN role_permissions rp ON rp.role_id = su.role_id
            INNER JOIN permissions p ON p.id = rp.permission_id
            WHERE su.id = ?
            ORDER BY p.slug
        `,
        [staffUserId]
    );

    return rows.map((row) => row.slug);
}

export async function buildSessionFromToken(pool: Pool, accessToken: string): Promise<AuthenticatedStaffSession> {
    const claims = verifyAccessToken(accessToken);
    const permissions = await loadCurrentPermissions(pool, claims.sub);

    return {
        sessionId: claims.sid,
        staffUserId: claims.sub,
        username: claims.username,
        email: claims.email,
        roleId: claims.roleId,
        permissions,
        issuedAt: claims.iat ? new Date(claims.iat * 1000).toISOString() : '',
        expiresAt: claims.exp ? new Date(claims.exp * 1000).toISOString() : ''
    };
}

export async function registerStaff(
    pool: Pool,
    id: string,
    username: string,
    email: string,
    password: string,
    roleId: string
): Promise<{
    id: string;
    username: string;
    email: string;
    roleId: string;
    version: number;
    createdAt: string;
}> {
    // 1. UUID validation (must be client-side generated UUIDv4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, 'Client-side generated UUIDv4 is required for ID.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new HttpError(400, 'Invalid email address format.');
    }

    if (password.length < 6) {
        throw new HttpError(400, 'Password must be at least 6 characters long.');
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Check if role exists
    const [roleRows] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM roles WHERE id = ? LIMIT 1',
        [roleId]
    );
    if (roleRows.length === 0) {
        throw new HttpError(400, 'The specified Role ID does not exist.');
    }

    // 5. Check if username or email is already taken
    const [existingRows] = await pool.execute<RowDataPacket[]>(
        'SELECT username, email FROM staff_users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1',
        [normalizedUsername.toLowerCase(), normalizedEmail]
    );

    if (existingRows.length > 0) {
        const match = existingRows[0];
        if (match.username.toLowerCase() === normalizedUsername.toLowerCase()) {
            throw new HttpError(409, 'Username is already taken.');
        }
        if (match.email.toLowerCase() === normalizedEmail) {
            throw new HttpError(409, 'Email is already registered.');
        }
    }

    // 6. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 7. Insert the user
    const createdAt = new Date().toISOString();
    await pool.execute(
        `INSERT INTO staff_users (id, username, email, password_hash, role_id, version)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, normalizedUsername, normalizedEmail, passwordHash, roleId]
    );

    return {
        id,
        username: normalizedUsername,
        email: normalizedEmail,
        roleId,
        version: 1,
        createdAt
    };
}
