'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

export interface NavItem { href: string; label: string; icon: string; badge?: ReactNode; exact?: boolean }
export interface NavGroup { label?: string; items: NavItem[] }

/** Dashboard shell: sidebar (collapsible on mobile) + sticky top bar. */
export default function DashShell({ groups, top, header, children }: { groups: NavGroup[]; top?: ReactNode; header?: ReactNode; children: ReactNode }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    useEffect(() => setOpen(false), [pathname]);
    const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + '/'));
    const current = groups.flatMap((g) => g.items).find(isActive);
    const title = current?.label || 'Dashboard';
    return (
        <div className="dash">
            <aside className={`dash-side ${open ? 'open' : ''}`}>
                {top}
                {groups.map((g, gi) => (
                    <div key={gi}>
                        {g.label && <div className="label">{g.label}</div>}
                        <ul className="dash-menu">
                            {g.items.map((i) => (
                                <li key={i.href}>
                                    {i.href.startsWith('/logout') ? (
                                        <a href={i.href}><i className={`fas ${i.icon}`}></i> {i.label}</a>
                                    ) : (
                                        <Link href={i.href} className={isActive(i) ? 'active' : ''}>
                                            <i className={`fas ${i.icon}`}></i> {i.label} {i.badge}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </aside>
            {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1100 }} />}
            <div className="dash-main">
                <div className="dash-top">
                    <div className="d-flex align-items-center gap-3 min-w-0">
                        <button className="btn-icon dash-toggle" onClick={() => setOpen(true)} aria-label="Menu"><i className="fas fa-bars"></i></button>
                        <h1 className="text-truncate">{title}</h1>
                    </div>
                    {header}
                </div>
                <div className="dash-body">{children}</div>
            </div>
        </div>
    );
}
