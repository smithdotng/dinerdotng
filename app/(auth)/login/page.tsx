import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import { loginAction } from '@/actions/auth';
import { getCurrentUser, homeFor } from '@/lib/session';

export const metadata = { title: 'Log in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const user = await getCurrentUser();
    if (user) redirect(homeFor(user.role));
    const { next = '' } = await searchParams;
    return (
        <>
            <Link href="/" className="dn-logo d-lg-none mb-4"><Logo height={38} /></Link>
            <h1>Welcome back</h1>
            <p className="text-muted-dn mb-4">Log in to manage your spot, menu and bookings.</p>
            <form action={loginAction}>
                <input type="hidden" name="next" value={next} />
                <div className="mb-3"><label className="form-label" htmlFor="email">Email</label><input className="form-control" id="email" type="email" name="email" required autoFocus /></div>
                <div className="mb-4"><label className="form-label" htmlFor="password">Password</label><input className="form-control" id="password" type="password" name="password" required /></div>
                <button className="btn-dn btn-block btn-lg-dn">Log in</button>
                <p className="text-center mt-3 text-muted-dn">New to Diner.ng? <Link href="/register"><b>List your spot</b></Link></p>
            </form>
        </>
    );
}
