import { connectDB } from '@/lib/db';
import { Spot } from '@/models/Spot';
import { notifySubscription } from '@/lib/notify';
import { revalidatePath } from 'next/cache';

// Daily job (see vercel.json "crons"): remind owners before their plan ends and
// mark lapsed plans as expired, emailing them either way.
// Vercel sends "Authorization: Bearer $CRON_SECRET" automatically when CRON_SECRET is set.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REMIND_DAYS = 3;

export async function GET(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });

    await connectDB();
    const now = new Date();
    const soon = new Date(now.getTime() + REMIND_DAYS * 864e5);
    let reminded = 0;
    let expired = 0;

    // 1) Plans ending within REMIND_DAYS that haven't been reminded for this period yet.
    const ending = await Spot.find({ 'subscription.status': 'active', 'subscription.currentPeriodEnd': { $gt: now, $lte: soon } }).select('subscription').limit(500);
    for (const s of ending) {
        const end = s.subscription.currentPeriodEnd!;
        if (s.subscription.reminderSentFor && new Date(s.subscription.reminderSentFor).getTime() === end.getTime()) continue;
        const claimed = await Spot.updateOne({ _id: s._id, 'subscription.currentPeriodEnd': end, 'subscription.reminderSentFor': { $ne: end } }, { 'subscription.reminderSentFor': end });
        if (claimed.modifiedCount && (await notifySubscription(s._id, 'expiring'))) reminded++;
    }

    // 2) Plans whose period has ended: flip to expired (claimed atomically so nobody gets two emails).
    const lapsed = await Spot.find({ 'subscription.status': 'active', 'subscription.currentPeriodEnd': { $lte: now } }).select('_id').limit(500);
    for (const s of lapsed) {
        const claimed = await Spot.updateOne({ _id: s._id, 'subscription.status': 'active', 'subscription.currentPeriodEnd': { $lte: now } }, { 'subscription.status': 'expired' });
        if (claimed.modifiedCount) {
            expired++;
            await notifySubscription(s._id, 'expired');
        }
    }
    if (expired) revalidatePath('/', 'layout');
    return Response.json({ ok: true, reminded, expired });
}
