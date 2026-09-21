import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { Spot, type ISpot } from '@/models/Spot';
import { MenuItem, type IMenuItem } from '@/models/MenuItem';
import { Review, type IReview } from '@/models/Review';
import { Table } from '@/models/Table';
import { canTakeReservations, isFeatured, isLive, locationOf, priceLabel, typeIcon, typeLabel } from '@/lib/spot';
import { IMAGES } from '@/lib/images';
import { fmtTime, lagosDayName, naira, telLink, timeAgo, timeSlots, todayISO, waLink } from '@/lib/format';
import { reserveTableAction, submitReviewAction } from '@/actions/public';
import Stars, { StarInput } from '@/components/Stars';
import MenuTabs from '@/components/MenuTabs';

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
    await connectDB();
    const spot = await Spot.findOne({ slug }).lean<ISpot>();
    if (!spot) return null;
    if (isLive(spot)) return { spot, preview: false };
    const u = await getCurrentUser();
    if (u && (u.role === 'admin' || String(spot.owner) === u.id)) return { spot, preview: true };
    return null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const found = await load((await params).slug);
    if (!found) return { title: 'Spot not found' };
    const { spot } = found;
    return {
        title: `${spot.name}${locationOf(spot) ? ` — ${locationOf(spot)}` : ''}`,
        description: spot.tagline || spot.description,
        openGraph: { images: [spot.coverImage || IMAGES.typeCover[spot.type]] }
    };
}

export default async function SpotPage({ params }: { params: Params }) {
    const { slug } = await params;
    const found = await load(slug);
    if (!found) notFound();
    const { spot, preview } = found;
    if (!preview) await Spot.updateOne({ _id: spot._id }, { $inc: { views: 1 } });

    const [items, reviews, areas] = await Promise.all([
        MenuItem.find({ spot: spot._id, available: true }).sort({ order: 1, createdAt: 1 }).lean<IMenuItem[]>(),
        Review.find({ spot: spot._id, status: 'published' }).sort({ createdAt: -1 }).limit(30).lean<IReview[]>(),
        Table.distinct('area', { spot: spot._id, active: true })
    ]);
    const categories = (spot.menuCategories.length ? spot.menuCategories : [...new Set(items.map((i) => i.category))]).filter((c) => items.some((i) => i.category === c));
    const breakdown = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));
    const sub = (k: 'food' | 'service' | 'ambience') => {
        const v = reviews.map((r) => r[k]).filter(Boolean) as number[];
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    };
    const canBook = canTakeReservations(spot);
    const today = todayISO();
    const todayName = lagosDayName();
    const slots = timeSlots(spot.reservations?.openTime, spot.reservations?.closeTime, spot.reservations?.slotMinutes);
    const reviewAction = submitReviewAction.bind(null, spot.slug);
    const reserveAction = reserveTableAction.bind(null, spot.slug);
    const loc = locationOf(spot);

    const panes = Object.fromEntries(
        categories.map((c) => [
            c,
            <div key={c}>
                <h6 className="text-uppercase mt-3 mb-1" style={{ letterSpacing: 1, color: 'var(--dn-primary-dark)' }}>{c}</h6>
                <div className="row">
                    {items.filter((i) => i.category === c).map((i) => (
                        <div key={String(i._id)} className="col-md-6">
                            <div className="menu-row">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {i.image && <img src={i.image} alt={i.name} loading="lazy" />}
                                <div className="flex-grow-1">
                                    <h6><span>{i.name}</span><span className="price">{naira(i.price)}</span></h6>
                                    <p>{i.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ])
    );

    return (
        <>
            {preview && (
                <div className="preview-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }}>
                    <i className="fas fa-eye me-1"></i> Preview — only you can see this page. <Link href="/dashboard/billing"><b>Choose a plan to go live</b></Link>.
                </div>
            )}
            <section className="spot-hero" data-hero>
                <div className="bg" style={{ backgroundImage: `url('${spot.coverImage || IMAGES.typeCover[spot.type]}')` }}></div>
                <div className="container">
                    <div className="d-flex gap-3 align-items-end flex-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {spot.logo && <img className="spot-logo" src={spot.logo} alt={`${spot.name} logo`} />}
                        <div>
                            <div className="d-flex gap-2 flex-wrap">
                                <span className="pill pill-type"><i className={`fas ${typeIcon(spot)}`}></i> {typeLabel(spot)}</span>
                                {isFeatured(spot) && <span className="pill pill-featured"><i className="fas fa-crown"></i> Featured</span>}
                                {canBook && <span className="pill pill-book"><i className="fas fa-calendar-check"></i> Takes reservations</span>}
                            </div>
                            <h1>{spot.name}</h1>
                            <div className="meta">
                                {spot.ratingCount > 0 && <span><Stars rating={spot.ratingAvg} /> <b>{spot.ratingAvg.toFixed(1)}</b> ({spot.ratingCount} review{spot.ratingCount === 1 ? '' : 's'})</span>}
                                {loc && <span><i className="fas fa-location-dot"></i> {loc}</span>}
                                <span>{priceLabel(spot)}</span>
                                {spot.cuisines.length > 0 && <span><i className="fas fa-bowl-rice"></i> {spot.cuisines.join(' · ')}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <nav className="spot-nav">
                <div className="container">
                    <a href="#about">About</a>
                    {items.length > 0 && <a href="#menu">Menu</a>}
                    {spot.gallery.length > 0 && <a href="#photos">Photos</a>}
                    <a href="#reviews">Reviews</a>
                    {canBook && <a href="#book">Book a table</a>}
                </div>
            </nav>

            <section className="py-5">
                <div className="container">
                    <div className="row g-4">
                        <div className="col-lg-8">
                            <div className="panel" id="about">
                                <h3>About {spot.name}</h3>
                                {spot.tagline && <p className="fw-semibold" style={{ color: 'var(--dn-primary-dark)' }}>{spot.tagline}</p>}
                                <p className="text-muted-dn mb-0" style={{ whiteSpace: 'pre-line' }}>{spot.description || 'More details coming soon.'}</p>
                            </div>

                            {items.length > 0 && (
                                <div className="panel" id="menu">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                        <h3 className="mb-0">Menu</h3>
                                        <Link href={`/m/${spot.slug}`} className="btn-dn-outline btn-sm-dn"><i className="fas fa-mobile-screen"></i> Open mobile menu</Link>
                                    </div>
                                    <MenuTabs categories={categories} panes={panes} />
                                </div>
                            )}

                            {spot.gallery.length > 0 && (
                                <div className="panel" id="photos">
                                    <h3>Photos</h3>
                                    <div className="gallery-grid">
                                        {spot.gallery.slice(0, 9).map((g) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <a key={String(g._id)} href={g.url} target="_blank" rel="noopener"><img src={g.url} alt={g.caption || spot.name} loading="lazy" /></a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="panel" id="reviews">
                                <h3>Ratings &amp; reviews</h3>
                                <div className="row g-4 align-items-center mb-2">
                                    <div className="col-md-4 text-center">
                                        <div className="rating-big">{spot.ratingCount ? spot.ratingAvg.toFixed(1) : '–'}</div>
                                        <Stars rating={spot.ratingAvg} />
                                        <div className="text-muted-dn small">{spot.ratingCount} review{spot.ratingCount === 1 ? '' : 's'}</div>
                                    </div>
                                    <div className="col-md-4">
                                        {breakdown.map((b) => (
                                            <div key={b.s} className="bar-row">
                                                <span style={{ width: 14 }}>{b.s}</span><i className="fas fa-star" style={{ color: 'var(--dn-accent)', fontSize: 11 }}></i>
                                                <div className="bar"><span style={{ width: `${reviews.length ? Math.round((b.n / reviews.length) * 100) : 0}%` }}></span></div>
                                                <span className="text-muted-dn" style={{ width: 24 }}>{b.n}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="col-md-4 small">
                                        {([['food', 'Food', 'fa-bowl-food'], ['service', 'Service', 'fa-bell-concierge'], ['ambience', 'Ambience', 'fa-champagne-glasses']] as const).map(([k, l, ic]) => (
                                            <div key={k} className="d-flex justify-content-between py-1"><span><i className={`fas ${ic} me-2 text-primary-dn`}></i>{l}</span><b>{sub(k) ? sub(k).toFixed(1) : '–'}</b></div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-3">
                                    {!reviews.length && <p className="text-muted-dn">No reviews yet — be the first to share your experience.</p>}
                                    {reviews.map((r) => (
                                        <div key={String(r._id)} className="review">
                                            <div className="d-flex gap-3">
                                                <span className="avatar">{r.name.charAt(0).toUpperCase()}</span>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between flex-wrap gap-1">
                                                        <b style={{ color: 'var(--dn-cocoa)' }}>{r.name}</b>
                                                        <small className="text-muted-dn">{timeAgo(r.createdAt)}{r.source === 'qr' ? ' · at the table' : ''}</small>
                                                    </div>
                                                    <Stars rating={r.rating} />
                                                    {r.comment && <p className="mb-0 mt-1">{r.comment}</p>}
                                                    {r.ownerReply?.text && <div className="owner-reply"><b><i className="fas fa-reply me-1"></i> Reply from {spot.name}:</b> {r.ownerReply.text}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <hr className="my-4" style={{ borderColor: 'var(--dn-line)' }} />
                                <h5 className="mb-3">Rate your experience</h5>
                                <form action={reviewAction}>
                                    <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                                    <div className="mb-3">
                                        <label className="form-label d-block">Overall</label>
                                        <StarInput name="rating" required />
                                    </div>
                                    <div className="row g-3 mb-3">
                                        {([['food', 'Food'], ['service', 'Service'], ['ambience', 'Ambience']] as const).map(([k, l]) => (
                                            <div key={k} className="col-sm-4"><label className="form-label d-block small">{l}</label><StarInput name={k} small /></div>
                                        ))}
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-sm-6"><input className="form-control" name="name" placeholder="Your name" required maxLength={60} /></div>
                                        <div className="col-sm-6"><input className="form-control" type="email" name="email" placeholder="Email (optional, not shown)" /></div>
                                        <div className="col-12"><textarea className="form-control" name="comment" rows={3} placeholder="What did you enjoy? What could be better?" maxLength={1500}></textarea></div>
                                        <div className="col-12"><button className="btn-dn"><i className="fas fa-paper-plane"></i> Post review</button></div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            {canBook && (
                                <div className="book-card mb-4" id="book">
                                    <div className="head"><h4><i className="fas fa-calendar-check me-2"></i>Book a table</h4><small>Free · Instant booking code</small></div>
                                    <form className="inner" action={reserveAction}>
                                        <div className="row g-2">
                                            <div className="col-6"><label className="form-label small">Date</label><input className="form-control" type="date" name="date" min={today} defaultValue={today} required /></div>
                                            <div className="col-6">
                                                <label className="form-label small">Time</label>
                                                <select className="form-select" name="time" required defaultValue={slots.includes('19:00') ? '19:00' : slots[0]}>
                                                    {slots.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">Guests</label>
                                                <select className="form-select" name="partySize" defaultValue="2">
                                                    {Array.from({ length: spot.reservations?.maxPartySize || 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">Seating</label>
                                                <select className="form-select" name="seating" defaultValue="">
                                                    <option value="">No preference</option>
                                                    {(areas as string[]).filter(Boolean).map((a) => <option key={a}>{a}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-12"><input className="form-control" name="name" placeholder="Full name" required /></div>
                                            <div className="col-12"><input className="form-control" name="phone" placeholder="Phone (e.g. 0803 000 0000)" required /></div>
                                            <div className="col-12"><input className="form-control" type="email" name="email" placeholder="Email (optional)" /></div>
                                            <div className="col-12">
                                                <select className="form-select" name="occasion" defaultValue="">
                                                    <option value="">Occasion (optional)</option>
                                                    {['Birthday', 'Anniversary', 'Date night', 'Business', 'Celebration'].map((o) => <option key={o}>{o}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-12"><textarea className="form-control" name="notes" rows={2} placeholder="Special requests"></textarea></div>
                                            {spot.reservations?.note && <div className="col-12"><small className="text-muted-dn"><i className="fas fa-circle-info me-1"></i>{spot.reservations.note}</small></div>}
                                            <div className="col-12"><button className="btn-dn btn-block">Reserve my table</button></div>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="panel">
                                <h5 className="mb-3">Info</h5>
                                <ul className="info-list">
                                    {spot.address && (
                                        <li><i className="fas fa-location-dot"></i><div>{spot.address}<br />
                                            <a target="_blank" rel="noopener" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([spot.name, spot.address, spot.city].filter(Boolean).join(', '))}`}>Get directions</a></div></li>
                                    )}
                                    {spot.phone && <li><i className="fas fa-phone"></i><a href={telLink(spot.phone)}>{spot.phone}</a></li>}
                                    {spot.whatsapp && <li><i className="fab fa-whatsapp"></i><a target="_blank" rel="noopener" href={waLink(spot.whatsapp)}>Chat on WhatsApp</a></li>}
                                    {spot.instagram && <li><i className="fab fa-instagram"></i><a target="_blank" rel="noopener" href={`https://instagram.com/${spot.instagram}`}>@{spot.instagram}</a></li>}
                                    {spot.website && <li><i className="fas fa-globe"></i><a target="_blank" rel="noopener" href={/^https?:/.test(spot.website) ? spot.website : `https://${spot.website}`}>{spot.website.replace(/^https?:\/\//, '')}</a></li>}
                                </ul>
                                {spot.hours?.length > 0 && (
                                    <>
                                        <h6 className="mt-4 mb-2">Opening hours</h6>
                                        <table className="w-100 hours-table"><tbody>
                                            {spot.hours.map((d) => (
                                                <tr key={d.day} className={d.day === todayName ? 'today' : ''}><td>{d.day}</td><td className="text-end">{d.closed ? 'Closed' : `${fmtTime(d.open)} – ${fmtTime(d.close)}`}</td></tr>
                                            ))}
                                        </tbody></table>
                                    </>
                                )}
                            </div>
                            {!canBook && spot.phone && (
                                <div className="panel text-center">
                                    <i className="fas fa-phone-volume fa-2x text-primary-dn mb-2"></i>
                                    <p className="mb-2">Want a table? Call ahead.</p>
                                    <a className="btn-dn btn-block" href={telLink(spot.phone)}>{spot.phone}</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
