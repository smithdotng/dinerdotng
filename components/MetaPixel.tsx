'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { PixelParams, QueuedPixelEvent, StandardEvent } from '@/lib/pixel';

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const COOKIE = 'dn_px';
// Back-office pages are not marketing traffic.
const UNTRACKED = /^\/(admin|print)(\/|$)/;

/** Run fn once the Meta script stub exists (it loads after hydration). */
function whenReady(fn: () => void, tries = 50) {
    if (!PIXEL_ID || typeof window === 'undefined') return;
    if (window.fbq) return fn();
    if (tries > 0) setTimeout(() => whenReady(fn, tries - 1), 100);
}

/** Fire a standard event from client code. */
export function trackPixel(name: StandardEvent, params?: PixelParams, eventID?: string) {
    whenReady(() => {
        if (UNTRACKED.test(window.location.pathname)) return;
        if (eventID) window.fbq!('track', name, params || {}, { eventID });
        else window.fbq!('track', name, params || {});
    });
}

/** Fire events the server queued before a redirect, then clear the queue. */
function flushQueued() {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
    if (!match) return;
    document.cookie = `${COOKIE}=; Max-Age=0; path=/`;
    try {
        const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
        const list = JSON.parse(json) as QueuedPixelEvent[];
        list.forEach((e) => trackPixel(e.name, e.params, e.id));
    } catch {
        /* malformed cookie — ignore */
    }
}

function parseParams(raw: string | undefined): PixelParams | undefined {
    if (!raw) return undefined;
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

/**
 * Loads the Meta Pixel, sends PageView on every client-side navigation, flushes
 * server-queued events, and wires two declarative hooks:
 *   - any <form data-pixel="Event" data-pixel-params='{...}'> fires on submit
 *   - any other element with data-pixel fires on click
 *   - tel:, WhatsApp and mailto: links fire Contact automatically
 */
export default function MetaPixel() {
    const pathname = usePathname();
    const search = useSearchParams();
    const first = useRef(true);

    // PageView on route changes (the base snippet sends the first one) + queued events.
    useEffect(() => {
        if (!PIXEL_ID) return;
        if (first.current) first.current = false;
        else if (!UNTRACKED.test(pathname)) whenReady(() => window.fbq!('track', 'PageView'));
        flushQueued();
    }, [pathname, search]);

    // Declarative events via data-pixel attributes and contact links.
    useEffect(() => {
        if (!PIXEL_ID) return;
        const onSubmit = (ev: Event) => {
            const form = ev.target as HTMLElement;
            const name = form?.dataset?.pixel as StandardEvent | undefined;
            if (name) trackPixel(name, parseParams(form.dataset.pixelParams));
        };
        const onClick = (ev: MouseEvent) => {
            const el = (ev.target as HTMLElement)?.closest?.('[data-pixel], a[href]') as HTMLElement | null;
            if (!el || el.tagName === 'FORM') return;
            if (el.dataset.pixel) return trackPixel(el.dataset.pixel as StandardEvent, parseParams(el.dataset.pixelParams));
            const href = el.getAttribute('href') || '';
            const method = href.startsWith('tel:') ? 'phone' : /wa\.me\/|whatsapp\.com\//.test(href) ? 'whatsapp' : href.startsWith('mailto:') ? 'email' : '';
            if (method) trackPixel('Contact', { content_name: method, content_category: window.location.pathname });
        };
        document.addEventListener('submit', onSubmit, true);
        document.addEventListener('click', onClick, true);
        return () => {
            document.removeEventListener('submit', onSubmit, true);
            document.removeEventListener('click', onClick, true);
        };
    }, []);

    if (!PIXEL_ID || UNTRACKED.test(pathname)) return null;
    return (
        <>
            <Script id="meta-pixel" strategy="afterInteractive">
                {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
            </Script>
            <noscript>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
            </noscript>
        </>
    );
}

/** Drop into a server page to fire one event when it renders, e.g. ViewContent or Search. */
export function PixelEvent({ name, params, id }: { name: StandardEvent; params?: PixelParams; id?: string }) {
    const key = JSON.stringify([name, params, id]);
    useEffect(() => {
        trackPixel(name, params, id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return null;
}
