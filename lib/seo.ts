import type { Metadata } from 'next';

export const SITE_NAME = 'Diner.ng';
export const SITE_TAGLINE = 'Nigeria’s fun spots, one table away';
export const SITE_DESCRIPTION =
    'Discover Nigeria’s best restaurants, lounges, sitouts, hotels and event hotspots. See the menu before you go, scan QR menus, rate your experience and book a table on Diner.ng.';
export const DEFAULT_OG_IMAGE = { url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Diner.ng — Nigeria’s fun spots, one table away' };

/** Absolute site URL for metadata, canonical links and the sitemap. */
export function siteUrl() {
    const raw =
        process.env.APP_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
        'https://diner.ng';
    return raw.replace(/\/$/, '');
}

/**
 * Per-page SEO: title, description, canonical URL, Open Graph and Twitter card.
 * (Next.js replaces — not merges — a parent's openGraph object, so every page builds a complete one here.)
 */
export function pageMeta(opts: {
    title: string;
    description?: string;
    path: string;
    image?: string | null;
    imageAlt?: string;
    type?: 'website' | 'article';
    publishedTime?: string;
    authors?: string[];
    tags?: string[];
    noindex?: boolean;
}): Metadata {
    const description = (opts.description || SITE_DESCRIPTION).slice(0, 300);
    const images = opts.image ? [{ url: opts.image, alt: opts.imageAlt || opts.title }] : [DEFAULT_OG_IMAGE];
    return {
        title: opts.title,
        description,
        alternates: { canonical: opts.path },
        openGraph: {
            type: opts.type || 'website',
            siteName: SITE_NAME,
            locale: 'en_NG',
            url: opts.path,
            title: opts.title,
            description,
            images,
            ...(opts.type === 'article' ? { publishedTime: opts.publishedTime, authors: opts.authors, tags: opts.tags } : {})
        },
        twitter: { card: 'summary_large_image', title: opts.title, description, images: images.map((i) => i.url) },
        ...(opts.noindex ? { robots: { index: false, follow: false } } : {})
    };
}
