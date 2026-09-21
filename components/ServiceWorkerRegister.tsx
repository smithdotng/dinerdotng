'use client';

import { useEffect } from 'react';

/** Registers the service worker (production only, so it never caches dev builds). */
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
        const register = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
        if (document.readyState === 'complete') register();
        else window.addEventListener('load', register, { once: true });
    }, []);
    return null;
}
