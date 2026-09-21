'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const FALLBACK =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c2410c"/><stop offset=".5" stop-color="#e8590c"/><stop offset="1" stop-color="#f59f00"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/></svg>'
    );

/** Small progressive enhancements: header scroll state + warm placeholder for broken photos. */
export default function Enhancer() {
    const pathname = usePathname();
    useEffect(() => {
        const header = document.querySelector('.dn-header');
        const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        const onError = (e: Event) => {
            const img = e.target as HTMLImageElement;
            if (img?.tagName === 'IMG' && !img.dataset.failed) {
                img.dataset.failed = '1';
                img.src = FALLBACK;
            }
        };
        document.addEventListener('error', onError, true);
        document.querySelectorAll('img').forEach((img) => {
            if (img.complete && img.naturalWidth === 0 && img.src && !img.dataset.failed) {
                img.dataset.failed = '1';
                img.src = FALLBACK;
            }
        });
        return () => {
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('error', onError, true);
        };
    }, [pathname]);
    return null;
}
