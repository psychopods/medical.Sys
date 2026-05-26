import type { AuthenticatedStaffSession, LoginResponseBody } from '../types/auth.ts';

const SESSION_STORAGE_KEY = 'field_outreach.auth.session.v1';
const PERMISSION_CACHE_KEY = 'field_outreach.auth.permissions.v1';

export type LocalSessionSnapshot = {
    accessToken: string;
    session: AuthenticatedStaffSession;
};

function canUseLocalStorage(): boolean {
    try {
        return typeof localStorage !== 'undefined';
    } catch {
        return false;
    }
}

export function saveLocalSession(loginResponse: LoginResponseBody): boolean {
    try {
        if (!canUseLocalStorage()) {
            return false;
        }

        const snapshot: LocalSessionSnapshot = {
            accessToken: loginResponse.accessToken,
            session: loginResponse.session
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
        localStorage.setItem(PERMISSION_CACHE_KEY, JSON.stringify(loginResponse.session.permissions));
        return true;
    } catch {
        return false;
    }
}

export function loadLocalSession(): LocalSessionSnapshot | null {
    try {
        if (!canUseLocalStorage()) {
            return null;
        }

        const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);

        if (!rawSession) {
            return null;
        }

        const parsed = JSON.parse(rawSession) as Partial<LocalSessionSnapshot>;

        if (!parsed.accessToken || !parsed.session?.staffUserId || !parsed.session.expiresAt) {
            clearLocalSession();
            return null;
        }

        if (Date.parse(parsed.session.expiresAt) <= Date.now()) {
            clearLocalSession();
            return null;
        }

        return parsed as LocalSessionSnapshot;
    } catch {
        clearLocalSession();
        return null;
    }
}

export function loadCachedPermissions(): string[] {
    try {
        if (!canUseLocalStorage()) {
            return [];
        }

        const rawPermissions = localStorage.getItem(PERMISSION_CACHE_KEY);

        if (!rawPermissions) {
            return [];
        }

        const parsed = JSON.parse(rawPermissions);
        return Array.isArray(parsed) ? parsed.filter((slug) => typeof slug === 'string') : [];
    } catch {
        return [];
    }
}

export function hasLocalPermission(permissionSlug: string): boolean {
    return loadCachedPermissions().includes(permissionSlug);
}

export function clearLocalSession(): void {
    try {
        if (!canUseLocalStorage()) {
            return;
        }

        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(PERMISSION_CACHE_KEY);
    } catch {
        return;
    }
}
