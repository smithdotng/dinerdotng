import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Post, POST_TYPES, POST_TYPE_KEYS, isPostType, type IPost } from '@/models/Post';
import { Spot } from '@/models/Spot';
import { fmtDate } from '@/lib/format';
import { escapeRegex } from '@/lib/helpers';
import { deletePostAction, togglePostStatusAction } from '@/actions/blog';
import { ConfirmButton } from '@/components/ClientBits';

export default async function AdminPosts({ searchParams }: { searchParams: Promise<{ type?: string; status?: string; q?: string }> }) {
    const q = await searchParams;
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (isPostType(q.type)) filter.type = q.type;
    if (q.status === 'draft' || q.status === 'published') filter.status = q.status;
    if (q.q) filter.title = new RegExp(escapeRegex(q.q), 'i');
    const [posts, counts] = await Promise.all([
        Post.find(filter).sort({ updatedAt: -1 }).limit(200).lean<IPost[]>(),
        Post.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }])
    ]);
    const spotNames = Object.fromEntries((await Spot.find({ _id: { $in: posts.map((p) => p.spot).filter(Boolean) } }).select('name').lean()).map((s) => [String(s._id), s.name]));
    const c = Object.fromEntries(counts.map((x) => [x._id, x.n]));
    const now = new Date();

    return (
        <>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div className="type-tabs">
                    <Link href="/admin/posts" className={!q.type ? 'active' : ''}>All</Link>
                    {POST_TYPE_KEYS.map((k) => <Link key={k} href={`/admin/posts?type=${k}`} className={q.type === k ? 'active' : ''}><i className={`fas ${POST_TYPES[k].icon} me-1`}></i>{POST_TYPES[k].plural}</Link>)}
                </div>
                <Link href="/admin/posts/new" className="btn-dn"><i className="fas fa-plus"></i> New post</Link>
            </div>
            <div className="card-dn">
                <form className="d-flex gap-2 flex-wrap mb-3" method="get">
                    {q.type && <input type="hidden" name="type" value={q.type} />}
                    <input className="form-control" style={{ maxWidth: 280 }} name="q" defaultValue={q.q} placeholder="Search titles" />
                    <select className="form-select" style={{ maxWidth: 200 }} name="status" defaultValue={q.status || ''}>
                        <option value="">All ({(c.published || 0) + (c.draft || 0)})</option>
                        <option value="published">Published ({c.published || 0})</option>
                        <option value="draft">Drafts ({c.draft || 0})</option>
                    </select>
                    <button className="btn-dn-outline btn-sm-dn">Filter</button>
                </form>
                {!posts.length ? (
                    <div className="text-center py-5"><i className="fas fa-pen-nib fa-2x text-primary-dn mb-2"></i><p className="text-muted-dn">No posts yet. Write your first article, review or promotion.</p><Link href="/admin/posts/new" className="btn-dn">New post</Link></div>
                ) : (
                    <div className="table-responsive"><table className="table-dn">
                        <thead><tr><th>Post</th><th>Type</th><th>Spot</th><th>Status</th><th>Views</th><th></th></tr></thead>
                        <tbody>
                            {posts.map((p) => {
                                const id = String(p._id);
                                const scheduled = p.status === 'published' && p.publishedAt && new Date(p.publishedAt) > now;
                                return (
                                    <tr key={id}>
                                        <td style={{ maxWidth: 380 }}>
                                            <Link href={`/admin/posts/${id}`}><b>{p.title}</b></Link>{p.featured && <span className="pill pill-featured ms-1">Featured</span>}
                                            <br /><small className="text-muted-dn">Updated {fmtDate(p.updatedAt)}{p.authorName ? ` · ${p.authorName}` : ''}</small>
                                        </td>
                                        <td><span className="pill pill-soft"><i className={`fas ${POST_TYPES[p.type].icon}`}></i> {POST_TYPES[p.type].label}</span></td>
                                        <td className="small">{p.spot ? spotNames[String(p.spot)] || '—' : '—'}</td>
                                        <td>
                                            {p.status === 'draft' ? <span className="pill pill-muted">Draft</span> : scheduled ? <span className="pill pill-amber">Scheduled</span> : <span className="pill pill-green">Published</span>}
                                            {p.publishedAt && p.status === 'published' && <><br /><small className="text-muted-dn">{fmtDate(p.publishedAt)}</small></>}
                                        </td>
                                        <td>{p.views}</td>
                                        <td>
                                            <div className="d-flex gap-1 justify-content-end">
                                                {p.status === 'published' && <Link className="btn-icon" href={`/blog/${p.slug}`} target="_blank" title="View"><i className="fas fa-eye"></i></Link>}
                                                <Link className="btn-icon" href={`/admin/posts/${id}`} title="Edit"><i className="fas fa-pen"></i></Link>
                                                <form action={togglePostStatusAction.bind(null, id)}><button className="btn-icon" title={p.status === 'published' ? 'Unpublish' : 'Publish'}><i className={`fas ${p.status === 'published' ? 'fa-eye-slash' : 'fa-paper-plane'}`}></i></button></form>
                                                <form action={deletePostAction.bind(null, id)}><ConfirmButton message={`Delete "${p.title}"? This can't be undone.`} className="btn-icon" title="Delete"><i className="fas fa-trash"></i></ConfirmButton></form>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table></div>
                )}
            </div>
        </>
    );
}
