import Link from 'next/link';
import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { Post, POST_TYPES, POST_TYPE_KEYS, isPostType, publishedFilter, type IPost } from '@/models/Post';
import { Spot } from '@/models/Spot';
import { IMAGES } from '@/lib/images';
import { escapeRegex } from '@/lib/helpers';
import { fmtDate } from '@/lib/format';
import { readingTime } from '@/lib/markdown';
import PostCard from '@/components/PostCard';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
    title: 'Blog — food guides, reviews & offers',
    description: 'Restaurant reviews, food guides and the latest offers from Nigeria’s best restaurants, lounges, hotels and hotspots.',
    path: '/blog',
    image: IMAGES.food.family
});

const PER_PAGE = 12;

export default async function BlogIndex({ searchParams }: { searchParams: Promise<{ type?: string; tag?: string; q?: string; page?: string }> }) {
    const sp = await searchParams;
    await connectDB();
    const filter: Record<string, unknown> = publishedFilter();
    if (isPostType(sp.type)) filter.type = sp.type;
    if (sp.tag) filter.tags = String(sp.tag).toLowerCase();
    if (sp.q) filter.$or = [{ title: new RegExp(escapeRegex(sp.q), 'i') }, { excerpt: new RegExp(escapeRegex(sp.q), 'i') }];
    const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
    const plain = !sp.type && !sp.tag && !sp.q && page === 1;

    const [lead, total] = await Promise.all([
        plain ? Post.findOne({ ...publishedFilter(), featured: true }).sort({ publishedAt: -1 }).lean<IPost>() : null,
        Post.countDocuments(filter)
    ]);
    const posts = await Post.find(lead ? { ...filter, _id: { $ne: lead._id } } : filter)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * PER_PAGE)
        .limit(PER_PAGE)
        .lean<IPost[]>();
    const all = lead ? [lead, ...posts] : posts;
    const spotNames = Object.fromEntries((await Spot.find({ _id: { $in: all.map((p) => p.spot).filter(Boolean) } }).select('name').lean()).map((s) => [String(s._id), s.name]));
    const pages = Math.ceil(total / PER_PAGE);
    const qs = (n: number) => `/blog?${new URLSearchParams({ ...(sp.type ? { type: sp.type } : {}), ...(sp.tag ? { tag: sp.tag } : {}), ...(sp.q ? { q: sp.q } : {}), page: String(n) })}`;
    const heading = isPostType(sp.type) ? POST_TYPES[sp.type].plural : sp.tag ? `#${sp.tag}` : 'The Diner.ng Blog';

    return (
        <>
            <section className="dn-banner" data-hero>
                <div className="bg" style={{ backgroundImage: `url('${IMAGES.food.family}')` }}></div>
                <div className="container">
                    <div className="crumbs"><Link href="/">Home</Link> / Blog</div>
                    <h1>{heading}</h1>
                    <p>Food guides, honest reviews and the tastiest offers from spots across Nigeria.</p>
                </div>
            </section>
            <section className="pb-5">
                <div className="container">
                    <form className="filter-bar" method="get" action="/blog">
                        <div className="row g-2 align-items-center">
                            <div className="col-lg-8"><input className="form-control" name="q" defaultValue={sp.q} placeholder="Search the blog…" /></div>
                            <div className="col-6 col-lg-2">
                                <select className="form-select" name="type" defaultValue={sp.type || ''}>
                                    <option value="">Everything</option>
                                    {POST_TYPE_KEYS.map((k) => <option key={k} value={k}>{POST_TYPES[k].plural}</option>)}
                                </select>
                            </div>
                            <div className="col-6 col-lg-2"><button className="btn-dn btn-block"><i className="fas fa-magnifying-glass"></i> Search</button></div>
                        </div>
                    </form>
                    <div className="type-tabs my-4">
                        <Link href="/blog" className={!sp.type && !sp.tag ? 'active' : ''}>All</Link>
                        {POST_TYPE_KEYS.map((k) => <Link key={k} href={`/blog?type=${k}`} className={sp.type === k ? 'active' : ''}><i className={`fas ${POST_TYPES[k].icon} me-1`}></i>{POST_TYPES[k].plural}</Link>)}
                    </div>

                    {lead && (
                        <Link href={`/blog/${lead.slug}`} className="post-lead mb-4">
                            <div className="bg" style={{ backgroundImage: `url('${lead.coverImage || IMAGES.food.spread}')` }}></div>
                            <div className="inner">
                                <span className="pill pill-featured mb-2"><i className="fas fa-crown"></i> Featured {POST_TYPES[lead.type].label.toLowerCase()}</span>
                                <h2>{lead.title}</h2>
                                {lead.excerpt && <p>{lead.excerpt}</p>}
                                <small>{lead.publishedAt ? fmtDate(lead.publishedAt) : ''} · {readingTime(lead.content)} min read</small>
                            </div>
                        </Link>
                    )}

                    {posts.length ? (
                        <div className="row g-4">
                            {posts.map((p) => <div key={String(p._id)} className="col-sm-6 col-lg-4"><PostCard p={p} spotName={p.spot ? spotNames[String(p.spot)] : undefined} /></div>)}
                        </div>
                    ) : !lead ? (
                        <div className="empty-state"><i className="fas fa-pen-nib"></i><h4>No posts here yet</h4><p className="text-muted-dn">Check back soon for guides, reviews and offers.</p><Link href="/blog" className="btn-dn-outline">All posts</Link></div>
                    ) : null}

                    {pages > 1 && (
                        <div className="d-flex justify-content-center gap-2 mt-5">
                            {page > 1 && <Link className="btn-dn-outline btn-sm-dn" href={qs(page - 1)}><i className="fas fa-arrow-left"></i> Newer</Link>}
                            <span className="align-self-center text-muted-dn small">Page {page} of {pages}</span>
                            {page < pages && <Link className="btn-dn-outline btn-sm-dn" href={qs(page + 1)}>Older <i className="fas fa-arrow-right"></i></Link>}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
