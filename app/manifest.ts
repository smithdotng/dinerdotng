import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Diner.ng — Nigeria’s fun spots',
        short_name: 'Diner.ng',
        description: SITE_DESCRIPTION,
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fff8f0',
        theme_color: '#e8590c',
        lang: 'en-NG',
        categories: ['food', 'lifestyle', 'travel'],
        icons: [
            { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/images/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/images/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
            { name: 'Explore spots', short_name: 'Explore', url: '/explore?source=pwa', icons: [{ src: '/images/icon-192.png', sizes: '192x192' }] },
            { name: 'Blog & offers', short_name: 'Blog', url: '/blog?source=pwa', icons: [{ src: '/images/icon-192.png', sizes: '192x192' }] },
            { name: 'Owner dashboard', short_name: 'Dashboard', url: '/dashboard?source=pwa', icons: [{ src: '/images/icon-192.png', sizes: '192x192' }] }
        ]
    };
}
