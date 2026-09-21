import Link from 'next/link';
import { PLAN_LIST } from '@/lib/plans';
import { naira } from '@/lib/format';

export function PlanFeatures({ features, locked }: { features: string[]; locked: string[] }) {
    return (
        <ul>
            {features.map((f) => (
                <li key={f}><i className="fas fa-check-circle"></i><span>{f}</span></li>
            ))}
            {locked.map((f) => (
                <li key={f} className="off"><i className="fas fa-circle-minus"></i><span>{f}</span></li>
            ))}
        </ul>
    );
}

/** Public pricing cards with the first-customer discount. */
export default function PlanCards({ promo }: { promo: boolean }) {
    return (
        <>
            <div className="row g-4 justify-content-center">
                {PLAN_LIST.map((p) => (
                    <div className="col-md-6 col-lg-5" key={p.key}>
                        <div className={`price-card ${p.popular ? 'popular' : ''}`}>
                            {p.popular && <span className="ribbon"><i className="fas fa-crown"></i> Most popular</span>}
                            <span className="plan-ic"><i className={`fas ${p.icon}`}></i></span>
                            <h3>{p.name}</h3>
                            <div className="sub">{p.tagline}</div>
                            {promo ? (
                                <>
                                    <div className="price-now">{naira(p.firstCustomerPrice)} <small>first month</small></div>
                                    <span className="promo-tag"><i className="fas fa-tag"></i> First customer discount</span>
                                    <div className="price-was"><s>{naira(p.price)}</s> &nbsp;then <b>{naira(p.price)}</b>/month</div>
                                </>
                            ) : (
                                <div className="price-now">{naira(p.price)} <small>/month</small></div>
                            )}
                            <PlanFeatures features={p.features} locked={p.locked} />
                            <Link href={`/register?plan=${p.key}`} className={`${p.popular ? 'btn-dn' : 'btn-dn-outline'} btn-block`}>
                                Start with {p.name} — {naira(promo ? p.firstCustomerPrice : p.price)}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            {promo && (
                <p className="text-center text-muted-dn small mt-4">
                    <i className="fas fa-circle-info me-1"></i> The first customer discount applies to your first month on Diner.ng. Plans renew monthly at the standard price; switch plans any time.
                </p>
            )}
        </>
    );
}
