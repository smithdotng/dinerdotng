import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type UserRole = 'owner' | 'admin';

export interface SessionUser {
    id: string;
    name: string;
    firstName: string;
    email: string;
    role: UserRole;
    /** Set while the account's email address is still unconfirmed. */
    unverified?: boolean;
}

export interface SessionData {
    user?: SessionUser;
    intendedPlan?: string;
}

const DEV_SESSION_SECRET = 'dinerdotng-dev-secret-change-in-production-32-chars-min';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('SESSION_SECRET environment variable is required in production (at least 32 characters).');
}

const SESSION_PASSWORD = (process.env.SESSION_SECRET || DEV_SESSION_SECRET).trim();
if (SESSION_PASSWORD.length < 32) {
    throw new Error(
        `SESSION_SECRET is too short (${SESSION_PASSWORD.length} characters). It must be at least 32 characters — ` +
            'set a long random value in your environment variables (e.g. Vercel › Settings › Environment Variables) and redeploy.'
    );
}

export const sessionOptions: SessionOptions = {
    password: SESSION_PASSWORD,
    cookieName: 'dinerng_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production' && process.env.USE_HTTPS !== 'false',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 14 // 14 days
    }
};

export async function getSession() {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
    const session = await getSession();
    return session.user ?? null;
}

export async function requireAuth(): Promise<SessionUser> {
    const user = await getCurrentUser();
    if (!user) redirect('/login?error=' + encodeURIComponent('Please log in to continue.'));
    return user;
}

/** Signed-in AND email confirmed. Unconfirmed accounts are sent to /verify-email. */
export async function requireVerified(): Promise<SessionUser> {
    const user = await requireAuth();
    if (user.unverified) redirect('/verify-email');
    return user;
}

export async function requireAdmin(): Promise<SessionUser> {
    const user = await requireAuth();
    if (user.role !== 'admin') redirect('/');
    return user;
}

export const homeFor = (role: UserRole) => (role === 'admin' ? '/admin' : '/dashboard');
