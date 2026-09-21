import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/admin', '/api/', '/print/', '/onboarding', '/reservations/', '/login', '/register', '/uploads/'] }],
        sitemap: `${siteUrl()}/sitemap.xml`,
        host: siteUrl()
    };
}
