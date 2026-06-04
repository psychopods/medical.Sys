import { randomBytes, createHash, randomUUID } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import { sendEmail } from './emailService.ts';

type StaffUserLookup = RowDataPacket & {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
};

const RESET_TOKEN_TTL_MINUTES = 60;

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function createResetOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function loadStaffUserByIdentifier(pool: Pool, identifier: string): Promise<StaffUserLookup | null> {
    const normalized = identifier.trim().toLowerCase();
    const [rows] = await pool.execute<StaffUserLookup[]>(
        `
            SELECT id, username, email, first_name, last_name
            FROM staff_users
            WHERE LOWER(email) = ? OR LOWER(username) = ?
            LIMIT 1
        `,
        [normalized, normalized]
    );

    return rows[0] ?? null;
}

async function storeResetToken(pool: Pool, staffUserId: string, token: string, requestedByStaffId: string | null): Promise<void> {
    const tokenHash = hashToken(token);
    const tokenId = randomUUID();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);
    await pool.execute(
        `
            INSERT INTO password_reset_tokens (
                id, staff_user_id, token_hash, requested_by_staff_id, expires_at, created_at, last_modified_at
            ) VALUES (
                ?, ?, ?, ?, ?, NOW(), NOW()
            )
        `,
        [tokenId, staffUserId, tokenHash, requestedByStaffId, expiresAt]
    );
}

export async function requestPasswordResetLink(
    pool: Pool,
    identifier: string,
    requestedByStaffId: string | null = null
): Promise<{ sent: boolean }> {
    const staffUser = await loadStaffUserByIdentifier(pool, identifier);

    if (!staffUser) {
        return { sent: true };
    }

    // Invalidate any active password reset tokens for this user first to prevent hash collisions
    await pool.execute(
        'UPDATE password_reset_tokens SET used_at = NOW(), last_modified_at = NOW() WHERE staff_user_id = ? AND used_at IS NULL',
        [staffUser.id]
    );

    const otp = createResetOtp();
    await storeResetToken(pool, staffUser.id, otp, requestedByStaffId);

    const recipientName = `${staffUser.first_name || ''} ${staffUser.last_name || ''}`.trim() || staffUser.username;

    await sendEmail({
        to: staffUser.email,
        subject: 'Your Password Reset Verification Code',
        text: `Hello ${recipientName},\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in ${RESET_TOKEN_TTL_MINUTES} minutes.\nIf you did not request this, you can ignore this email.`,
        html: `
            <p>Hello ${recipientName},</p>
            <p>Your 6-digit verification code is:</p>
            <h2 style="font-size: 24px; letter-spacing: 2px; color: #0066cc; margin: 20px 0;">${otp}</h2>
            <p>This code expires in ${RESET_TOKEN_TTL_MINUTES} minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
        `
    });

    return { sent: true };
}

export async function verifyPasswordResetOtp(
    pool: Pool,
    email: string,
    otp: string
): Promise<void> {
    const staffUser = await loadStaffUserByIdentifier(pool, email);
    if (!staffUser) {
        throw new HttpError(400, 'Invalid or expired OTP.');
    }

    const otpHash = hashToken(otp.trim());
    const [rows] = await pool.execute<RowDataPacket[]>(
        `
            SELECT id, expires_at, used_at
            FROM password_reset_tokens
            WHERE staff_user_id = ? AND token_hash = ?
            LIMIT 1
        `,
        [staffUser.id, otpHash]
    );

    const resetRow = rows[0];
    if (!resetRow) {
        throw new HttpError(400, 'Invalid or expired OTP.');
    }

    if (resetRow.used_at) {
        throw new HttpError(400, 'This OTP has already been used.');
    }

    const expiresAt = new Date(resetRow.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        throw new HttpError(400, 'This OTP has expired.');
    }
}

export async function resetPasswordWithOtp(
    pool: Pool,
    email: string,
    otp: string,
    newPassword: string
): Promise<void> {
    if (newPassword.length < 6) {
        throw new HttpError(400, 'Password must be at least 6 characters long.');
    }

    const staffUser = await loadStaffUserByIdentifier(pool, email);
    if (!staffUser) {
        throw new HttpError(400, 'Invalid or expired OTP.');
    }

    const otpHash = hashToken(otp.trim());
    const [rows] = await pool.execute<RowDataPacket[]>(
        `
            SELECT id, expires_at, used_at
            FROM password_reset_tokens
            WHERE staff_user_id = ? AND token_hash = ?
            LIMIT 1
        `,
        [staffUser.id, otpHash]
    );

    const resetRow = rows[0];
    if (!resetRow) {
        throw new HttpError(400, 'Invalid or expired OTP.');
    }

    if (resetRow.used_at) {
        throw new HttpError(400, 'This OTP has already been used.');
    }

    const expiresAt = new Date(resetRow.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        throw new HttpError(400, 'This OTP has expired.');
    }

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.default.hash(newPassword, 10);

    await pool.execute(
        'UPDATE staff_users SET password_hash = ?, version = version + 1, last_modified_at = NOW() WHERE id = ?',
        [passwordHash, staffUser.id]
    );

    await pool.execute(
        'UPDATE password_reset_tokens SET used_at = NOW(), last_modified_at = NOW() WHERE id = ?',
        [resetRow.id]
    );
}

export async function resetPasswordWithToken(
    pool: Pool,
    token: string,
    newPassword: string
): Promise<void> {
    if (newPassword.length < 6) {
        throw new HttpError(400, 'Password must be at least 6 characters long.');
    }

    const tokenHash = hashToken(token.trim());
    const [rows] = await pool.execute<RowDataPacket[]>(
        `
            SELECT id, staff_user_id, expires_at, used_at
            FROM password_reset_tokens
            WHERE token_hash = ?
            LIMIT 1
        `,
        [tokenHash]
    );

    const resetRow = rows[0];
    if (!resetRow) {
        throw new HttpError(400, 'Invalid or expired reset link.');
    }

    if (resetRow.used_at) {
        throw new HttpError(400, 'This reset link has already been used.');
    }

    const expiresAt = new Date(resetRow.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        throw new HttpError(400, 'This reset link has expired.');
    }

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.default.hash(newPassword, 10);

    await pool.execute('UPDATE staff_users SET password_hash = ?, version = version + 1, last_modified_at = NOW() WHERE id = ?', [passwordHash, resetRow.staff_user_id]);
    await pool.execute('UPDATE password_reset_tokens SET used_at = NOW(), last_modified_at = NOW() WHERE id = ?', [resetRow.id]);
}

