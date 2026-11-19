import Link from 'next/link';
import { Suspense } from 'react';
import Logo from '@/components/Logo';
import Flash from '@/components/Flash';
import { IMAGES } from '@/lib/images';
import { PLANS, promoEnabled } from '@/lib/plans';
import { naira } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: true } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={null}><Flash /></Suspense>
            <div className="auth-wrap">
                <aside className="auth-side">
                    <div className="bg" style={{ backgroundImage: `url('${IMAGES.auth}')` }}></div>
                    <Link href="/" className="dn-logo"><Logo variant="light" height={44} /></Link>
                    <div>
                        {promoEnabled() && <span className="hero-badge"><i className="fas fa-tag"></i> First-month rate: {naira(PLANS.basic.firstCustomerPrice)}</span>}
                        <h2>Exceptional venues deserve <span className="serif" style={{ color: 'var(--dn-accent-soft)' }}>an exceptional presence.</span></h2>
                        <p className="mt-3" style={{ opacity: 0.9, maxWidth: 460 }}>
                            Present your venue to discerning diners, give every table an elegant, always-current menu, and manage reservations and reviews from one dashboard.
                        </p>
                    </div>
                    <div className="d-flex gap-4 small" style={{ opacity: 0.9 }}>
                        <span><i className="fas fa-qrcode me-1"></i> QR menus</span>
                        <span><i className="fas fa-star me-1"></i> Reviews</span>
                        <span><i className="fas fa-calendar-check me-1"></i> Bookings</span>
                    </div>
                </aside>
                <main className="auth-main"><div className="auth-card">{children}</div></main>
            </div>
        </>
    );
}
