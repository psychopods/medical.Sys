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
};

export type SignupResponseBody = {
    message: string;
    user: {
        id: string;
        username: string;
        email: string;
        roleId: string;
        version: number;
        createdAt: string;
    };
};
