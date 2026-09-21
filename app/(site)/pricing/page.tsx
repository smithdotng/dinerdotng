import Link from 'next/link';
import type { Metadata } from 'next';
import { IMAGES } from '@/lib/images';
import { PLANS, promoEnabled } from '@/lib/plans';
import { naira } from '@/lib/format';
import PlanCards from '@/components/PlanCards';

export const metadata: Metadata = { title: 'Pricing — list your spot' };

const ROWS: [string, boolean, boolean][] = [
    ['Listing on Diner.ng (photos, hours, location)', true, true],
    ['Digital menu + unique QR code link', true, true],
    ['Guest ratings & reviews, with replies', true, true],
    ['Menu views & scan statistics', true, true],
    ['Featured placement on homepage & search', false, true],
    ['Book-a-table reservations', false, true],
    ['Table management (seats, areas, live status)', false, true],
    ['Per-table QR codes', false, true],
    ['Priority support', false, true]
];

export default function PricingPage() {
    const promo = promoEnabled();
    const faq = [
        ['Who counts as a first customer?', `Any new Diner.ng account that has not paid for a plan before. Your first month is charged at the discounted price (${naira(PLANS.basic.firstCustomerPrice)} for Basic, ${naira(PLANS.sweet.firstCustomerPrice)} for Sweet); after that the plan renews at the standard monthly price.`],
        ['How do guests see my menu?', 'Once your plan is active you get a unique link (diner.ng/m/your-spot) and a printable QR code. Guests scan it with their phone camera — no app needed.'],
        ['Can I change my menu after printing the QR code?', 'Yes. The QR code always points to your live menu, so price changes, new dishes and sold-out items show up instantly.'],
        ["What happens if I don't renew?", 'Your listing and QR menu go offline at the end of your paid month, but your menu, photos and reviews are kept safe. Renew any time to go live again.'],
        ['Can I upgrade from Basic to Sweet?', 'Any time from your dashboard. Sweet unlocks featured placement, reservations and table management straight away.']
    ];
    const tick = (on: boolean) => (on ? <i className="fas fa-check-circle" style={{ color: '#2b8a3e' }}></i> : <i className="fas fa-minus" style={{ color: '#ccc' }}></i>);
    return (
        <>
            <section className="dn-banner" data-hero>
                <div className="bg" style={{ backgroundImage: `url('${IMAGES.places.diningRoom}')` }}></div>
                <div className="container text-center">
                    <div className="crumbs"><Link href="/">Home</Link> / Pricing</div>
                    <h1>List your spot on Diner.ng</h1>
                    <p className="mx-auto">
                        Two simple monthly plans.{promo && <> <b>First customers</b> get their first month from just {naira(PLANS.basic.firstCustomerPrice)}.</>}
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
                                {promo && <tr><td><b>First month (first customer discount)</b></td><td className="text-center"><b>{naira(PLANS.basic.firstCustomerPrice)}</b></td><td className="text-center"><b>{naira(PLANS.sweet.firstCustomerPrice)}</b></td></tr>}
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
