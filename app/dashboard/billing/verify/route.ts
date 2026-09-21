import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { Payment } from '@/models/Payment';
import { PLANS } from '@/lib/plans';
import { verifyByReference, verifyTransaction } from '@/lib/flutterwave';
import { activatePayment } from '@/lib/subscription';
import { flashUrl } from '@/lib/helpers';

// Flutterwave redirects here after checkout: ?status=successful|cancelled&tx_ref=...&transaction_id=...
export async function GET(req: Request) {
    const to = (path: string, kind: 'success' | 'error', msg: string) => NextResponse.redirect(new URL(flashUrl(path, kind, msg), req.url));
    const user = await getCurrentUser();
    if (!user) return NextResponse.redirect(new URL('/login', req.url));
    const params = new URL(req.url).searchParams;
    const txRef = params.get('tx_ref') || '';
    const transactionId = params.get('transaction_id') || '';
    await connectDB();
    const payment = await Payment.findOne({ reference: txRef, user: user.id });
    if (!payment) return to('/dashboard/billing', 'error', 'Payment not found.');
    if (payment.status === 'success') return NextResponse.redirect(new URL('/dashboard/billing', req.url));

    if (params.get('status') === 'cancelled') {
        payment.status = 'failed';
        await payment.save();
        return to('/dashboard/billing', 'error', 'Payment cancelled. You have not been charged.');
    }

    try {
        // Verify with Flutterwave — never trust the redirect's status alone.
        const tx = transactionId ? await verifyTransaction(transactionId) : await verifyByReference(txRef);
        const ok = tx.status === 'successful' && tx.tx_ref === payment.reference && tx.currency === 'NGN' && tx.amount >= payment.amount;
        if (ok) {
            payment.transactionId = String(tx.id);
            await activatePayment(payment);
            return to('/dashboard', 'success', `Payment received — your ${PLANS[payment.plan].name} plan is active. Welcome aboard!`);
        }
        payment.status = 'failed';
        await payment.save();
        return to('/dashboard/billing', 'error', 'That payment was not completed. You have not been charged.');
    } catch (e) {
        return to('/dashboard/billing', 'error', `We couldn't confirm the payment: ${(e as Error).message}`);
    }
}
