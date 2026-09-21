import { Suspense } from 'react';
import Link from 'next/link';
import { requireOwnerSpot } from '@/lib/owner';
import { hasSweet, isLive } from '@/lib/spot';
import { PLANS } from '@/lib/plans';
import { Reservation } from '@/models/Reservation';
import Logo from '@/components/Logo';
import Flash from '@/components/Flash';
import Enhancer from '@/components/Enhancer';
import DashShell, { type NavGroup } from '@/components/DashSidebar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard', robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, spot } = await requireOwnerSpot();
    const sweet = hasSweet(spot);
    const pending = sweet ? await Reservation.countDocuments({ spot: spot._id, status: 'pending' }) : 0;
    const lock = sweet ? null : <span className="lock">SWEET</span>;
    const groups: NavGroup[] = [
        {
            items: [
                { href: '/dashboard', label: 'Overview', icon: 'fa-gauge-high', exact: true },
                { href: '/dashboard/spot', label: 'My spot & photos', icon: 'fa-store' },
                { href: '/dashboard/menu', label: 'Menu', icon: 'fa-book-open' },
                { href: '/dashboard/qr', label: 'QR code', icon: 'fa-qrcode' },
                { href: '/dashboard/reviews', label: 'Reviews', icon: 'fa-star' }
            ]
        },
        {
            label: 'Sweet tier',
            items: [
                { href: '/dashboard/reservations', label: 'Reservations', icon: 'fa-calendar-check', badge: lock || (pending ? <span className="count">{pending}</span> : null) },
                { href: '/dashboard/tables', label: 'Tables', icon: 'fa-chair', badge: lock }
            ]
        },
        {
            label: 'Account',
            items: [
                { href: '/dashboard/billing', label: 'Plan & billing', icon: 'fa-credit-card' },
                { href: '/dashboard/settings', label: 'Settings', icon: 'fa-gear' },
                ...(user.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: 'fa-shield-halved' }] : []),
                { href: '/logout', label: 'Log out', icon: 'fa-right-from-bracket' }
            ]
        }
    ];
    const live = isLive(spot);
    const top = (
        <>
            <Link href="/" className="dn-logo"><Logo variant="light" height={32} /></Link>
            <div className="spot-mini">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {spot.logo || spot.coverImage ? <img src={spot.logo || spot.coverImage} alt="" /> : <span className="ph"></span>}
                <div className="min-w-0">
                    <b className="text-truncate d-block">{spot.name}</b>
                    <small>
                        <i className="fas fa-circle" style={{ color: live ? '#69db7c' : '#ffa94d', fontSize: 8 }}></i>{' '}
                        {live ? `Live · ${PLANS[spot.subscription.plan!].name}` : 'Not live yet'}
                    </small>
                </div>
            </div>
        </>
    );
    const header = (
        <div className="d-flex align-items-center gap-2">
            <Link href={`/spots/${spot.slug}`} target="_blank" className="btn-dn-outline btn-sm-dn d-none d-sm-inline-flex"><i className="fas fa-eye"></i> View public page</Link>
            <span className="avatar" title={user.name}>{(user.name || '?').charAt(0).toUpperCase()}</span>
        </div>
    );
    return (
        <>
            <Suspense fallback={null}><Flash /></Suspense>
            <Enhancer />
            <DashShell groups={groups} top={top} header={header}>{children}</DashShell>
        </>
    );
}
