export type NotificationType = 'SYSTEM' | 'ANNOUNCEMENT' | 'EVENT';
export type TargetType = 'ALL' | 'ROLE' | 'USER';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    targetType: TargetType;
    targetRoleId: string | null;
    targetUserId: string | null;
    createdByStaffId: string | null;
    expiresAt: string | null;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
    isRead?: boolean; // Hydrated per-user
}

export interface NotificationRead {
    notificationId: string;
    staffUserId: string;
    readAt: string;
}

export interface CreateNotificationRequestBody {
    id?: unknown;
    type?: unknown;
    title?: unknown;
    message?: unknown;
    targetType?: unknown;
    targetRoleId?: unknown;
    targetUserId?: unknown;
    expiresAt?: unknown;
}
