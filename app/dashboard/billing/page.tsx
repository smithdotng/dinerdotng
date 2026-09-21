import { requireOwnerSpot } from '@/lib/owner';
import { User } from '@/models/User';
import { Payment, type IPayment } from '@/models/Payment';
import { isLive } from '@/lib/spot';
import { isPlanKey, PLAN_LIST, PLANS, priceFor } from '@/lib/plans';
import { fmtDate, naira } from '@/lib/format';
import { flutterwaveEnabled } from '@/lib/flutterwave';
import { checkoutAction } from '@/actions/owner';
import PlanBanner from '@/components/PlanBanner';
import { PlanFeatures } from '@/components/PlanCards';

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
    const { user, spot } = await requireOwnerSpot();
    const { plan } = await searchParams;
    const highlight = isPlanKey(plan) ? plan : null;
    const [account, payments] = await Promise.all([
        User.findById(user.id).lean(),
        Payment.find({ spot: spot._id }).sort({ createdAt: -1 }).limit(24).lean<IPayment[]>()
    ]);
    const live = isLive(spot);

    return (
        <>
            <PlanBanner spot={spot} />
            {!flutterwaveEnabled() && (
                <div className="alert alert-info">
                    <i className="fas fa-flask me-2"></i><b>Demo mode:</b> no Flutterwave keys are set, so choosing a plan activates it instantly without charging. Add <code>FLW_SECRET_KEY</code> to your <code>.env.local</code> to take real payments.
                </div>
            )}
            <div className="row g-4 mb-2">
                {PLAN_LIST.map((p) => {
                    const pr = priceFor(p.key, account);
                    const current = live && spot.subscription.plan === p.key;
                    const pop = highlight ? highlight === p.key : p.popular;
                    return (
                        <div key={p.key} className="col-lg-6">
                            <div className={`price-card ${pop ? 'popular' : ''}`}>
                                {current ? <span className="ribbon" style={{ background: '#2b8a3e' }}><i className="fas fa-check"></i> Current plan</span> : p.popular && <span className="ribbon"><i className="fas fa-crown"></i> Most popular</span>}
                                <span className="plan-ic"><i className={`fas ${p.icon}`}></i></span>
                                <h3>{p.name}</h3>
                                <div className="sub">{p.tagline}</div>
                                <div className="price-now">{naira(pr.amount)} <small>{pr.firstCustomer ? 'first month' : '/month'}</small></div>
                                {pr.firstCustomer && (
                                    <>
                                        <span className="promo-tag"><i className="fas fa-tag"></i> First customer discount — you save {naira(pr.regular - pr.amount)}</span>
                                        <div className="price-was"><s>{naira(pr.regular)}</s> &nbsp;then <b>{naira(pr.regular)}</b>/month</div>
                                    </>
                                )}
                                <PlanFeatures features={p.features} locked={p.locked} />
                                <form action={checkoutAction}>
                                    <input type="hidden" name="plan" value={p.key} />
                                    <button className={`${p.popular ? 'btn-dn' : 'btn-dn-outline'} btn-block btn-lg-dn`}>
                                        {current ? `Renew for 30 days — ${naira(pr.amount)}` : live ? `Switch to ${p.name} — ${naira(pr.amount)}` : `Pay ${naira(pr.amount)} & go live`}
                                    </button>
                                </form>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="small text-muted-dn">
                <i className="fas fa-lock me-1"></i> Payments are processed securely by Flutterwave (card, bank transfer, USSD). Renewing the same plan adds 30 days to your current period; switching plans starts a new 30-day period today.
            </p>
            <div className="card-dn mt-4">
                <h5>Payment history</h5>
                {!payments.length ? (
                    <p className="text-muted-dn mb-0">No payments yet.</p>
                ) : (
                    <div className="table-responsive"><table className="table-dn">
                        <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Period</th><th>Reference</th><th>Status</th></tr></thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={String(p._id)}>
                                    <td>{fmtDate(p.paidAt || p.createdAt)}</td>
                                    <td>{PLANS[p.plan].name}{p.firstCustomerDiscount && <span className="pill pill-amber ms-1">First customer</span>}</td>
                                    <td><b>{naira(p.amount)}</b>{p.regularAmount && p.regularAmount > p.amount && <small className="text-muted-dn ms-1"><s>{naira(p.regularAmount)}</s></small>}</td>
                                    <td className="small">{p.periodStart ? `${fmtDate(p.periodStart, { day: 'numeric', month: 'short' })} – ${fmtDate(p.periodEnd!)}` : '—'}</td>
                                    <td className="small"><code>{p.reference}</code>{p.provider !== 'flutterwave' && <span className="pill pill-muted ms-1">{p.provider}</span>}</td>
                                    <td><span className={`pill ${p.status === 'success' ? 'pill-green' : p.status === 'failed' ? 'pill-red' : 'pill-amber'}`}>{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>
        </>
    );
}
