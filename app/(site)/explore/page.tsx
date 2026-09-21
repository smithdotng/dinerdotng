import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { connectDB } from '@/lib/db';
import { Spot, type ISpot } from '@/models/Spot';
import { isFeatured, isSpotType, liveFilter, SPOT_TYPES, SPOT_TYPE_KEYS } from '@/lib/spot';
import { escapeRegex } from '@/lib/helpers';
import { IMAGES } from '@/lib/images';
import SpotCard from '@/components/SpotCard';

type SP = Promise<{ q?: string; city?: string; type?: string; sort?: string; bookable?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
    const { type = '', city = '' } = await searchParams;
    const what = isSpotType(type) ? `${SPOT_TYPES[type].label}s` : 'Restaurants, lounges & hotspots';
    const where = city ? ` in ${city}` : ' in Nigeria';
    const qs = new URLSearchParams({ ...(isSpotType(type) ? { type } : {}), ...(city ? { city } : {}) }).toString();
    return pageMeta({
        title: `${what}${where}`,
        description: `Browse ${what.toLowerCase()}${where} on Diner.ng — see menus and prices, check ratings and book a table.`,
        path: `/explore${qs ? `?${qs}` : ''}`,
        image: isSpotType(type) ? IMAGES.categories[type] : undefined
    });
}

export default async function ExplorePage({ searchParams }: { searchParams: SP }) {
    const { q = '', city = '', type = '', sort = 'featured', bookable = '' } = await searchParams;
    await connectDB();
    const filter: Record<string, unknown> = liveFilter();
    if (isSpotType(type)) filter.type = type;
    if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
    if (bookable) filter['subscription.plan'] = 'sweet';
    if (q.trim()) {
        const rx = new RegExp(escapeRegex(q.trim()), 'i');
        filter.$or = [{ name: rx }, { tagline: rx }, { cuisines: rx }, { area: rx }, { city: rx }, { description: rx }];
    }
    const sortBy: Record<string, 1 | -1> = sort === 'new' ? { createdAt: -1 } : { ratingAvg: -1, ratingCount: -1 };
    let spots = await Spot.find(filter).sort(sortBy).limit(60).lean<ISpot[]>();
    if (sort === 'featured') spots = [...spots].sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)));
    const cities = ((await Spot.distinct('city', liveFilter())) as string[]).filter(Boolean).sort();
    const heading = isSpotType(type) ? `${SPOT_TYPES[type].label}s` : 'Explore spots';

    return (
        <>
            <section className="dn-banner" data-hero>
                <div className="bg" style={{ backgroundImage: `url('${isSpotType(type) ? IMAGES.categories[type] : IMAGES.places.dining}')` }}></div>
                <div className="container">
                    <div className="crumbs"><Link href="/">Home</Link> / Explore</div>
                    <h1>{heading}{city ? ` in ${city}` : ''}</h1>
                    <p>Scan menus, check ratings and book tables at the best places around you.</p>
                </div>
            </section>
            <section className="pb-5">
                <div className="container">
                    <form className="filter-bar" method="get" action="/explore">
                        <div className="row g-2 align-items-center">
                            <div className="col-lg-4"><input className="form-control" name="q" defaultValue={q} placeholder="Search dishes, cuisines, areas…" /></div>
                            <div className="col-6 col-lg-2">
                                <select className="form-select" name="city" defaultValue={city}>
                                    <option value="">All cities</option>
                                    {cities.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-6 col-lg-2">
                                <select className="form-select" name="type" defaultValue={type}>
                                    <option value="">All types</option>
                                    {SPOT_TYPE_KEYS.map((k) => <option key={k} value={k}>{SPOT_TYPES[k].label}</option>)}
                                </select>
                            </div>
                            <div className="col-6 col-lg-2">
                                <select className="form-select" name="sort" defaultValue={sort}>
                                    <option value="featured">Featured first</option>
                                    <option value="rating">Top rated</option>
                                    <option value="new">Newest</option>
                                </select>
                            </div>
                            <div className="col-6 col-lg-2"><button className="btn-dn btn-block"><i className="fas fa-magnifying-glass"></i> Search</button></div>
                        </div>
                        <div className="form-check mt-2 ms-1">
                            <input className="form-check-input" type="checkbox" name="bookable" value="1" id="bookable" defaultChecked={!!bookable} />
                            <label className="form-check-label small" htmlFor="bookable">Only spots that take table bookings</label>
                        </div>
                    </form>

                    <div className="type-tabs my-4">
                        <Link href="/explore" className={!type ? 'active' : ''}>All</Link>
                        {SPOT_TYPE_KEYS.map((k) => (
                            <Link key={k} href={`/explore?type=${k}`} className={type === k ? 'active' : ''}><i className={`fas ${SPOT_TYPES[k].icon} me-1`}></i>{SPOT_TYPES[k].label}s</Link>
                        ))}
                    </div>

                    <p className="text-muted-dn mb-3">{spots.length} spot{spots.length === 1 ? '' : 's'} found</p>
                    {spots.length ? (
                        <div className="row g-4">
                            {spots.map((s) => <div key={String(s._id)} className="col-sm-6 col-lg-4 col-xl-3"><SpotCard s={s} /></div>)}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-bowl-food"></i>
                            <h4>No spots match that yet</h4>
                            <p className="text-muted-dn">Try a different search, or clear the filters.</p>
                            <Link href="/explore" className="btn-dn-outline">Clear filters</Link>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
