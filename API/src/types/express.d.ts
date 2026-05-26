import type { AuthenticatedStaffSession } from './auth.ts';

declare global {
    namespace Express {
        interface Request {
            authSession?: AuthenticatedStaffSession;
        }
    }
}

export {};
