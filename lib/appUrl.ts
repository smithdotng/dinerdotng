import { headers } from 'next/headers';

/** Public base URL, used for QR codes and payment redirects. */
export async function appUrl() {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
    // Vercel system env vars (production domain first, then this deployment's URL)
    if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host') || process.env.VERCEL_URL || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
}
