import { Spot } from '@/models/Spot';
import { User } from '@/models/User';
import { Payment, type IPayment } from '@/models/Payment';
import type { HydratedDocument } from 'mongoose';
import { PERIOD_DAYS } from '@/lib/plans';
import { notifyPayment } from '@/lib/notify';
import type { SubscriptionEvent } from '@/lib/emails';
import { verifyByReference, verifyTransaction, flutterwaveEnabled, type FlwTransaction } from '@/lib/flutterwave';

/** Mark a payment successful and extend/start the spot's subscription. */
export async function activatePayment(payment: HydratedDocument<IPayment>) {
    // Claim the payment atomically so the redirect and the webhook can't both extend the plan.
    const claim = await Payment.updateOne({ _id: payment._id, status: { $ne: 'success' } }, { status: 'success', paidAt: new Date(), transactionId: payment.transactionId });
    if (!claim.modifiedCount) return null;
    const spot = await Spot.findById(payment.spot);
    if (!spot) throw new Error('Spot not found for payment');
    const now = new Date();
    const s = spot.subscription || ({} as typeof spot.subscription);
    const stillActive = s.status === 'active' && s.currentPeriodEnd && s.currentPeriodEnd > now;
    // Renewing the same plan extends the period; switching plans starts a fresh 30 days today.
    const start = stillActive && s.plan === payment.plan ? (s.currentPeriodEnd as Date) : now;
    const end = new Date(start.getTime() + PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const wasLive = !!stillActive;
    const event: SubscriptionEvent | null = !wasLive ? 'activated' : s.plan === payment.plan ? null : payment.plan === 'sweet' ? 'upgraded' : 'downgraded';
    spot.subscription = { plan: payment.plan, status: 'active', currentPeriodEnd: end, startedAt: s.startedAt || now, reminderSentFor: null };
    await spot.save();
    await Payment.updateOne({ _id: payment._id }, { periodStart: start, periodEnd: end, paidAt: now });
    Object.assign(payment, { status: 'success', paidAt: now, periodStart: start, periodEnd: end });
    await User.updateOne({ _id: payment.user }, { hasPaid: true });
    try {
        await notifyPayment(payment, event); // receipt + status change email; never blocks activation
    } catch (e) {
        console.error('[email] payment notification failed', e);
    }
    return spot;
}

/** True when Flutterwave's record really is a completed payment for this Diner.ng payment. */
export function isGoodTransaction(tx: FlwTransaction, payment: { reference: string; amount: number }) {
    return tx.status === 'successful' && tx.tx_ref === payment.reference && tx.currency === 'NGN' && Number(tx.amount) >= payment.amount;
}

/**
 * Ask Flutterwave about a payment and activate the plan if it was paid.
 * Returns 'activated' | 'paid' (already done) | 'pending' | 'failed' | 'not-found'.
 */
export async function reconcilePayment(payment: HydratedDocument<IPayment>, transactionId?: string) {
    if (payment.status === 'success') return 'paid' as const;
    let tx: FlwTransaction;
    try {
        tx = transactionId ? await verifyTransaction(transactionId) : await verifyByReference(payment.reference);
    } catch {
        await Payment.updateOne({ _id: payment._id }, { checkedAt: new Date() });
        return 'not-found' as const; // no transaction on Flutterwave for this reference (checkout abandoned)
    }
    await Payment.updateOne({ _id: payment._id }, { checkedAt: new Date() });
    if (isGoodTransaction(tx, payment)) {
        payment.transactionId = String(tx.id);
        await activatePayment(payment);
        return 'activated' as const;
    }
    if (tx.status === 'failed') {
        await Payment.updateOne({ _id: payment._id, status: { $ne: 'success' } }, { status: 'failed' });
        return 'failed' as const;
    }
    return 'pending' as const; // e.g. bank transfer / USSD still settling
}

/**
 * Safety net for when the checkout redirect never reached us (closed tab, different domain, no webhook):
 * re-check this spot's recent unconfirmed Flutterwave payments. Throttled per payment.
 */
export async function reconcileSpotPayments(spotId: unknown) {
    if (!flutterwaveEnabled()) return false;
    const since = new Date(Date.now() - 14 * 864e5);
    const recheckAfter = new Date(Date.now() - 60 * 1000);
    const open = await Payment.find({
        spot: spotId,
        provider: 'flutterwave',
        status: { $in: ['pending', 'failed'] },
        createdAt: { $gt: since },
        $or: [{ checkedAt: { $exists: false } }, { checkedAt: { $lt: recheckAfter } }]
    })
        .sort({ createdAt: -1 })
        .limit(5);
    let activated = false;
    for (const p of open) {
        try {
            if ((await reconcilePayment(p)) === 'activated') activated = true;
        } catch (e) {
            console.error('reconcile payment failed', p.reference, e);
        }
    }
    return activated;
}
