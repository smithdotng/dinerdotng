import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { Spot } from '@/models/Spot';

/** For owner dashboard pages & actions: the signed-in user and their (hydrated) spot. */
export async function requireOwnerSpot() {
    const user = await requireAuth();
    await connectDB();
    const spot = await Spot.findOne({ owner: user.id }).sort({ createdAt: 1 });
    if (!spot) redirect('/onboarding');
    return { user, spot };
}
