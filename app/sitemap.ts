import type { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import { Spot } from '@/models/Spot';
import { Post, publishedFilter } from '@/models/Post';
import { liveFilter, SPOT_TYPE_KEYS } from '@/lib/spot';
import { siteUrl } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = siteUrl();
    const now = new Date();
    const fixed: MetadataRoute.Sitemap = [
        { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
        { url: `${base}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
        ...SPOT_TYPE_KEYS.map((t) => ({ url: `${base}/explore?type=${t}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 })),
        { url: `${base}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
        { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${base}/for-business`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 }
    ];
    try {
        await connectDB();
        const [spots, posts] = await Promise.all([
            Spot.find(liveFilter()).select('slug updatedAt').lean(),
            Post.find(publishedFilter()).select('slug updatedAt').lean()
        ]);
        return [
            ...fixed,
            ...spots.map((s) => ({ url: `${base}/spots/${s.slug}`, lastModified: s.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 })),
            ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 }))
        ];
    } catch {
        return fixed; // database unreachable (e.g. during a build) — static pages only
    }
}
