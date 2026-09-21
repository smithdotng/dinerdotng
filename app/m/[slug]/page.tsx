import Link from 'next/link';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { Spot, type ISpot } from '@/models/Spot';
import { MenuItem, type IMenuItem } from '@/models/MenuItem';
import { canTakeReservations, isLive, locationOf, typeLabel } from '@/lib/spot';
import { IMAGES } from '@/lib/images';
import { plain } from '@/lib/helpers';
import { telLink } from '@/lib/format';
import { submitReviewAction } from '@/actions/public';
import { StarInput } from '@/components/Stars';
import QrMenuClient from '@/components/QrMenuClient';
import Flash from '@/components/Flash';
import Enhancer from '@/components/Enhancer';
import { pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
    await connectDB();
    const spot = await Spot.findOne({ slug }).lean<ISpot>();
    if (!spot) return null;
    if (isLive(spot)) return { spot, preview: false };
    const u = await getCurrentUser();
    return u && (u.role === 'admin' || String(spot.owner) === u.id) ? { spot, preview: true } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const f = await load((await params).slug);
    if (!f) return { title: 'Menu unavailable', robots: { index: false } };
    return pageMeta({
        title: `${f.spot.name} — Menu`,
        description: `See the full menu and prices at ${f.spot.name}${locationOf(f.spot) ? `, ${locationOf(f.spot)}` : ''}. Scan, order and rate your experience on Diner.ng.`,
        path: `/m/${f.spot.slug}`,
        image: f.spot.coverImage || IMAGES.typeCover[f.spot.type],
        noindex: f.preview
    });
}

export default async function QrMenuPage({ params, searchParams }: { params: Params; searchParams: Promise<{ table?: string }> }) {
    const { slug } = await params;
    const table = String((await searchParams).table || '').slice(0, 20);
    const found = await load(slug);
    if (!found) {
        return (
            <div className="qm-body text-center" style={{ padding: '80px 24px' }}>
                <i className="fas fa-book-open fa-3x text-primary-dn mb-3"></i>
                <h2>Menu unavailable</h2>
                <p className="text-muted-dn">This menu is not available right now. Please ask a member of staff.</p>
                <Link href="/" className="btn-dn">Visit Diner.ng</Link>
            </div>
        );
    }
    const { spot, preview } = found;
    if (!preview) await Spot.updateOne({ _id: spot._id }, { $inc: { menuScans: 1 } });
    const items = await MenuItem.find({ spot: spot._id }).sort({ order: 1, createdAt: 1 }).lean<IMenuItem[]>();
    const categories = (spot.menuCategories.length ? spot.menuCategories : [...new Set(items.map((i) => i.category))]).filter((c) => items.some((i) => i.category === c));
    const review = submitReviewAction.bind(null, spot.slug);

    return (
        <div style={{ background: '#f3e6d8', minHeight: '100vh' }}>
            <Suspense fallback={null}><Flash /></Suspense>
            <Enhancer />
            <div className="qm-body">
                {preview && <div className="preview-bar">Preview — this menu goes live when your plan is active.</div>}
                <header className="qm-hero">
                    <div className="bg" style={{ backgroundImage: `url('${spot.coverImage || IMAGES.typeCover[spot.type]}')` }}></div>
                    {table && <span className="qm-table"><i className="fas fa-chair me-1"></i> Table {table}</span>}
                    <div className="inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {spot.logo && <img className="logo" src={spot.logo} alt="" />}
                        <div>
                            <h1>{spot.name}</h1>
                            <small>
                                {spot.ratingCount > 0 && <><i className="fas fa-star" style={{ color: 'var(--dn-accent)' }}></i> {spot.ratingAvg.toFixed(1)} · </>}
                                {locationOf(spot) || typeLabel(spot)}
                            </small>
                        </div>
                    </div>
                </header>

                {categories.length ? (
                    <QrMenuClient categories={categories} items={plain(items) as never} />
                ) : (
                    <div className="qm-section text-center py-5"><i className="fas fa-book-open fa-2x text-primary-dn mb-2"></i><p>The menu is being updated. Please ask a member of staff.</p></div>
                )}

                <div className="qm-rate" id="rate">
                    <h5 className="mb-1">How was your experience?</h5>
                    <p className="small text-muted-dn">Your rating goes straight to {spot.name}.</p>
                    <form action={review}>
                        <input type="hidden" name="from" value="menu" />
                        <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                        <div className="mb-2"><StarInput name="rating" required idPrefix="qm" /></div>
                        <input className="form-control mb-2" name="name" placeholder="Your name" required maxLength={60} />
                        <textarea className="form-control mb-2" name="comment" rows={2} placeholder="Anything you'd like to tell us?"></textarea>
                        <button className="btn-dn btn-block">Send feedback</button>
                    </form>
                </div>

                <div className="qm-bar">
                    {canTakeReservations(spot) && <Link className="btn-dn-outline btn-sm-dn" href={`/spots/${spot.slug}#book`}><i className="fas fa-calendar-check"></i> Book</Link>}
                    <a className="btn-dn btn-sm-dn" href="#rate"><i className="fas fa-star"></i> Rate us</a>
                    {spot.phone && <a className="btn-dn-outline btn-sm-dn" href={telLink(spot.phone)} aria-label="Call"><i className="fas fa-phone"></i></a>}
                </div>
                <div className="qm-foot">Menu powered by <Link href="/"><b>Diner.ng</b></Link></div>
            </div>
        </div>
    );
}
