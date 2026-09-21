import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Spot, type ISpot } from '@/models/Spot';
import { liveFilter, SPOT_TYPES, SPOT_TYPE_KEYS } from '@/lib/spot';
import { IMAGES } from '@/lib/images';
import { promoEnabled, PLANS } from '@/lib/plans';
import { naira } from '@/lib/format';
import SpotCard from '@/components/SpotCard';
import PlanCards from '@/components/PlanCards';
import PostCard from '@/components/PostCard';
import { Post, publishedFilter, type IPost } from '@/models/Post';

const STEPS = [
    ['fa-magnifying-glass-location', 'Discover', 'Browse restaurants, hotels and hotspots near you with real photos and ratings.'],
    ['fa-qrcode', 'Scan the menu', 'Scan the QR code on your table to see the full menu and prices instantly.'],
    ['fa-calendar-check', 'Book a table', 'Reserve your table ahead at Sweet-tier spots and get a booking code.'],
    ['fa-star', 'Rate & review', 'Tell the spot how it went. Your feedback helps them serve you better.']
];

export default async function HomePage() {
    await connectDB();
    const live = liveFilter();
    const [featured, topRated, cities, counts] = await Promise.all([
        Spot.find({ ...live, $or: [{ 'subscription.plan': 'sweet' }, { featuredOverride: true }] }).sort({ ratingAvg: -1 }).limit(4).lean<ISpot[]>(),
        Spot.find(live).sort({ ratingAvg: -1, ratingCount: -1 }).limit(8).lean<ISpot[]>(),
        Spot.distinct('city', live),
        Spot.aggregate<{ _id: string; n: number }>([{ $match: live }, { $group: { _id: '$type', n: { $sum: 1 } } }])
    ]);
    const posts = await Post.find(publishedFilter()).sort({ featured: -1, publishedAt: -1 }).limit(3).lean<IPost[]>();
    const typeCounts = Object.fromEntries(counts.map((c) => [c._id, c.n]));
    const promo = promoEnabled();

    return (
        <>
            {/* HERO */}
            <section className="dn-hero" data-hero>
                <div className="dn-hero-bg" style={{ backgroundImage: `url('${IMAGES.hero}')` }}></div>
                <span className="shape shape-1"></span>
                <span className="shape shape-2"></span>
                <div className="container">
                    <div className="row align-items-center gy-5">
                        <div className="col-lg-7">
                            <span className="hero-badge animate__animated animate__fadeInDown">
                                <i className="fas fa-fire-flame-curved"></i> Restaurants · Hotels · Event hotspots across Nigeria
                            </span>
                            <h1 className="animate__animated animate__fadeInUp">
                                Find your next <span className="serif">favourite table.</span>
                            </h1>
                            <p className="lead animate__animated animate__fadeInUp">
                                Discover great spots, scan the menu before you sit, rate your experience and book a table — all on Diner.ng.
                            </p>
                            <form className="hero-search animate__animated animate__fadeInUp" action="/explore" method="get">
                                <div className="field">
                                    <i className="fas fa-magnifying-glass"></i>
                                    <input type="text" name="q" placeholder="Jollof, suya, rooftop, brunch…" aria-label="Search" />
                                </div>
                                <div className="field">
                                    <i className="fas fa-location-dot"></i>
                                    <select name="city" aria-label="City" defaultValue="">
                                        <option value="">Any city</option>
                                        {(cities as string[]).filter(Boolean).sort().map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <button className="btn-dn" type="submit">Search</button>
                            </form>
                            <div className="hero-chips">
                                {SPOT_TYPE_KEYS.map((k) => (
                                    <Link key={k} href={`/explore?type=${k}`}><i className={`fas ${SPOT_TYPES[k].icon} me-1`}></i>{SPOT_TYPES[k].label}s</Link>
                                ))}
                            </div>
                        </div>
                        <div className="col-lg-5">
                            <div className="hero-collage">
                                <div className="ph ph-1" style={{ backgroundImage: `url('${IMAGES.heroSide}')` }}></div>
                                <div className="ph ph-2" style={{ backgroundImage: `url('${IMAGES.food.spread}')` }}></div>
                                <div className="ph ph-3" style={{ backgroundImage: `url('${IMAGES.food.cocktail}')` }}></div>
                                <div className="hero-float f1"><span className="ic"><i className="fas fa-qrcode"></i></span><div><b>Scan. See. Order.</b><br /><small className="text-muted-dn">QR menu in seconds</small></div></div>
                                <div className="hero-float f2"><span className="ic"><i className="fas fa-calendar-check"></i></span><div><b>Table for 4, 8pm</b><br /><small className="text-muted-dn">Booking confirmed</small></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className="dn-section tight">
                <div className="container">
                    <div className="section-head">
                        <span className="section-kicker">Where to?</span>
                        <h2>Great spots for every <span className="serif text-primary-dn">mood</span></h2>
                        <p>From quiet breakfast cafés to rooftop lounges and full-blown event venues.</p>
                    </div>
                    <div className="row g-3">
                        {SPOT_TYPE_KEYS.map((k, i) => (
                            <div key={k} className={i < 2 ? 'col-md-6' : 'col-md-4'}>
                                <Link href={`/explore?type=${k}`} className="cat-tile">
                                    <div className="bg" style={{ backgroundImage: `url('${IMAGES.categories[k]}')` }}></div>
                                    <div className="info">
                                        <i className={`fas ${SPOT_TYPES[k].icon}`}></i>
                                        <h4>{SPOT_TYPES[k].label}s</h4>
                                        <small>{typeCounts[k] || 0} listed</small>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURED */}
            {featured.length > 0 && (
                <section className="dn-section tight bg-sand">
                    <div className="container">
                        <div className="head-row">
                            <div><span className="section-kicker" style={{ marginLeft: -8 }}>Featured</span><h2>Sweet spots worth the trip</h2></div>
                            <Link href="/explore" className="btn-dn-outline btn-sm-dn">View all <i className="fas fa-arrow-right"></i></Link>
                        </div>
                        <div className="row g-4">
                            {featured.map((s) => <div key={String(s._id)} className="col-sm-6 col-lg-3"><SpotCard s={s} /></div>)}
                        </div>
                    </div>
                </section>
            )}

            {/* HOW IT WORKS */}
            <section className="dn-section">
                <div className="container">
                    <div className="section-head">
                        <span className="section-kicker">For guests</span>
                        <h2>Dining out, made <span className="serif text-primary-dn">easy</span></h2>
                        <p>No app to download. Just your phone camera and an appetite.</p>
                    </div>
                    <div className="row g-4">
                        {STEPS.map((s, i) => (
                            <div key={s[1]} className="col-sm-6 col-lg-3">
                                <div className="step-card"><span className="num">0{i + 1}</span><span className="ic"><i className={`fas ${s[0]}`}></i></span><h4>{s[1]}</h4><p>{s[2]}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TOP RATED */}
            <section className="dn-section tight" style={{ paddingTop: 0 }}>
                <div className="container">
                    <div className="head-row">
                        <div><span className="section-kicker" style={{ marginLeft: -8 }}>Loved by guests</span><h2>Top-rated spots</h2></div>
                        <Link href="/explore?sort=rating" className="btn-dn-outline btn-sm-dn">See more <i className="fas fa-arrow-right"></i></Link>
                    </div>
                    {topRated.length ? (
                        <div className="row g-4">
                            {topRated.map((s) => <div key={String(s._id)} className="col-sm-6 col-lg-3"><SpotCard s={s} /></div>)}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-utensils"></i>
                            <h4>Spots are being plated up</h4>
                            <p className="text-muted-dn">Be one of the first on Diner.ng{promo ? ` — first customers list from ${naira(PLANS.basic.firstCustomerPrice)}` : ''}.</p>
                            <Link href="/register" className="btn-dn">List your spot</Link>
                        </div>
                    )}
                </div>
            </section>

            {/* BLOG */}
            {posts.length > 0 && (
                <section className="dn-section tight" style={{ paddingTop: 0 }}>
                    <div className="container">
                        <div className="head-row">
                            <div><span className="section-kicker" style={{ marginLeft: -8 }}>From the blog</span><h2>Guides, reviews &amp; hot offers</h2></div>
                            <Link href="/blog" className="btn-dn-outline btn-sm-dn">Read the blog <i className="fas fa-arrow-right"></i></Link>
                        </div>
                        <div className="row g-4">
                            {posts.map((p) => <div key={String(p._id)} className="col-md-4"><PostCard p={p} /></div>)}
                        </div>
                    </div>
                </section>
            )}

            {/* FOR OWNERS */}
            <section className="dn-section bg-white">
                <div className="container">
                    <div className="row align-items-center gy-5">
                        <div className="col-lg-6 order-lg-2">
                            <span className="section-kicker" style={{ marginLeft: -8 }}>For hospitality entrepreneurs</span>
                            <h2 style={{ fontSize: 'clamp(30px,3.4vw,42px)' }} className="mb-3">Everything your spot needs to <span className="serif text-primary-dn">welcome guests</span></h2>
                            <p className="text-muted-dn mb-4">Create your account, build your menu, and get a unique QR link your guests can scan at the table. Collect ratings, showcase your photos and take reservations.</p>
                            {[
                                ['fa-store', 'A beautiful listing', 'Photos, opening hours, location, contacts and your story — searchable by guests.'],
                                ['fa-qrcode', 'QR menu you can update any time', 'Change prices, mark dishes sold out and add specials — no reprinting.'],
                                ['fa-comments', 'Ratings & guest feedback', 'Guests rate food, service and ambience. Reply publicly and win them back.'],
                                ['fa-chair', 'Book-a-table & table management', 'On the Sweet tier: online reservations, table plans and per-table QR codes.']
                            ].map((f) => (
                                <div key={f[1]} className="feature-row"><span className="ic"><i className={`fas ${f[0]}`}></i></span><div><h5>{f[1]}</h5><p>{f[2]}</p></div></div>
                            ))}
                            <div className="d-flex gap-2 flex-wrap mt-4">
                                <Link href="/register" className="btn-dn btn-lg-dn">List your spot</Link>
                                <Link href="/for-business" className="btn-dn-outline btn-lg-dn">How it works</Link>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="img-stack">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img className="main" src={IMAGES.ownerSection} alt="Restaurant dining room" />
                                <div className="phone">
                                    <div className="screen">
                                        <div className="top"><i className="fas fa-utensils me-1"></i> Menu</div>
                                        {[['Smoky party jollof', 6500], ['Beef suya platter', 8000], ['Goat pepper soup', 7500], ['Chapman', 3000]].map(([n, p]) => (
                                            <div key={n} className="row-i"><span>{n}</span><b>{naira(p as number)}</b></div>
                                        ))}
                                        <div className="p-2 text-center"><span className="pill pill-featured"><i className="fas fa-star"></i> Rate us</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section className="dn-section">
                <div className="container">
                    <div className="section-head">
                        <span className="section-kicker">Pricing</span>
                        <h2>Simple plans. <span className="serif text-primary-dn">Sweet</span> launch prices.</h2>
                        <p>Monthly billing in Naira.{promo ? ' First customers get their first month at a special discount.' : ''}</p>
                    </div>
                    <PlanCards promo={promo} />
                </div>
            </section>

            {/* CTA */}
            <section className="pb-5 mb-5">
                <div className="container">
                    <div className="dn-cta">
                        <div className="bg" style={{ backgroundImage: `url('${IMAGES.cta}')` }}></div>
                        <div className="row align-items-center gy-4">
                            <div className="col-lg-8">
                                <h2>Ready to fill more tables?</h2>
                                <p className="mb-0" style={{ opacity: 0.92, fontSize: 18 }}>
                                    Join Diner.ng today{promo ? ` — go live from just ${naira(PLANS.basic.firstCustomerPrice)} for your first month` : ''}.
                                </p>
                            </div>
                            <div className="col-lg-4 text-lg-end"><Link href="/register" className="btn-dn-light btn-lg-dn">Get started <i className="fas fa-arrow-right"></i></Link></div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
