import type { Pool, RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../utils/httpError.ts';
import type { Notification, NotificationType, TargetType } from '../types/notifications.ts';

function validateUUIDv4(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new HttpError(400, `Client-side generated UUIDv4 is required for ${fieldName}.`);
    }
}

export async function createNotification(
    pool: Pool,
    id: string,
    type: NotificationType,
    title: string,
    message: string,
    targetType: TargetType,
    targetRoleId: string | null,
    targetUserId: string | null,
    createdByStaffId: string | null,
    expiresAt: string | null
): Promise<Notification> {
    validateUUIDv4(id, 'notification ID');

    if (!['SYSTEM', 'ANNOUNCEMENT', 'EVENT'].includes(type)) {
        throw new HttpError(400, "Notification type must be 'SYSTEM', 'ANNOUNCEMENT', or 'EVENT'.");
    }
    if (!['ALL', 'ROLE', 'USER'].includes(targetType)) {
        throw new HttpError(400, "Target type must be 'ALL', 'ROLE', or 'USER'.");
    }

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    if (!trimmedTitle) {
        throw new HttpError(400, 'Title cannot be empty.');
    }
    if (!trimmedMessage) {
        throw new HttpError(400, 'Message cannot be empty.');
    }

    // Validate relationships
    if (targetType === 'ROLE') {
        if (!targetRoleId) {
            throw new HttpError(400, 'targetRoleId is required when targetType is ROLE.');
        }
        const [roleCheck] = await pool.execute<RowDataPacket[]>(
            'SELECT 1 FROM roles WHERE id = ? LIMIT 1',
            [targetRoleId]
        );
        if (roleCheck.length === 0) {
            throw new HttpError(400, `Target role with ID '${targetRoleId}' does not exist.`);
        }
    } else {
        targetRoleId = null;
    }

    if (targetType === 'USER') {
        if (!targetUserId) {
            throw new HttpError(400, 'targetUserId is required when targetType is USER.');
        }
        const [userCheck] = await pool.execute<RowDataPacket[]>(
            'SELECT 1 FROM staff_users WHERE id = ? LIMIT 1',
            [targetUserId]
        );
        if (userCheck.length === 0) {
            throw new HttpError(400, `Target user with ID '${targetUserId}' does not exist.`);
        }
    } else {
        targetUserId = null;
    }

    if (createdByStaffId) {
        const [staffCheck] = await pool.execute<RowDataPacket[]>(
            'SELECT 1 FROM staff_users WHERE id = ? LIMIT 1',
            [createdByStaffId]
        );
        if (staffCheck.length === 0) {
            throw new HttpError(400, `Creator staff user with ID '${createdByStaffId}' does not exist.`);
        }
    }

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.getTime())) {
        throw new HttpError(400, 'Invalid expiresAt timestamp format.');
    }

    const mysqlExpiresAt = parsedExpiresAt ? parsedExpiresAt.toISOString().slice(0, 19).replace('T', ' ') : null;

    await pool.execute(
        `INSERT INTO notifications (id, type, title, message, target_type, target_role_id, target_user_id, created_by_staff_id, expires_at, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, type, trimmedTitle, trimmedMessage, targetType, targetRoleId, targetUserId, createdByStaffId, mysqlExpiresAt]
    );

    // Retrieve full record to return
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, type, title, message, target_type, target_role_id, target_user_id, created_by_staff_id, expires_at, version, created_at, last_modified_at
         FROM notifications WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    const createdNotification: Notification = {
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        targetType: row.target_type,
        targetRoleId: row.target_role_id,
        targetUserId: row.target_user_id,
        createdByStaffId: row.created_by_staff_id,
        expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
        version: row.version,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString()
    };

    return createdNotification;
}

export async function listUserNotifications(
    pool: Pool,
    staffUserId: string,
    roleId: string,
    includeRead: boolean
): Promise<Notification[]> {
    let query = `
        SELECT n.id, n.type, n.title, n.message, n.target_type, n.target_role_id, n.target_user_id, n.created_by_staff_id, n.expires_at, n.version, n.created_at, n.last_modified_at,
               CASE WHEN nr.read_at IS NOT NULL THEN 1 ELSE 0 END as is_read
        FROM notifications n
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.staff_user_id = ?
        WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
          AND (n.target_type = 'ALL' OR (n.target_type = 'ROLE' AND n.target_role_id = ?) OR (n.target_type = 'USER' AND n.target_user_id = ?))
    `;
    const params: string[] = [staffUserId, roleId, staffUserId];

    if (!includeRead) {
        query += ' AND nr.read_at IS NULL';
    }

    query += ' ORDER BY n.created_at DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return rows.map((row) => ({
        id: row.id,
        type: row.type as NotificationType,
        title: row.title,
        message: row.message,
        targetType: row.target_type as TargetType,
        targetRoleId: row.target_role_id,
        targetUserId: row.target_user_id,
        createdByStaffId: row.created_by_staff_id,
        expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
        version: row.version,
        createdAt: new Date(row.created_at).toISOString(),
        lastModifiedAt: new Date(row.last_modified_at).toISOString(),
        isRead: row.is_read === 1
    }));
}

export async function markNotificationAsRead(
    pool: Pool,
    notificationId: string,
    staffUserId: string
): Promise<void> {
    const [check] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM notifications WHERE id = ? LIMIT 1',
        [notificationId]
    );
    if (check.length === 0) {
        throw new HttpError(404, `Notification with ID '${notificationId}' not found.`);
    }

    await pool.execute(
        'INSERT IGNORE INTO notification_reads (notification_id, staff_user_id, read_at) VALUES (?, ?, NOW())',
        [notificationId, staffUserId]
    );
}

export async function deleteNotification(pool: Pool, notificationId: string): Promise<void> {
    const [check] = await pool.execute<RowDataPacket[]>(
        'SELECT 1 FROM notifications WHERE id = ? LIMIT 1',
        [notificationId]
    );
    if (check.length === 0) {
        throw new HttpError(404, `Notification with ID '${notificationId}' not found.`);
    }

    await pool.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);
}
