import Link from 'next/link';
import { requireOwnerSpot } from '@/lib/owner';
import { Review, type IReview } from '@/models/Review';
import { fmtDate } from '@/lib/format';
import { replyReviewAction, toggleReviewAction } from '@/actions/owner';
import Stars from '@/components/Stars';

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ rating?: string; unreplied?: string }> }) {
    const { spot } = await requireOwnerSpot();
    const q = await searchParams;
    const filter: Record<string, unknown> = { spot: spot._id };
    if (q.rating) filter.rating = parseInt(q.rating, 10);
    if (q.unreplied) filter['ownerReply.text'] = { $in: [null, ''] };
    const [reviews, all] = await Promise.all([
        Review.find(filter).sort({ createdAt: -1 }).limit(100).lean<IReview[]>(),
        Review.find({ spot: spot._id }).select('rating ownerReply').lean<IReview[]>()
    ]);
    const breakdown = [5, 4, 3, 2, 1].map((s) => ({ s, n: all.filter((r) => r.rating === s).length }));
    const unreplied = all.filter((r) => !r.ownerReply?.text).length;

    return (
        <div className="row g-4">
            <div className="col-xl-4">
                <div className="card-dn text-center">
                    <div className="rating-big">{spot.ratingCount ? spot.ratingAvg.toFixed(1) : '–'}</div>
                    <Stars rating={spot.ratingAvg} />
                    <div className="text-muted-dn small mb-3">{spot.ratingCount} published · {all.length} total</div>
                    {breakdown.map((b) => (
                        <Link key={b.s} href={`/dashboard/reviews?rating=${b.s}`} className="bar-row text-reset mb-1">
                            <span style={{ width: 14 }}>{b.s}</span><i className="fas fa-star" style={{ color: 'var(--dn-accent)', fontSize: 11 }}></i>
                            <div className="bar"><span style={{ width: `${all.length ? Math.round((b.n / all.length) * 100) : 0}%` }}></span></div>
                            <span className="text-muted-dn" style={{ width: 24 }}>{b.n}</span>
                        </Link>
                    ))}
                </div>
                <div className="card-dn">
                    <h5>Filter</h5>
                    <div className="d-grid gap-2">
                        <Link href="/dashboard/reviews" className={`${!q.rating && !q.unreplied ? 'btn-dn' : 'btn-dn-outline'} btn-sm-dn`}>All reviews</Link>
                        <Link href="/dashboard/reviews?unreplied=1" className={`${q.unreplied ? 'btn-dn' : 'btn-dn-outline'} btn-sm-dn`}>Awaiting reply ({unreplied})</Link>
                    </div>
                    <p className="small text-muted-dn mt-3 mb-0"><i className="fas fa-lightbulb me-1 text-primary-dn"></i> Replying to feedback — especially the tough ones — shows future guests you care.</p>
                </div>
            </div>
            <div className="col-xl-8">
                <div className="card-dn">
                    {!reviews.length && <div className="text-center py-4"><i className="fas fa-comments fa-2x text-primary-dn mb-2"></i><p className="text-muted-dn mb-0">No reviews here yet. Guests can rate you from your QR menu and listing page.</p></div>}
                    {reviews.map((r) => {
                        const id = String(r._id);
                        return (
                            <div key={id} id={`r-${id}`} className="review" style={r.status === 'hidden' ? { opacity: 0.55 } : undefined}>
                                <div className="d-flex gap-3">
                                    <span className="avatar">{r.name.charAt(0).toUpperCase()}</span>
                                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                        <div className="d-flex justify-content-between flex-wrap gap-1">
                                            <div>
                                                <b>{r.name}</b>
                                                {r.source === 'qr' && <span className="pill pill-soft ms-1"><i className="fas fa-qrcode"></i> At the table</span>}
                                                {r.status === 'hidden' && <span className="pill pill-muted ms-1">Hidden</span>}
                                            </div>
                                            <small className="text-muted-dn">{fmtDate(r.createdAt)}</small>
                                        </div>
                                        <Stars rating={r.rating} />
                                        {(r.food || r.service || r.ambience) && (
                                            <div className="small text-muted-dn">
                                                {[r.food && `Food ${r.food}/5`, r.service && `Service ${r.service}/5`, r.ambience && `Ambience ${r.ambience}/5`].filter(Boolean).join(' · ')}
                                            </div>
                                        )}
                                        {r.comment && <p className="mb-1 mt-1">{r.comment}</p>}
                                        {r.email && <small className="text-muted-dn"><i className="fas fa-envelope me-1"></i><a href={`mailto:${r.email}`}>{r.email}</a></small>}
                                        <form action={replyReviewAction.bind(null, id)} className="mt-2">
                                            <textarea className="form-control form-control-sm mb-2" name="reply" rows={2} placeholder="Write a public reply…" defaultValue={r.ownerReply?.text || ''}></textarea>
                                            <button className="btn-dn btn-sm-dn"><i className="fas fa-reply"></i> {r.ownerReply?.text ? 'Update reply' : 'Reply'}</button>
                                        </form>
                                        <form action={toggleReviewAction.bind(null, id)} className="mt-1">
                                            <button className="btn btn-link btn-sm p-0 text-muted-dn small">{r.status === 'hidden' ? 'Show on my page' : 'Hide from my page'}</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
