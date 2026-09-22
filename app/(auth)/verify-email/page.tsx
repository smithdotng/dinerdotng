import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import { connectDB } from '@/lib/db';
import { getSession, homeFor } from '@/lib/session';
import { User } from '@/models/User';
import { resendVerificationAction } from '@/actions/auth';

export const metadata = { title: 'Confirm your email' };

export default async function VerifyEmailPage() {
    const session = await getSession();
    const me = session.user;
    if (!me) redirect('/login');
    if (!me.unverified) redirect(homeFor(me.role));

    // Confirmed on another device/browser? Pick that up and move on.
    await connectDB();
    const user = await User.findById(me.id).select('emailVerified').lean();
    if (!user || user.emailVerified !== false) {
        session.user = { ...me, unverified: undefined };
        await session.save();
        redirect(homeFor(me.role));
    }

    return (
        <>
            <Link href="/" className="dn-logo d-lg-none mb-4"><Logo height={38} /></Link>
            <span className="section-kicker" style={{ marginLeft: -8 }}>Step 2 of 4</span>
            <div className="verify-hero"><i className="fas fa-envelope-open-text"></i></div>
            <h1>Check your inbox</h1>
            <p className="text-muted-dn mb-3">
                We sent a confirmation link to <b className="text-dark">{me.email}</b>. Tap the button in that email to confirm it&apos;s you, then we&apos;ll get your spot set up.
            </p>
            <ul className="verify-tips text-muted-dn small mb-4">
                <li><i className="fas fa-clock"></i> The link works for 24 hours.</li>
                <li><i className="fas fa-filter"></i> Can&apos;t see it? Check Spam or Promotions.</li>
            </ul>
            <form action={resendVerificationAction} className="mb-3">
                <button className="btn-dn w-100"><i className="fas fa-paper-plane"></i> Resend confirmation email</button>
            </form>
            <a href="/verify-email" className="btn-dn-outline w-100 mb-4"><i className="fas fa-rotate"></i> I&apos;ve confirmed — continue</a>
            <p className="small text-muted-dn mb-0">
                Wrong email address? <a href="/logout" className="text-primary-dn fw-semibold">Log out</a> and sign up again.
            </p>
        </>
    );
}
