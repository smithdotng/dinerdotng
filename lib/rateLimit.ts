import { headers } from 'next/headers';

// Simple in-memory limiter: best-effort on a single instance.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || now > entry.resetAt) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (entry.count >= max) return false;
    entry.count += 1;
    return true;
}

export async function getClientIp(): Promise<string> {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return h.get('x-real-ip') || 'unknown';
}

export async function enforceRateLimit(action: string, max = 20, windowMs = 15 * 60 * 1000): Promise<boolean> {
    return checkRateLimit(`${action}:${await getClientIp()}`, max, windowMs);
}

export const RATE_LIMIT_MESSAGE = 'Too many attempts from this device. Please wait a few minutes and try again.';
