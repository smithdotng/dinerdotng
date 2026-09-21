import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import { registerAction } from '@/actions/auth';
import { getCurrentUser, homeFor } from '@/lib/session';
import { isPlanKey, PLAN_LIST, promoEnabled } from '@/lib/plans';
import { naira } from '@/lib/format';

export const metadata = { title: 'List your spot' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
    const user = await getCurrentUser();
    if (user) redirect(homeFor(user.role));
    const { plan: p } = await searchParams;
    const plan = isPlanKey(p) ? p : 'basic';
    const promo = promoEnabled();
    return (
        <>
            <Link href="/" className="dn-logo d-lg-none mb-4"><Logo height={38} /></Link>
            <span className="section-kicker" style={{ marginLeft: -8 }}>Step 1 of 3</span>
            <h1>List your spot</h1>
            <p className="text-muted-dn mb-4">Create your owner account. You&apos;ll set up your spot and menu next.</p>
            <form action={registerAction}>
                <label className="form-label">Choose a plan</label>
                <div className="plan-picker mb-3">
                    {PLAN_LIST.map((pl) => (
                        <div key={pl.key}>
                            <input type="radio" name="plan" id={`plan-${pl.key}`} value={pl.key} defaultChecked={plan === pl.key} />
                            <label htmlFor={`plan-${pl.key}`}>
                                <b><i className={`fas ${pl.icon} me-1 text-primary-dn`}></i>{pl.name}</b>
                                {promo ? (
                                    <>
                                        <span style={{ fontWeight: 700, color: 'var(--dn-cocoa)' }}>{naira(pl.firstCustomerPrice)}</span> <small>first month</small><br />
                                        <small><s>{naira(pl.price)}</s> then {naira(pl.price)}/mo</small>
                                    </>
                                ) : (
                                    <><span style={{ fontWeight: 700, color: 'var(--dn-cocoa)' }}>{naira(pl.price)}</span> <small>/month</small></>
                                )}
                            </label>
                        </div>
                    ))}
                </div>
                {promo && <div className="promo-tag mt-0 mb-3"><i className="fas fa-tag"></i> First customer discount applied at checkout</div>}
                <div className="mb-3"><label className="form-label" htmlFor="name">Your full name</label><input className="form-control" id="name" name="name" required /></div>
                <div className="row g-3 mb-3">
                    <div className="col-sm-7"><label className="form-label" htmlFor="email">Email</label><input className="form-control" id="email" type="email" name="email" required /></div>
                    <div className="col-sm-5"><label className="form-label" htmlFor="phone">Phone</label><input className="form-control" id="phone" name="phone" placeholder="0803…" /></div>
                </div>
                <div className="row g-3 mb-4">
                    <div className="col-sm-6"><label className="form-label" htmlFor="password">Password</label><input className="form-control" id="password" type="password" name="password" minLength={8} required /></div>
                    <div className="col-sm-6"><label className="form-label" htmlFor="confirmPassword">Confirm password</label><input className="form-control" id="confirmPassword" type="password" name="confirmPassword" minLength={8} required /></div>
                </div>
                <button className="btn-dn btn-block btn-lg-dn">Create account</button>
                <p className="text-center mt-3 text-muted-dn">Already listed? <Link href="/login"><b>Log in</b></Link></p>
            </form>
        </>
    );
}
