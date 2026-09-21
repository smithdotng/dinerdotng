import { Suspense } from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/session';
import Logo from '@/components/Logo';
import Flash from '@/components/Flash';
import DashShell from '@/components/DashSidebar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdmin();
    return (
        <>
            <Suspense fallback={null}><Flash /></Suspense>
            <DashShell
                top={<Link href="/" className="dn-logo"><Logo variant="light" height={32} /></Link>}
                header={<span className="pill pill-soft"><i className="fas fa-shield-halved"></i> Admin</span>}
                groups={[
                    {
                        label: 'Diner.ng admin',
                        items: [
                            { href: '/admin', label: 'Overview', icon: 'fa-chart-line', exact: true },
                            { href: '/admin/spots', label: 'Spots', icon: 'fa-store' },
                            { href: '/admin/users', label: 'Accounts', icon: 'fa-users' },
                            { href: '/admin/payments', label: 'Payments', icon: 'fa-receipt' },
                            { href: '/admin/posts', label: 'Blog', icon: 'fa-pen-nib' },
                            { href: '/', label: 'Public site', icon: 'fa-globe', exact: true },
                            { href: '/logout', label: 'Log out', icon: 'fa-right-from-bracket' }
                        ]
                    }
                ]}
            >
                {children}
            </DashShell>
        </>
    );
}
