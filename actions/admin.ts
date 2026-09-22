'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { Spot } from '@/models/Spot';
import { User } from '@/models/User';
import { Payment } from '@/models/Payment';
import { isPlanKey, PLANS, PERIOD_DAYS } from '@/lib/plans';
import { flashUrl, randomCode, str } from '@/lib/helpers';
import { activatePayment, reconcilePayment } from '@/lib/subscription';
import { notifySubscription } from '@/lib/notify';
import { sendEmail, mailProvider } from '@/lib/mailer';

const back = (fd: FormData) => (str(fd, 'back').startsWith('/admin') ? str(fd, 'back') : '/admin/spots');

export async function toggleSpotFlagAction(id: string, flag: 'featuredOverride' | 'isPublished', formData: FormData): Promise<void> {
    await requireAdmin();
    await connectDB();
    const spot = await Spot.findById(id);
    if (spot) {
        spot[flag] = !spot[flag];
        await spot.save();
        revalidatePath('/', 'layout');
        if (flag === 'isPublished') await notifySubscription(spot._id, spot.isPublished ? 'restored' : 'hidden');
    }
    redirect(flashUrl(back(formData), 'success', `${spot?.name ?? 'Spot'} updated.`));
}

/** Record an offline payment (bank transfer / cash) and activate a plan. */
export async function activateSpotAction(id: string, formData: FormData): Promise<void> {
    await requireAdmin();
    await connectDB();
    const spot = await Spot.findById(id);
    const plan = isPlanKey(formData.get('plan')) ? (String(formData.get('plan')) as 'basic' | 'sweet') : 'basic';
    if (!spot) redirect('/admin/spots');
    const payment = await Payment.create({
        user: spot!.owner,
        spot: spot!._id,
        plan,
        amount: Number(str(formData, 'amount').replace(/[^\d.]/g, '')) || PLANS[plan].price,
        regularAmount: PLANS[plan].price,
        reference: `DNG-MANUAL-${Date.now()}-${randomCode(4)}`,
        provider: 'manual'
    });
    await activatePayment(payment);
    revalidatePath('/', 'layout');
    redirect(flashUrl(back(formData), 'success', `${spot!.name} activated on ${PLANS[plan].name} for ${PERIOD_DAYS} days.`));
}

export async function toggleUserAction(id: string): Promise<void> {
    await requireAdmin();
    await connectDB();
    const u = await User.findById(id);
    if (u && u.role !== 'admin') {
        u.isActive = !u.isActive;
        await u.save();
    }
    redirect(flashUrl('/admin/users', 'success', u ? `${u.name} ${u.isActive ? 'reactivated' : 'suspended'}.` : 'Updated.'));
}

/** Ask Flutterwave about a pending/failed payment and activate the plan if it was actually paid. */
export async function recheckPaymentAction(id: string): Promise<void> {
    await requireAdmin();
    await connectDB();
    const payment = await Payment.findById(id);
    if (!payment) redirect(flashUrl('/admin/payments', 'error', 'Payment not found.'));
    if (payment.provider !== 'flutterwave') redirect(flashUrl('/admin/payments', 'error', 'Only Flutterwave payments can be re-checked.'));
    const result = await reconcilePayment(payment);
    revalidatePath('/', 'layout');
    const msg: Record<string, [string, 'success' | 'error']> = {
        activated: [`Confirmed with Flutterwave — ${PLANS[payment.plan].name} plan activated.`, 'success'],
        paid: ['Already confirmed.', 'success'],
        pending: ['Flutterwave still shows this payment as pending.', 'error'],
        failed: ['Flutterwave reports this payment as failed.', 'error'],
        'not-found': ['Flutterwave has no completed transaction with this reference.', 'error']
    };
    const [text, kind] = msg[result];
    redirect(flashUrl('/admin/payments', kind, text));
}

/** Send one of the sample emails to the signed-in admin, to check branding and deliverability. */
export async function sendTestEmailAction(formData: FormData): Promise<void> {
    const me = await requireAdmin();
    const { sampleEmails } = await import('@/app/admin/emails/samples');
    const key = str(formData, 'key');
    const e = sampleEmails(me.firstName).find((x) => x.key === key);
    if (!e) redirect('/admin/emails');
    const ok = await sendEmail({ to: me.email, ...e.email, subject: `[Test] ${e.email.subject}` });
    redirect(flashUrl(`/admin/emails?t=${key}`, ok ? 'success' : 'error', ok ? (mailProvider() === 'console' ? 'Printed to the server log (no email provider configured).' : `Test sent to ${me.email}.`) : 'Sending failed — check your email settings and the server log.'));
}
