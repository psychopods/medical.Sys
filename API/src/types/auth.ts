export type AuthenticatedStaffSession = {
    sessionId: string;
    staffUserId: string;
    username: string;
    email: string;
    roleId: string;
    permissions: string[];
    issuedAt: string;
    expiresAt: string;
};

export type LoginRequestBody = {
    usernameOrEmail?: unknown;
    password?: unknown;
};

export type LoginResponseBody = {
    accessToken: string;
    session: AuthenticatedStaffSession;
    localSession: {
        storageKey: string;
        permissionCacheKey: string;
        expiresAt: string;
    };
    success?: boolean;
    token?: string;
    user?: {
        user_id: string;
        id: string;
        username: string;
        email: string;
        role_id: string;
        first_name: string;
        last_name: string;
        phone_number: string;
        role: string;
        permissions: string[];
    };
};

export type JwtSessionClaims = {
    sid: string;
    sub: string;
    username: string;
    email: string;
    roleId: string;
    iat?: number;
    exp?: number;
};

export type SignupRequestBody = {
    id?: unknown;
    username?: unknown;
    email?: unknown;
    password?: unknown;
    roleId?: unknown;
    firstName?: unknown;
    first_name?: unknown;
    lastName?: unknown;
    last_name?: unknown;
    phone?: unknown;
    phoneNumber?: unknown;
    phone_number?: unknown;
};

export type SignupResponseBody = {
    message: string;
    user: {
        id: string;
        username: string;
        email: string;
        roleId: string;
        firstName: string;
        lastName: string;
        phone: string;
        version: number;
        createdAt: string;
    };
};

export type StaffUserDetail = {
    id: string;
    username: string;
    email: string;
    roleId: string;
    roleName: string;
    firstName: string;
    lastName: string;
    phone: string;
    securityStatus: string;
    version: number;
    createdAt: string;
    lastActive: string | null;
};
