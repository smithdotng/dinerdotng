import Link from 'next/link';
import { requireOwnerSpot } from '@/lib/owner';
import { MenuItem } from '@/models/MenuItem';
import { Review, type IReview } from '@/models/Review';
import { Reservation, type IReservation } from '@/models/Reservation';
import { Table } from '@/models/Table';
import { hasSweet, isLive } from '@/lib/spot';
import { fmtDate, fmtTime, timeAgo, todayISO } from '@/lib/format';
import PlanBanner from '@/components/PlanBanner';
import Stars from '@/components/Stars';

export default async function OverviewPage() {
    const { spot } = await requireOwnerSpot();
    const today = todayISO();
    const [itemCount, reviewCount, recent, upcoming, pendingCount, tableCount] = await Promise.all([
        MenuItem.countDocuments({ spot: spot._id }),
        Review.countDocuments({ spot: spot._id }),
        Review.find({ spot: spot._id }).sort({ createdAt: -1 }).limit(4).lean<IReview[]>(),
        Reservation.find({ spot: spot._id, date: { $gte: today }, status: { $in: ['pending', 'confirmed'] } }).sort({ date: 1, time: 1 }).limit(6).lean<IReservation[]>(),
        Reservation.countDocuments({ spot: spot._id, status: 'pending' }),
        Table.countDocuments({ spot: spot._id })
    ]);
    const sweet = hasSweet(spot);
    const checklist = [
        { done: !!spot.coverImage, label: 'Upload a cover photo', href: '/dashboard/spot#photos' },
        { done: spot.gallery.length >= 3, label: 'Add at least 3 gallery photos', href: '/dashboard/spot#photos' },
        { done: itemCount >= 5, label: 'Add 5+ dishes to your menu', href: '/dashboard/menu' },
        { done: !!spot.description, label: 'Write a short description', href: '/dashboard/spot' },
        { done: isLive(spot), label: 'Choose a plan and go live', href: '/dashboard/billing' },
        { done: spot.menuScans > 0, label: 'Print your QR code and place it on tables', href: '/dashboard/qr' }
    ];
    const done = checklist.filter((c) => c.done).length;

    return (
        <>
            <PlanBanner spot={spot} />
            <div className="row g-3 mb-4">
                <div className="col-6 col-xl-3"><div className="kpi"><span className="ic ic-orange"><i className="fas fa-eye"></i></span><div><b>{spot.views.toLocaleString()}</b><span>Listing views</span></div></div></div>
                <div className="col-6 col-xl-3"><div className="kpi"><span className="ic ic-amber"><i className="fas fa-qrcode"></i></span><div><b>{spot.menuScans.toLocaleString()}</b><span>Menu scans</span></div></div></div>
                <div className="col-6 col-xl-3"><div className="kpi"><span className="ic ic-green"><i className="fas fa-star"></i></span><div><b>{spot.ratingCount ? spot.ratingAvg.toFixed(1) : '–'}</b><span>{reviewCount} review{reviewCount === 1 ? '' : 's'}</span></div></div></div>
                <div className="col-6 col-xl-3"><div className="kpi"><span className="ic ic-red"><i className="fas fa-calendar-check"></i></span><div><b>{upcoming.length}</b><span>Upcoming bookings{pendingCount ? ` · ${pendingCount} pending` : ''}</span></div></div></div>
            </div>
            <div className="row g-4">
                <div className="col-xl-7">
                    <div className="card-dn">
                        <div className="card-head"><h5>Upcoming reservations</h5><Link href="/dashboard/reservations" className="small">View all</Link></div>
                        {!sweet ? (
                            <><p className="text-muted-dn mb-2">Let guests book tables online with the Sweet plan.</p><Link className="btn-dn btn-sm-dn" href="/dashboard/billing?plan=sweet"><i className="fas fa-star"></i> Unlock reservations</Link></>
                        ) : !upcoming.length ? (
                            <p className="text-muted-dn mb-0">No upcoming reservations yet. Share your page: <Link href={`/spots/${spot.slug}#book`}>/spots/{spot.slug}</Link></p>
                        ) : (
                            <div className="table-responsive"><table className="table-dn">
                                <thead><tr><th>When</th><th>Guest</th><th>Party</th><th>Status</th></tr></thead>
                                <tbody>
                                    {upcoming.map((r) => (
                                        <tr key={String(r._id)}>
                                            <td><b>{fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</b> · {fmtTime(r.time)}</td>
                                            <td>{r.name}<br /><small className="text-muted-dn">{r.phone}</small></td>
                                            <td>{r.partySize}</td>
                                            <td><span className={`pill status-${r.status}`}>{r.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table></div>
                        )}
                    </div>
                    <div className="card-dn">
                        <div className="card-head"><h5>Latest feedback</h5><Link href="/dashboard/reviews" className="small">All reviews</Link></div>
                        {!recent.length && <p className="text-muted-dn mb-0">No reviews yet. Guests can rate you from your QR menu.</p>}
                        {recent.map((r) => (
                            <div key={String(r._id)} className="review py-2">
                                <div className="d-flex gap-3">
                                    <span className="avatar">{r.name.charAt(0)}</span>
                                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                        <div className="d-flex justify-content-between"><b>{r.name}</b><small className="text-muted-dn">{timeAgo(r.createdAt)}</small></div>
                                        <Stars rating={r.rating} />
                                        {r.comment && <p className="mb-0 small text-truncate">{r.comment}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-xl-5">
                    <div className="card-dn">
                        <h5>Get guest-ready</h5>
                        <div className="bar mb-3"><span style={{ width: `${Math.round((done / checklist.length) * 100)}%` }}></span></div>
                        <ul className="checklist list-unstyled mb-0">
                            {checklist.map((c) => (
                                <li key={c.label} className={c.done ? 'done' : ''}>
                                    <span className="tick"><i className="fas fa-check"></i></span>
                                    <span className="flex-grow-1">{c.label}</span>
                                    {!c.done && <Link href={c.href} className="small">Do it</Link>}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="card-dn">
                        <h5>Quick links</h5>
                        <div className="d-grid gap-2">
                            <Link className="btn-dn-outline" href="/dashboard/menu"><i className="fas fa-plus"></i> Add a dish</Link>
                            <Link className="btn-dn-outline" href="/dashboard/qr"><i className="fas fa-print"></i> Print QR code</Link>
                            <Link className="btn-dn-outline" href={`/m/${spot.slug}`} target="_blank"><i className="fas fa-mobile-screen"></i> Preview QR menu</Link>
                        </div>
                        <div className="small text-muted-dn mt-3">{itemCount} dishes · {spot.gallery.length} photos{sweet ? ` · ${tableCount} tables` : ''}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
