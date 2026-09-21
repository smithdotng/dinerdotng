import { Spot } from '@/models/Spot';
import type { IPost } from '@/models/Post';
import type { PostDraft } from '@/components/PostEditor';

export async function spotOptions() {
    const spots = await Spot.find().select('name city').sort({ name: 1 }).lean();
    return spots.map((s) => ({ id: String(s._id), name: s.name, city: s.city }));
}

// datetime-local / date input values in Lagos time (UTC+1)
const lagos = (d?: Date | null) => (d ? new Date(new Date(d).getTime() + 60 * 60 * 1000).toISOString() : '');

export function toDraft(p: IPost): PostDraft {
    return {
        id: String(p._id),
        title: p.title,
        slug: p.slug,
        type: p.type,
        excerpt: p.excerpt,
        content: p.content,
        coverImage: p.coverImage,
        tags: p.tags,
        spot: p.spot ? String(p.spot) : '',
        featured: p.featured,
        status: p.status,
        publishedAt: lagos(p.publishedAt).slice(0, 16),
        rating: p.rating,
        verdict: p.verdict,
        promoCode: p.promoCode,
        validUntil: lagos(p.validUntil).slice(0, 10),
        ctaLabel: p.ctaLabel,
        ctaUrl: p.ctaUrl
    };
}
