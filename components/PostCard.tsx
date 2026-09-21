import Link from 'next/link';
import { POST_TYPES, type IPost } from '@/models/Post';
import { IMAGES } from '@/lib/images';
import { fmtDate } from '@/lib/format';
import { readingTime } from '@/lib/markdown';

const FALLBACK: Record<string, string> = { article: IMAGES.food.spread, review: IMAGES.places.diningRoom, promo: IMAGES.food.cocktail };

export default function PostCard({ p, spotName }: { p: IPost; spotName?: string }) {
    const t = POST_TYPES[p.type];
    return (
        <Link href={`/blog/${p.slug}`} className="spot-card post-card">
            <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.coverImage || FALLBACK[p.type]} alt={p.title} loading="lazy" />
                <div className="badges">
                    <span className={`pill ${p.type === 'promo' ? 'pill-featured' : 'pill-type'}`}><i className={`fas ${t.icon}`}></i> {t.label}</span>
                    {p.type === 'review' && p.rating ? <span className="pill pill-type"><i className="fas fa-star" style={{ color: 'var(--dn-accent)' }}></i> {p.rating}/5</span> : null}
                </div>
            </div>
            <div className="body">
                <h4>{p.title}</h4>
                {p.excerpt && <p className="tagline">{p.excerpt}</p>}
                <div className="foot">
                    <span className="text-muted-dn small">{p.publishedAt ? fmtDate(p.publishedAt) : ''} · {readingTime(p.content)} min read</span>
                    {spotName && <span className="pill pill-soft text-truncate" style={{ maxWidth: 140 }}><i className="fas fa-location-dot"></i> {spotName}</span>}
                </div>
            </div>
        </Link>
    );
}
