'use server';

import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { Spot } from '@/models/Spot';
import { Review, refreshSpotRating } from '@/models/Review';
import { Reservation } from '@/models/Reservation';
import { canTakeReservations, isLive } from '@/lib/spot';
import { flashUrl, int, randomCode, str } from '@/lib/helpers';
import { todayISO } from '@/lib/format';
import { enforceRateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';

async function visibleSpot(slug: string) {
    await connectDB();
    const spot = await Spot.findOne({ slug }).lean();
    if (!spot) return null;
    if (isLive(spot)) return spot;
    const u = await getCurrentUser();
    return u && (u.role === 'admin' || String(spot.owner) === u.id) ? spot : null;
}

const rating = (v: FormDataEntryValue | null) => {
    const n = parseInt(String(v ?? ''), 10);
    return n >= 1 && n <= 5 ? n : undefined;
};

export async function submitReviewAction(slug: string, formData: FormData): Promise<void> {
    const spot = await visibleSpot(slug);
    if (!spot) redirect('/explore');
    const fromMenu = str(formData, 'from') === 'menu';
    const back = fromMenu ? `/m/${slug}#rate` : `/spots/${slug}#reviews`;
    if (str(formData, 'website')) redirect(back); // honeypot for bots
    if (!(await enforceRateLimit('review', 10))) redirect(flashUrl(back, 'error', RATE_LIMIT_MESSAGE));

    const name = str(formData, 'name').slice(0, 60);
    const overall = rating(formData.get('rating'));
    if (!name || !overall) redirect(flashUrl(back, 'error', 'Please add your name and a star rating.'));

    await Review.create({
        spot: spot!._id,
        name,
        email: str(formData, 'email') || undefined,
        rating: overall,
        food: rating(formData.get('food')),
        service: rating(formData.get('service')),
        ambience: rating(formData.get('ambience')),
        comment: str(formData, 'comment').slice(0, 1500),
        source: fromMenu ? 'qr' : 'web'
    });
    await refreshSpotRating(spot!._id);
    redirect(flashUrl(back, 'success', `Thanks ${name.split(' ')[0]}! Your feedback helps ${spot!.name} serve you better.`));
}

export async function reserveTableAction(slug: string, formData: FormData): Promise<void> {
    const spot = await visibleSpot(slug);
    if (!spot) redirect('/explore');
    const back = `/spots/${slug}#book`;
    if (!canTakeReservations(spot!)) redirect(flashUrl(back, 'error', `${spot!.name} isn't taking online reservations right now. Please call them directly.`));
    if (!(await enforceRateLimit('reserve', 10))) redirect(flashUrl(back, 'error', RATE_LIMIT_MESSAGE));

    const name = str(formData, 'name');
    const phone = str(formData, 'phone');
    const date = str(formData, 'date');
    const time = str(formData, 'time');
    const partySize = int(formData, 'partySize');
    if (!name || !phone || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !partySize) {
        redirect(flashUrl(back, 'error', 'Please add your name, phone number, date, time and number of guests.'));
    }
    if (date < todayISO()) redirect(flashUrl(back, 'error', 'Please pick a date from today onwards.'));
    const max = spot!.reservations?.maxPartySize || 12;
    if (partySize < 1 || partySize > max) redirect(flashUrl(back, 'error', `For groups larger than ${max}, please call ${spot!.name} directly.`));

    let code = randomCode(6);
    // eslint-disable-next-line no-await-in-loop
    while (await Reservation.exists({ code })) code = randomCode(6);
    await Reservation.create({
        spot: spot!._id,
        code,
        name,
        phone,
        email: str(formData, 'email') || undefined,
        date,
        time,
        partySize,
        seating: str(formData, 'seating'),
        occasion: str(formData, 'occasion'),
        notes: str(formData, 'notes').slice(0, 500)
    });
    redirect(`/reservations/${code}`);
}

export async function cancelReservationAction(code: string, formData: FormData): Promise<void> {
    await connectDB();
    const r = await Reservation.findOne({ code: code.toUpperCase() });
    if (!r) redirect('/');
    const last6 = (s: string) => s.replace(/\D/g, '').slice(-6);
    if (['pending', 'confirmed'].includes(r!.status) && last6(str(formData, 'phone')) === last6(r!.phone)) {
        r!.status = 'cancelled';
        await r!.save();
        redirect(flashUrl(`/reservations/${r!.code}`, 'success', 'Your reservation has been cancelled.'));
    }
    redirect(flashUrl(`/reservations/${r!.code}`, 'error', 'We could not cancel this reservation. Check the phone number you booked with.'));
}
