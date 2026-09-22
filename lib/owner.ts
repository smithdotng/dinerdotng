import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireVerified } from '@/lib/session';
import { Spot } from '@/models/Spot';
import { reconcileSpotPayments } from '@/lib/subscription';

/**
 * For owner dashboard pages & actions: the signed-in user and their (hydrated) spot.
 * With { reconcile: true }, it first re-checks its unconfirmed
 * Flutterwave payments, so a paid plan activates even if the checkout redirect was lost.
 */
export async function requireOwnerSpot(opts: { reconcile?: boolean } = {}) {
    const user = await requireVerified();
    await connectDB();
    let spot = await Spot.findOne({ owner: user.id }).sort({ createdAt: 1 });
    if (!spot) redirect('/onboarding');
    if (opts.reconcile && (await reconcileSpotPayments(spot._id))) {
        spot = (await Spot.findById(spot._id))!;
    }
    return { user, spot };
}
