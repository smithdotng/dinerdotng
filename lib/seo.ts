import type { Metadata } from 'next';

export const SITE_NAME = 'Diner.ng';
export const SITE_TAGLINE = 'Nigeria’s finest tables, reserved for you';
export const SITE_DESCRIPTION =
    'Discover Nigeria’s finest restaurants, lounges and hotel dining. Browse the menu before you arrive, read verified guest reviews and reserve your table on Diner.ng.';
/** Official Diner.ng accounts (handle is the same everywhere). */
export const SOCIAL = {
    handle: 'dinerdotng',
    instagram: 'https://instagram.com/dinerdotng',
    x: 'https://x.com/dinerdotng',
    facebook: 'https://facebook.com/dinerdotng',
    whatsappDisplay: '0909 235 7149',
    whatsapp: 'https://wa.me/2349092357149'
} as const;
export const SOCIAL_PROFILES = [SOCIAL.instagram, SOCIAL.x, SOCIAL.facebook];

export const DEFAULT_OG_IMAGE = { url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Diner.ng — Nigeria’s finest tables, reserved for you' };

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
        twitter: { card: 'summary_large_image', site: `@${SOCIAL.handle}`, title: opts.title, description, images: images.map((i) => i.url) },
        ...(opts.noindex ? { robots: { index: false, follow: false } } : {})
    };
}
