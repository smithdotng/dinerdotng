import type { Metadata, Viewport } from 'next';

const SITE_URL = process.env.APP_URL || 'https://diner.ng';
const TITLE = 'Diner.ng — Discover, scan the menu, book a table';
const DESCRIPTION =
    'Discover the best restaurants, hotels and event hotspots in Nigeria. Scan QR menus, rate your experience and book a table on Diner.ng.';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: { default: TITLE, template: '%s | Diner.ng' },
    description: DESCRIPTION,
    icons: { icon: [{ url: '/images/favicon-32.png', sizes: '32x32' }, { url: '/images/icon-512.png', sizes: '512x512' }], apple: '/images/apple-touch-icon.png' },
    openGraph: { type: 'website', siteName: 'Diner.ng', title: TITLE, description: DESCRIPTION, images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }] }
};

export const viewport: Viewport = { themeColor: '#e8590c' };

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
            <body>{children}</body>
        </html>
    );
}
