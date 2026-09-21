import { Spot } from '@/models/Spot';
import { User } from '@/models/User';
import { Payment, type IPayment } from '@/models/Payment';
import type { HydratedDocument } from 'mongoose';
import { PERIOD_DAYS } from '@/lib/plans';

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
    spot.subscription = { plan: payment.plan, status: 'active', currentPeriodEnd: end, startedAt: s.startedAt || now };
    await spot.save();
    await Payment.updateOne({ _id: payment._id }, { periodStart: start, periodEnd: end, paidAt: now });
    Object.assign(payment, { status: 'success', paidAt: now, periodStart: start, periodEnd: end });
    await User.updateOne({ _id: payment.user }, { hasPaid: true });
    return spot;
}
