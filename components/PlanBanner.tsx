import Link from 'next/link';
import { isLive, type SpotLike } from '@/lib/spot';
import { PLANS, promoEnabled } from '@/lib/plans';
import { fmtDate, naira } from '@/lib/format';

export default function PlanBanner({ spot }: { spot: SpotLike }) {
    if (isLive(spot)) {
        const plan = PLANS[spot.subscription!.plan as 'basic' | 'sweet'];
        const end = new Date(spot.subscription!.currentPeriodEnd as Date);
        const days = Math.ceil((end.getTime() - Date.now()) / 864e5);
        return (
            <div className="plan-banner">
                <div>
                    <h4><i className={`fas ${plan.icon} me-2`}></i>{plan.name} plan · Live</h4>
                    <div style={{ opacity: 0.92 }}>Renews on {fmtDate(end)} ({days} day{days === 1 ? '' : 's'} left)</div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {plan.key === 'basic' && <Link href="/dashboard/billing?plan=sweet" className="btn-dn-light btn-sm-dn"><i className="fas fa-star"></i> Upgrade to Sweet</Link>}
                    {days <= 5 && <Link href="/dashboard/billing" className="btn-dn-ghost btn-sm-dn">Renew now</Link>}
                </div>
            </div>
        );
    }
    return (
        <div className="plan-banner inactive">
            <div>
                <h4><i className="fas fa-eye-slash me-2"></i>Your spot isn&apos;t live yet</h4>
                <div style={{ opacity: 0.92 }}>
                    Choose a plan to publish your listing and switch on your QR menu.
                    {promoEnabled() && <> First customers pay from <b>{naira(PLANS.basic.firstCustomerPrice)}</b>.</>}
                </div>
            </div>
            <Link href="/dashboard/billing" className="btn-dn-light btn-sm-dn">Go live <i className="fas fa-arrow-right"></i></Link>
        </div>
    );
}

export function Upsell({ icon, heading, text }: { icon: string; heading: string; text: string }) {
    return (
        <div className="upsell">
            <span className="ic"><i className={`fas ${icon}`}></i></span>
            <h3>{heading}</h3>
            <p className="text-muted-dn mx-auto" style={{ maxWidth: 520 }}>{text}</p>
            <Link href="/dashboard/billing?plan=sweet" className="btn-dn btn-lg-dn mt-2"><i className="fas fa-star"></i> Upgrade to Sweet</Link>
            <div className="small text-muted-dn mt-3">Also includes featured placement on the homepage and search.</div>
        </div>
    );
}
