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
import { activatePayment } from '@/lib/subscription';

const back = (fd: FormData) => (str(fd, 'back').startsWith('/admin') ? str(fd, 'back') : '/admin/spots');

export async function toggleSpotFlagAction(id: string, flag: 'featuredOverride' | 'isPublished', formData: FormData): Promise<void> {
    await requireAdmin();
    await connectDB();
    const spot = await Spot.findById(id);
    if (spot) {
        spot[flag] = !spot[flag];
        await spot.save();
        revalidatePath('/', 'layout');
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
