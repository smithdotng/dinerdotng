'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';

const HERO_PATHS = /^\/($|explore$|pricing$|for-business$|spots\/[^/]+$)/;

export default function HeaderClient({ user }: { user: { role: string } | null }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    // Pages with a dark hero get a transparent header; confirm on the client (e.g. 404s under /spots/*).
    const [solid, setSolid] = useState(!HERO_PATHS.test(pathname));
    useEffect(() => {
        setOpen(false);
        setSolid(!document.querySelector('[data-hero]'));
    }, [pathname]);
    const home = user?.role === 'admin' ? '/admin' : '/dashboard';
    const nav = [
        ['/explore', 'Explore'],
        ['/explore?type=restaurant', 'Restaurants'],
        ['/explore?type=hotel', 'Hotels'],
        ['/explore?type=event', 'Hotspots'],
        ['/for-business', 'For business'],
        ['/pricing', 'Pricing']
    ];
    return (
        <>
            <header className={`dn-header ${solid ? 'solid' : ''}`}>
                <div className="container">
                    <Link href="/" className="dn-logo" aria-label="Diner.ng home">
                        <Logo variant="auto" />
                    </Link>
                    <ul className="dn-nav">
                        {nav.map(([href, label]) => (
                            <li key={href}>
                                <Link href={href} className={pathname === href ? 'active' : ''}>
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="dn-header-actions">
                        {user ? (
                            <Link href={home} className="btn-dn btn-sm-dn hide-md">
                                <i className="fas fa-gauge"></i> Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="btn-dn-outline btn-sm-dn hide-md">Log in</Link>
                                <Link href="/register" className="btn-dn btn-sm-dn hide-md">List your spot</Link>
                            </>
                        )}
                        <button className="dn-toggler" onClick={() => setOpen(true)} aria-label="Open menu">
                            <i className="fas fa-bars"></i>
                        </button>
                    </div>
                </div>
            </header>
            <div className={`dn-mobile ${open ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
                <div className="dn-mobile-panel">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Link href="/" className="dn-logo">
                            <Logo height={30} />
                        </Link>
                        <button className="btn-icon" onClick={() => setOpen(false)} aria-label="Close">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    {nav.map(([href, label]) => (
                        <Link key={href} className="link" href={href}>{label}</Link>
                    ))}
                    <div className="mt-3 d-grid gap-2">
                        {user ? (
                            <>
                                <Link href={home} className="btn-dn">Dashboard</Link>
                                <a href="/logout" className="btn-dn-outline">Log out</a>
                            </>
                        ) : (
                            <>
                                <Link href="/register" className="btn-dn">List your spot</Link>
                                <Link href="/login" className="btn-dn-outline">Log in</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
