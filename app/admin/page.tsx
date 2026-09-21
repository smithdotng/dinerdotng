import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Spot } from '@/models/Spot';
import { User } from '@/models/User';
import { Payment, type IPayment } from '@/models/Payment';
import { Review } from '@/models/Review';
import { Reservation } from '@/models/Reservation';
import { Post } from '@/models/Post';
import { liveFilter } from '@/lib/spot';
import { PLANS } from '@/lib/plans';
import { fmtDate, naira } from '@/lib/format';

export default async function AdminOverview() {
    await connectDB();
    const live = liveFilter();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [owners, spots, liveSpots, sweet, revenue, reviews, reservations, recent, postsLive, postsDraft] = await Promise.all([
        User.countDocuments({ role: 'owner' }),
        Spot.countDocuments(),
        Spot.countDocuments(live),
        Spot.countDocuments({ ...live, 'subscription.plan': 'sweet' }),
        Payment.aggregate<{ total: number }>([{ $match: { status: 'success', paidAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Review.countDocuments(),
        Reservation.countDocuments(),
        Payment.find({ status: 'success' }).sort({ paidAt: -1 }).limit(8).lean<IPayment[]>(),
        Post.countDocuments({ status: 'published' }),
        Post.countDocuments({ status: 'draft' })
    ]);
    const spotNames = Object.fromEntries((await Spot.find({ _id: { $in: recent.map((p) => p.spot) } }).select('name').lean()).map((s) => [String(s._id), s.name]));

    return (
        <>
            <div className="row g-3 mb-4">
                <div className="col-6 col-xl-3"><div className="kpi"><span className="ic ic-orange"><i className="fas fa-store"></i></span><div><b>{liveSpots} / {spots}</b><span>Live spots / total</span></div></div></div>
                <div className="col-6 col-xl-3"><div className="kpi"><span className="ic ic-amber"><i className="fas fa-star"></i></span><div><b>{sweet} · {liveSpots - sweet}</b><span>Sweet · Basic (live)</span></div></div></div>
                <div className="col-6 col-xl-3"><div className="kpi"><span className="ic ic-green"><i className="fas fa-naira-sign"></i></span><div><b>{naira(revenue[0]?.total || 0)}</b><span>Revenue this month</span></div></div></div>
                <div className="col-6 col-xl-3"><div className="kpi"><span className="ic ic-red"><i className="fas fa-users"></i></span><div><b>{owners}</b><span>Owner accounts</span></div></div></div>
            </div>
            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card-dn">
                        <div className="card-head"><h5>Recent payments</h5><Link href="/admin/payments" className="small">All payments</Link></div>
                        {!recent.length ? <p className="text-muted-dn mb-0">No payments yet.</p> : (
                            <div className="table-responsive"><table className="table-dn">
                                <thead><tr><th>Date</th><th>Spot</th><th>Plan</th><th>Amount</th></tr></thead>
                                <tbody>{recent.map((p) => (
                                    <tr key={String(p._id)}><td>{fmtDate(p.paidAt!)}</td><td>{spotNames[String(p.spot)] || '—'}</td><td>{PLANS[p.plan].name}{p.firstCustomerDiscount ? ' (first customer)' : ''}</td><td><b>{naira(p.amount)}</b></td></tr>
                                ))}</tbody>
                            </table></div>
                        )}
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card-dn">
                        <h5>Activity</h5>
                        <div className="d-flex justify-content-between py-2 border-bottom"><span>Reviews</span><b>{reviews}</b></div>
                        <div className="d-flex justify-content-between py-2"><span>Reservations</span><b>{reservations}</b></div>
                    </div>
                    <div className="card-dn">
                        <h5>Blog</h5>
                        <div className="d-flex justify-content-between py-2 border-bottom"><span>Published</span><b>{postsLive}</b></div>
                        <div className="d-flex justify-content-between py-2 mb-2"><span>Drafts</span><b>{postsDraft}</b></div>
                        <div className="d-grid gap-2">
                            <Link href="/admin/posts/new" className="btn-dn btn-sm-dn"><i className="fas fa-plus"></i> New article</Link>
                            <div className="d-flex gap-2">
                                <Link href="/admin/posts/new?type=review" className="btn-dn-outline btn-sm-dn flex-fill">Review</Link>
                                <Link href="/admin/posts/new?type=promo" className="btn-dn-outline btn-sm-dn flex-fill">Promotion</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
