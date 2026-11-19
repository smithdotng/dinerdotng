import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { IMAGES } from '@/lib/images';
import { PLANS, promoEnabled } from '@/lib/plans';
import { naira } from '@/lib/format';
import PlanCards from '@/components/PlanCards';
import { PixelEvent } from '@/components/MetaPixel';

export const metadata: Metadata = pageMeta({
    title: 'Pricing — list your venue',
    description: `List your premium restaurant, lounge or hotel dining on Diner.ng. Basic ${naira(PLANS.basic.price)}/month or Sweet ${naira(PLANS.sweet.price)}/month. No setup fees, no contracts.`,
    path: '/pricing'
});

const ROWS: [string, boolean, boolean][] = [
    ['Curated listing (photography, hours, location, story)', true, true],
    ['Elegant digital menu + your own QR code', true, true],
    ['Verified guest reviews, with personal replies', true, true],
    ['Menu views & scan insights', true, true],
    ['Featured placement on homepage & search', false, true],
    ['Online reservations', false, true],
    ['Table management (sections, seating, live status)', false, true],
    ['Per-table QR codes', false, true],
    ['Dedicated priority support', false, true]
];

export default function PricingPage() {
    const promo = promoEnabled();
    const faq = [
        ...(promo
            ? [['Is there a first-month rate?', `New venues that have not paid for a plan before pay ${naira(PLANS.basic.firstCustomerPrice)} (Basic) or ${naira(PLANS.sweet.firstCustomerPrice)} (Sweet) for the first month; the plan then renews at the standard monthly price.`]]
            : []),
        ['Who is Diner.ng for?', 'Premium and upscale restaurants, lounges, rooftop bars and hotel dining in Nigeria — venues where guests reserve ahead, dress for the evening and expect the service to match.'],
        ['How do guests see my menu?', 'Once your plan is active you get your own menu link (diner.ng/m/your-venue) and a print-ready QR code. Guests scan it with their phone camera — no app needed.'],
        ['Can I change my menu after printing the QR code?', 'Yes. The QR code always opens your live menu, so new prices, seasonal dishes and tonight’s specials appear instantly.'],
        ["What happens if I don't renew?", 'Your listing and menu go offline at the end of your paid month, but your menu, photography and reviews are kept safe. Renew any time to go live again.'],
        ['Can I upgrade from Basic to Sweet?', 'Any time from your dashboard. Sweet unlocks featured placement, reservations and table management straight away.']
    ];
    const tick = (on: boolean) => (on ? <i className="fas fa-check-circle" style={{ color: '#2b8a3e' }}></i> : <i className="fas fa-minus" style={{ color: '#ccc' }}></i>);
    return (
        <>
            <PixelEvent name="ViewContent" params={{ content_name: 'Pricing', content_category: 'For restaurants' }} />
            <section className="dn-banner" data-hero>
                <div className="bg" style={{ backgroundImage: `url('${IMAGES.places.diningRoom}')` }}></div>
                <div className="container text-center">
                    <div className="crumbs"><Link href="/">Home</Link> / Pricing</div>
                    <h1>List your venue on Diner.ng</h1>
                    <p className="mx-auto">
                        Two monthly plans for premium restaurants, lounges and hotel dining. No setup fees, no contracts.{promo && <> New venues pay {naira(PLANS.basic.firstCustomerPrice)} for the first month.</>}
                    </p>
                </div>
            </section>
            <section className="dn-section" style={{ paddingTop: 70 }}>
                <div className="container"><PlanCards promo={promo} /></div>
            </section>
            <section className="dn-section bg-white">
                <div className="container" style={{ maxWidth: 980 }}>
                    <div className="section-head"><span className="section-kicker">Compare</span><h2>What&apos;s in each plan</h2></div>
                    <div className="table-responsive">
                        <table className="table-dn" style={{ fontSize: 15 }}>
                            <thead><tr><th>Feature</th><th className="text-center">Basic</th><th className="text-center">Sweet</th></tr></thead>
                            <tbody>
                                {ROWS.map((r) => <tr key={r[0]}><td>{r[0]}</td><td className="text-center">{tick(r[1])}</td><td className="text-center">{tick(r[2])}</td></tr>)}
                                {promo && <tr><td><b>First month</b></td><td className="text-center"><b>{naira(PLANS.basic.firstCustomerPrice)}</b></td><td className="text-center"><b>{naira(PLANS.sweet.firstCustomerPrice)}</b></td></tr>}
                                <tr><td><b>Monthly price</b></td><td className="text-center">{naira(PLANS.basic.price)}</td><td className="text-center">{naira(PLANS.sweet.price)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <section className="dn-section">
                <div className="container" style={{ maxWidth: 820 }}>
                    <div className="section-head"><span className="section-kicker">FAQ</span><h2>Good to know</h2></div>
                    {faq.map(([q, a], i) => (
                        <details key={q} className="panel mb-2" style={{ padding: '18px 22px' }} open={i === 0}>
                            <summary style={{ fontWeight: 600, color: 'var(--dn-cocoa)', cursor: 'pointer' }}>{q}</summary>
                            <p className="text-muted-dn mb-0 mt-2">{a}</p>
                        </details>
                    ))}
                </div>
            </section>
        </>
    );
}
