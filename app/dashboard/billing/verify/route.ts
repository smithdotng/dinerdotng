import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { Payment } from '@/models/Payment';
import { PLANS } from '@/lib/plans';
import { reconcilePayment } from '@/lib/subscription';
import { flashUrl } from '@/lib/helpers';

// Flutterwave redirects here after checkout: ?status=successful|completed|cancelled&tx_ref=...&transaction_id=...
// Activation depends only on Flutterwave's own verify API, so it is safe even if the owner's
// session didn't survive the trip (e.g. they paid on another device or domain).
export async function GET(req: Request) {
    const user = await getCurrentUser();
    const home = user ? '/dashboard' : '/login';
    const billing = user ? '/dashboard/billing' : '/login';
    const to = (path: string, kind: 'success' | 'error', msg: string) => NextResponse.redirect(new URL(flashUrl(path, kind, msg), req.url));

    const params = new URL(req.url).searchParams;
    const txRef = params.get('tx_ref') || '';
    const transactionId = params.get('transaction_id') || '';
    if (!txRef) return to(billing, 'error', 'Missing payment reference.');

    await connectDB();
    const payment = await Payment.findOne({ reference: txRef });
    if (!payment || (user && String(payment.user) !== user.id)) return to(billing, 'error', 'Payment not found.');
    if (payment.status === 'success') return to(home, 'success', 'Payment confirmed — your plan is active.');

    if (params.get('status') === 'cancelled' && !transactionId) {
        payment.status = 'failed';
        await payment.save();
        return to(billing, 'error', 'Payment cancelled. You have not been charged.');
    }

    try {
        const result = await reconcilePayment(payment, transactionId || undefined);
        if (result === 'activated' || result === 'paid') {
            revalidatePath('/', 'layout');
            const msg = `Payment received — your ${PLANS[payment.plan].name} plan is active. Welcome aboard!`;
            return to(home, 'success', user ? msg : `${msg} Log in to manage your spot.`);
        }
        if (result === 'pending') {
            return to(billing, 'success', 'Your payment is still being confirmed by the bank. Your spot goes live automatically once it clears — refresh this page in a few minutes.');
        }
        return to(billing, 'error', 'That payment was not completed. If you were debited, refresh this page in a minute or contact support with reference ' + txRef + '.');
    } catch (e) {
        return to(billing, 'error', `We couldn't confirm the payment yet: ${(e as Error).message}. Refresh this page in a minute.`);
    }
}
