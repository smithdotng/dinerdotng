import crypto from 'crypto';
import { User } from '@/models/User';
import { Spot } from '@/models/Spot';
import type { IPayment } from '@/models/Payment';
import { sendEmail } from '@/lib/mailer';
import { siteUrl } from '@/lib/seo';
import { paymentReceiptTemplate, subscriptionStatusTemplate, verifyEmailTemplate, welcomeTemplate, type SubscriptionEvent } from '@/lib/emails';
import type { PlanKey } from '@/lib/plans';

export const VERIFY_TOKEN_HOURS = 24;
const hash = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

/** Create a fresh single-use verification token (only its hash is stored) and email the link. */
export async function sendVerificationEmail(userId: unknown, base?: string) {
    const user = await User.findById(userId);
    if (!user || user.emailVerified !== false) return false;
    const token = crypto.randomBytes(32).toString('base64url');
    user.verifyTokenHash = hash(token);
    user.verifyTokenExpires = new Date(Date.now() + VERIFY_TOKEN_HOURS * 3600 * 1000);
    user.verifySentAt = new Date();
    await user.save();
    const root = (base || siteUrl()).replace(/\/$/, '');
    const url = `${root}/verify-email/confirm?token=${token}`;
    return sendEmail({ to: user.email, ...verifyEmailTemplate({ name: user.name, url, base: root, hours: VERIFY_TOKEN_HOURS }) });
}

/** Consume a verification token. Returns the user on success, or a reason. */
export async function confirmEmailToken(token: string) {
    if (!token || token.length < 20) return { ok: false as const, reason: 'invalid' as const };
    const user = await User.findOne({ verifyTokenHash: hash(token) });
    if (!user) return { ok: false as const, reason: 'invalid' as const };
    if (!user.verifyTokenExpires || user.verifyTokenExpires < new Date()) return { ok: false as const, reason: 'expired' as const, user };
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.verifyTokenHash = undefined;
    user.verifyTokenExpires = undefined;
    await user.save();
    return { ok: true as const, user };
}

export async function sendWelcomeEmail(user: { name: string; email: string }, base?: string) {
    return sendEmail({ to: user.email, ...welcomeTemplate({ name: user.name, base }) });
}

/** Receipt + (when the status actually changed) a subscription status email, after a successful payment. */
export async function notifyPayment(payment: Pick<IPayment, 'user' | 'spot' | 'plan' | 'amount' | 'regularAmount' | 'firstCustomerDiscount' | 'reference' | 'transactionId' | 'provider' | 'paidAt' | 'periodStart' | 'periodEnd'>, event: SubscriptionEvent | null) {
    const [user, spot] = await Promise.all([User.findById(payment.user).lean(), Spot.findById(payment.spot).select('name slug subscription').lean()]);
    if (!user || !spot) return;
    await sendEmail({
        to: user.email,
        ...paymentReceiptTemplate({
            name: user.name,
            spotName: spot.name,
            plan: payment.plan,
            amount: payment.amount,
            regularAmount: payment.regularAmount,
            firstCustomerDiscount: payment.firstCustomerDiscount,
            reference: payment.reference,
            transactionId: payment.transactionId,
            provider: payment.provider,
            paidAt: payment.paidAt || new Date(),
            periodStart: payment.periodStart,
            periodEnd: payment.periodEnd
        })
    });
    if (event) await notifySubscription(spot._id, event);
}

/** Email the spot owner about a change in their listing/subscription status. */
export async function notifySubscription(spotId: unknown, event: SubscriptionEvent) {
    const spot = await Spot.findById(spotId).select('name slug owner subscription').lean();
    if (!spot) return false;
    const user = await User.findById(spot.owner).lean();
    if (!user) return false;
    return sendEmail({
        to: user.email,
        ...subscriptionStatusTemplate({
            event,
            name: user.name,
            spotName: spot.name,
            spotSlug: spot.slug,
            plan: (spot.subscription?.plan as PlanKey) || null,
            periodEnd: spot.subscription?.currentPeriodEnd || null
        })
    });
}
