import type { Metadata, Viewport } from 'next';
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from '@/lib/seo';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl()),
    title: { default: TITLE, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: ['restaurants in Nigeria', 'lounges', 'sitouts', 'Abuja restaurants', 'Lagos restaurants', 'QR menu', 'book a table', 'Nigerian food', 'hotels', 'event venues'],
    alternates: { canonical: '/' },
    manifest: '/manifest.webmanifest',
    icons: {
        icon: [
            { url: '/images/favicon-32.png', sizes: '32x32', type: 'image/png' },
            { url: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/images/icon-512.png', sizes: '512x512', type: 'image/png' }
        ],
        apple: [{ url: '/images/apple-touch-icon.png', sizes: '180x180' }]
    },
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'black-translucent' },
    formatDetection: { telephone: false },
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        locale: 'en_NG',
        url: '/',
        title: TITLE,
        description: SITE_DESCRIPTION,
        images: [DEFAULT_OG_IMAGE]
    },
    twitter: { card: 'summary_large_image', title: TITLE, description: SITE_DESCRIPTION, images: [DEFAULT_OG_IMAGE.url] }
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#e8590c' },
        { media: '(prefers-color-scheme: dark)', color: '#3b1d0e' }
    ],
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@1,500;1,600;1,700&display=swap"
                    rel="stylesheet"
                />
                {/* Theme vendors carried over from the template (public/assets/vendors) */}
                <link rel="stylesheet" href="/assets/vendors/bootstrap/css/bootstrap.min.css" />
                <link rel="stylesheet" href="/assets/vendors/fontawesome6/css/all.min.css" />
                <link rel="stylesheet" href="/assets/vendors/animate/animate.min.css" />
                {/* Diner.ng warm theme — loaded after the vendors so it wins */}
                <link rel="stylesheet" href="/css/diner.css" />
            </head>
            <body>
                {children}
                <ServiceWorkerRegister />
            </body>
        </html>
    );
}
