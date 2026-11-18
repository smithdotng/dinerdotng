// Meta Pixel — shared types plus a server-side queue for conversion events.
//
// Most conversions on Diner.ng finish in a Server Action or Route Handler that
// ends in a redirect, so there is no client render in which to call fbq().
// Instead the server drops the event into a short-lived cookie and
// <MetaPixel /> fires it on the next page the browser loads.

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
export const PIXEL_COOKIE = 'dn_px';

export type StandardEvent =
    | 'AddPaymentInfo'
    | 'CompleteRegistration'
    | 'Contact'
    | 'InitiateCheckout'
    | 'Lead'
    | 'Purchase'
    | 'Schedule'
    | 'Search'
    | 'StartTrial'
    | 'SubmitApplication'
    | 'Subscribe'
    | 'ViewContent';

export type PixelParams = Record<string, string | number | boolean | string[]>;

export interface QueuedPixelEvent {
    name: StandardEvent;
    params?: PixelParams;
    /** Event ID for deduplication (also lets you add the Conversions API later). */
    id?: string;
}

const COOKIE_OPTS = {
    path: '/',
    maxAge: 600, // 10 minutes is plenty to reach the next page
    sameSite: 'lax' as const,
    httpOnly: false, // read by <MetaPixel /> in the browser
    secure: process.env.NODE_ENV === 'production'
};

// base64url keeps the cookie value free of characters that need escaping.
function decode(raw: string | undefined): QueuedPixelEvent[] {
    if (!raw) return [];
    try {
        const list = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}
const encode = (list: QueuedPixelEvent[]) => Buffer.from(JSON.stringify(list.slice(-5))).toString('base64url');

/** Queue an event from a Server Action; it fires on the page the action redirects to. */
export async function queuePixelEvent(event: QueuedPixelEvent): Promise<void> {
    if (!PIXEL_ID) return;
    const jar = await cookies();
    jar.set(PIXEL_COOKIE, encode([...decode(jar.get(PIXEL_COOKIE)?.value), event]), COOKIE_OPTS);
}

/** Queue an event on a Route Handler response (e.g. the Flutterwave return redirect). */
export async function withPixelEvent(res: NextResponse, event: QueuedPixelEvent): Promise<NextResponse> {
    if (!PIXEL_ID) return res;
    const jar = await cookies();
    res.cookies.set(PIXEL_COOKIE, encode([...decode(jar.get(PIXEL_COOKIE)?.value), event]), COOKIE_OPTS);
    return res;
}
