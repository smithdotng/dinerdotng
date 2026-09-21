import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { Post, POST_TYPES, publishedFilter, type IPost } from '@/models/Post';
import { Spot, type ISpot } from '@/models/Spot';
import { IMAGES } from '@/lib/images';
import { fmtDate } from '@/lib/format';
import { readingTime, renderMarkdown } from '@/lib/markdown';
import { isLive } from '@/lib/spot';
import Stars from '@/components/Stars';
import SpotCard from '@/components/SpotCard';
import PostCard from '@/components/PostCard';
import { CopyButton } from '@/components/ClientBits';

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
    await connectDB();
    const post = await Post.findOne({ slug }).lean<IPost>();
    if (!post) return null;
    const isPublic = post.status === 'published' && post.publishedAt && new Date(post.publishedAt) <= new Date();
    if (isPublic) return { post, preview: false };
    const u = await getCurrentUser();
    return u?.role === 'admin' ? { post, preview: true } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const f = await load((await params).slug);
    if (!f) return { title: 'Post not found' };
    const { post } = f;
    return {
        title: post.title,
        description: post.excerpt,
        openGraph: { type: 'article', title: post.title, description: post.excerpt, images: post.coverImage ? [post.coverImage] : undefined, publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined }
    };
}

export default async function BlogPost({ params }: { params: Params }) {
    const found = await load((await params).slug);
    if (!found) notFound();
    const { post, preview } = found;
    if (!preview) await Post.updateOne({ _id: post._id }, { $inc: { views: 1 } });

    const [spot, related] = await Promise.all([
        post.spot ? Spot.findById(post.spot).lean<ISpot>() : null,
        Post.find({ ...publishedFilter(), _id: { $ne: post._id }, $or: [{ type: post.type }, { tags: { $in: post.tags } }] }).sort({ publishedAt: -1 }).limit(3).lean<IPost[]>()
    ]);
    const t = POST_TYPES[post.type];
    const expired = post.type === 'promo' && post.validUntil && new Date(post.validUntil) < new Date();
    const html = renderMarkdown(post.content);
    const ctaHref = post.ctaUrl || (spot && isLive(spot) ? `/spots/${spot.slug}` : '');
    const ctaLabel = post.ctaLabel || (post.type === 'promo' ? 'Claim this offer' : spot ? `Visit ${spot.name}` : '');

    return (
        <>
            {preview && <div className="preview-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }}><i className="fas fa-eye me-1"></i> Preview — this post isn&apos;t public yet. <Link href={`/admin/posts/${post._id}`}><b>Edit post</b></Link></div>}
            <section className="dn-banner post-hero" data-hero>
                <div className="bg" style={{ backgroundImage: `url('${post.coverImage || IMAGES.food.spread}')` }}></div>
                <div className="container" style={{ maxWidth: 860 }}>
                    <div className="crumbs"><Link href="/">Home</Link> / <Link href="/blog">Blog</Link> / <Link href={`/blog?type=${post.type}`}>{t.plural}</Link></div>
                    <span className={`pill ${post.type === 'promo' ? 'pill-featured' : 'pill-type'} mb-2`}><i className={`fas ${t.icon}`}></i> {t.label}</span>
                    <h1>{post.title}</h1>
                    {post.excerpt && <p>{post.excerpt}</p>}
                    <div className="small mt-3" style={{ opacity: 0.9 }}>
                        {post.authorName && <><i className="fas fa-user-pen me-1"></i>{post.authorName} · </>}
                        {post.publishedAt ? fmtDate(post.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unpublished'} · {readingTime(post.content)} min read
                    </div>
                </div>
            </section>

            <section className="py-5">
                <div className="container" style={{ maxWidth: 860 }}>
                    {post.type === 'review' && post.rating && (
                        <div className="panel d-flex gap-4 align-items-center flex-wrap">
                            <div className="text-center"><div className="rating-big">{post.rating}<small style={{ fontSize: 22 }}>/5</small></div><Stars rating={post.rating} /></div>
                            <div className="flex-grow-1" style={{ minWidth: 220 }}>
                                <div className="section-kicker" style={{ marginLeft: -8 }}>Diner.ng verdict</div>
                                <p className="mb-0" style={{ fontSize: 19, fontWeight: 600, color: 'var(--dn-cocoa)' }}>{post.verdict || `${post.rating} out of 5`}</p>
                            </div>
                        </div>
                    )}

                    {post.type === 'promo' && (post.promoCode || post.validUntil) && (
                        <div className={`promo-box mb-4 ${expired ? 'expired' : ''}`}>
                            <div>
                                <div className="section-kicker" style={{ marginLeft: -8 }}>{expired ? 'Offer ended' : 'Limited offer'}</div>
                                {post.validUntil && <div className="small">{expired ? 'Ended' : 'Valid until'} {fmtDate(post.validUntil, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                            </div>
                            {post.promoCode && !expired && (
                                <div className="d-flex align-items-center gap-2">
                                    <code className="promo-code">{post.promoCode}</code>
                                    <CopyButton text={post.promoCode} className="btn-dn-dark btn-sm-dn" />
                                </div>
                            )}
                        </div>
                    )}

                    <article className="post-body panel" dangerouslySetInnerHTML={{ __html: html }} />

                    {ctaHref && ctaLabel && !expired && (
                        <div className="text-center my-4">
                            <a href={ctaHref} className="btn-dn btn-lg-dn" {...(/^https?:/.test(ctaHref) ? { target: '_blank', rel: 'noopener' } : {})}>{ctaLabel} <i className="fas fa-arrow-right"></i></a>
                        </div>
                    )}

                    {spot && isLive(spot) && (
                        <div className="mt-4">
                            <h5 className="mb-3">{post.type === 'review' ? 'The spot we reviewed' : 'Featured spot'}</h5>
                            <div className="row"><div className="col-md-6"><SpotCard s={spot} /></div></div>
                        </div>
                    )}

                    {post.tags.length > 0 && (
                        <div className="d-flex gap-2 flex-wrap mt-4">
                            {post.tags.map((tag) => <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="pill pill-soft">#{tag}</Link>)}
                        </div>
                    )}
                </div>
            </section>

            {related.length > 0 && (
                <section className="dn-section tight bg-sand">
                    <div className="container">
                        <div className="head-row"><h2>More from the blog</h2><Link href="/blog" className="btn-dn-outline btn-sm-dn">All posts <i className="fas fa-arrow-right"></i></Link></div>
                        <div className="row g-4">{related.map((p) => <div key={String(p._id)} className="col-md-4"><PostCard p={p} /></div>)}</div>
                    </div>
                </section>
            )}
        </>
    );
}
