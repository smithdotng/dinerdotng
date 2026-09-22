import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSession } from '@/lib/session';
import { flashUrl } from '@/lib/helpers';
import { confirmEmailToken, sendWelcomeEmail } from '@/lib/notify';
import { Spot } from '@/models/Spot';

// Link from the confirmation email: /verify-email/confirm?token=...
export async function GET(req: Request) {
    const go = (path: string) => NextResponse.redirect(new URL(path, req.url));
    const token = new URL(req.url).searchParams.get('token') || '';
    await connectDB();
    const result = await confirmEmailToken(token);
    const session = await getSession();

    if (!result.ok) {
        if (result.reason === 'expired') {
            return go(flashUrl(session.user ? '/verify-email' : '/login', 'error', 'That confirmation link has expired. ' + (session.user ? 'Tap “Resend” for a fresh one.' : 'Log in and we’ll send you a fresh one.')));
        }
        if (session.user && !session.user.unverified) return go('/dashboard');
        return go(flashUrl(session.user ? '/verify-email' : '/login', 'error', 'That confirmation link is invalid or has already been used.'));
    }

    const user = result.user;
    // The link proves ownership of the inbox, so sign them in on this device too.
    session.user = { id: user._id.toString(), name: user.name, firstName: user.name.split(' ')[0], email: user.email, role: user.role };
    await session.save();
    await sendWelcomeEmail(user, new URL(req.url).origin);

    const hasSpot = await Spot.exists({ owner: user._id });
    const first = user.name.split(' ')[0];
    return go(flashUrl(hasSpot ? '/dashboard' : '/onboarding', 'success', `Email confirmed — welcome to Diner.ng, ${first}! Let's set up your spot.`));
}
