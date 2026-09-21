import Link from 'next/link';
import type { Metadata } from 'next';
import { IMAGES } from '@/lib/images';
import { PLANS, promoEnabled } from '@/lib/plans';
import { naira } from '@/lib/format';
import PlanCards from '@/components/PlanCards';

export const metadata: Metadata = { title: 'For restaurants, hotels & event hotspots' };

export default function BusinessPage() {
    const promo = promoEnabled();
    const steps = [
        ['fa-user-plus', 'Create your account', 'Sign up and tell us about your spot — name, type, location and contacts.'],
        ['fa-images', 'Add menu & photos', 'Build your menu with prices and photos, and upload pictures of your space.'],
        ['fa-credit-card', 'Pick a plan', promo ? `Basic or Sweet. First customers start from ${naira(PLANS.basic.firstCustomerPrice)} for the first month.` : 'Basic or Sweet, billed monthly.'],
        ['fa-qrcode', 'Print your QR', 'Download your unique QR code, place it on tables, and welcome guests.']
    ];
    const kinds = [
        [IMAGES.food.fine, 'Restaurants & cafés', 'A menu guests can browse from their seat, updated in real time. Mark dishes sold out in one tap.'],
        [IMAGES.places.hotelRoom, 'Hotels', 'List your restaurant, bar and room-service menus. Guests scan from the room or the poolside.'],
        [IMAGES.places.wedding, 'Event hotspots', 'Show off your space, share packages and take bookings for tables and sections.']
    ];
    return (
        <>
            <section className="dn-banner" style={{ paddingBottom: 100 }} data-hero>
                <div className="bg" style={{ backgroundImage: `url('${IMAGES.places.bar}')` }}></div>
                <div className="container">
                    <div className="row"><div className="col-lg-7">
                        <div className="crumbs"><Link href="/">Home</Link> / For business</div>
                        <h1>Your spot, <span className="serif" style={{ color: 'var(--dn-accent-soft)' }}>beautifully served.</span></h1>
                        <p>For restaurants, hotels, lounges and event hotspots. List your spot, share a QR menu, collect ratings and take bookings — without the hassle.</p>
                        <div className="d-flex gap-2 flex-wrap mt-4">
                            <Link href="/register" className="btn-dn-light btn-lg-dn">Create my account</Link>
                            <Link href="/pricing" className="btn-dn-ghost btn-lg-dn">See pricing</Link>
                        </div>
                    </div></div>
                </div>
            </section>
            <section className="dn-section">
                <div className="container">
                    <div className="section-head"><span className="section-kicker">How it works</span><h2>Live in <span className="serif text-primary-dn">four</span> easy steps</h2></div>
                    <div className="row g-4">
                        {steps.map((s, i) => (
                            <div key={s[1]} className="col-sm-6 col-lg-3"><div className="step-card"><span className="num">0{i + 1}</span><span className="ic"><i className={`fas ${s[0]}`}></i></span><h4>{s[1]}</h4><p>{s[2]}</p></div></div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="dn-section bg-white">
                <div className="container">
                    <div className="row g-4">
                        {kinds.map((c) => (
                            <div key={c[1]} className="col-md-4">
                                <div className="spot-card">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <div className="thumb"><img src={c[0]} alt={c[1]} loading="lazy" /></div>
                                    <div className="body"><h4>{c[1]}</h4><p className="text-muted-dn mb-0" style={{ fontSize: 15 }}>{c[2]}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="dn-section">
                <div className="container">
                    <div className="section-head"><span className="section-kicker">Plans</span><h2>Choose how you want to grow</h2></div>
                    <PlanCards promo={promo} />
                </div>
            </section>
        </>
    );
}
