import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMeta, SOCIAL } from '@/lib/seo';
import { IMAGES } from '@/lib/images';
import { PLANS, promoEnabled } from '@/lib/plans';
import { naira } from '@/lib/format';
import PlanCards from '@/components/PlanCards';
import { PixelEvent } from '@/components/MetaPixel';

export const metadata: Metadata = pageMeta({
    title: 'For premium restaurants, lounges & hotel dining',
    description: 'Present your venue to discerning diners: a curated listing, an elegant QR menu that is always current, verified reviews and online reservations.',
    path: '/for-business',
    image: IMAGES.places.bar
});

export default function BusinessPage() {
    const promo = promoEnabled();
    const steps = [
        ['fa-user-plus', 'Create your account', 'Tell us about your venue — name, type, location and contacts.'],
        ['fa-images', 'Present your menu', 'Add your dishes, prices and photography, and showcase your space.'],
        ['fa-credit-card', 'Choose your plan', promo ? `Basic or Sweet. First month ${naira(PLANS.basic.firstCustomerPrice)}.` : `Basic ${naira(PLANS.basic.price)} or Sweet ${naira(PLANS.sweet.price)} a month.`],
        ['fa-qrcode', 'Welcome your guests', 'Place your QR code on each table and open your reservations.']
    ];
    const kinds = [
        [IMAGES.food.fine, 'Fine dining restaurants', 'A menu as considered as your kitchen, always current. Add tasting menus and seasonal dishes in moments.'],
        [IMAGES.places.hotelRoom, 'Hotel dining', 'Present your restaurant, bar and in-room dining menus. Guests browse from the table, the suite or the poolside.'],
        [IMAGES.places.bar, 'Lounges & rooftop bars', 'Showcase your space and cocktail list, and take reservations for tables and VIP sections.']
    ];
    return (
        <>
            <PixelEvent name="ViewContent" params={{ content_name: 'For business', content_category: 'For restaurants' }} />
            <section className="dn-banner" style={{ paddingBottom: 100 }} data-hero>
                <div className="bg" style={{ backgroundImage: `url('${IMAGES.places.bar}')` }}></div>
                <div className="container">
                    <div className="row"><div className="col-lg-7">
                        <div className="crumbs"><Link href="/">Home</Link> / For business</div>
                        <h1>Your venue, <span className="serif" style={{ color: 'var(--dn-accent-soft)' }}>beautifully presented.</span></h1>
                        <p>For premium restaurants, lounges and hotel dining. Reach diners who are looking for somewhere special, give every table an elegant menu and manage reservations with ease.</p>
                        <div className="d-flex gap-2 flex-wrap mt-4">
                            <Link href="/register" className="btn-dn-light btn-lg-dn">Create my account</Link>
                            <Link href="/pricing" className="btn-dn-ghost btn-lg-dn">See pricing</Link>
                        </div>
                        <p className="mt-3 mb-0" style={{ opacity: 0.92 }}>
                            Prefer to talk first? <a href={SOCIAL.whatsapp} target="_blank" rel="noopener" style={{ color: '#fff', fontWeight: 600 }}><i className="fab fa-whatsapp me-1"></i>WhatsApp us on {SOCIAL.whatsappDisplay}</a>
                        </p>
                    </div></div>
                </div>
            </section>
            <section className="dn-section">
                <div className="container">
                    <div className="section-head"><span className="section-kicker">How it works</span><h2>Live in <span className="serif text-primary-dn">four</span> simple steps</h2></div>
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
                    <div className="section-head"><span className="section-kicker">Plans</span><h2>Choose the plan that fits your venue</h2></div>
                    <PlanCards promo={promo} />
                </div>
            </section>
        </>
    );
}
