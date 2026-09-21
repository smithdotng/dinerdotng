'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { requireOwnerSpot } from '@/lib/owner';
import { Spot } from '@/models/Spot';
import { User } from '@/models/User';
import { MenuItem } from '@/models/MenuItem';
import { Review, refreshSpotRating } from '@/models/Review';
import { Reservation, RESERVATION_STATUSES, type ReservationStatus } from '@/models/Reservation';
import { Table, TABLE_STATUSES, type TableStatus } from '@/models/Table';
import { Payment } from '@/models/Payment';
import { DAYS, hasSweet, isSpotType, MENU_TAGS } from '@/lib/spot';
import { flashUrl, int, randomCode, str, uniqueSlug } from '@/lib/helpers';
import { isFile, removeImage, saveImage, UploadError } from '@/lib/storage';
import { isPlanKey, PLANS, priceFor } from '@/lib/plans';
import { createPaymentLink, flutterwaveEnabled } from '@/lib/flutterwave';
import { activatePayment } from '@/lib/subscription';
import { appUrl } from '@/lib/appUrl';

const go = (path: string, kind: 'success' | 'error' | 'info', msg: string): never => redirect(flashUrl(path, kind, msg));

async function upload(file: File, back: string): Promise<string> {
    try {
        return await saveImage(file);
    } catch (e) {
        if (e instanceof UploadError) go(back, 'error', e.message);
        throw e;
    }
}

// ---------------- Spot profile ----------------
export async function updateSpotAction(formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const name = str(formData, 'name');
    const city = str(formData, 'city');
    if (!name || !city) go('/dashboard/spot', 'error', 'Name and city are required.');
    if (name !== spot.name) spot.slug = await uniqueSlug(Spot, `${name} ${city}`, String(spot._id));
    Object.assign(spot, {
        name,
        city,
        type: isSpotType(formData.get('type')) ? String(formData.get('type')) : spot.type,
        tagline: str(formData, 'tagline').slice(0, 120),
        description: str(formData, 'description').slice(0, 2000),
        cuisines: str(formData, 'cuisines').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10),
        priceRange: Math.min(4, Math.max(1, int(formData, 'priceRange', 2))),
        address: str(formData, 'address'),
        area: str(formData, 'area'),
        state: str(formData, 'state'),
        phone: str(formData, 'phone'),
        whatsapp: str(formData, 'whatsapp'),
        email: str(formData, 'email'),
        website: str(formData, 'website'),
        instagram: str(formData, 'instagram').replace(/^@/, '')
    });
    const opens = formData.getAll('open').map(String);
    const closes = formData.getAll('close').map(String);
    const closed = formData.getAll('closedDays').map(String);
    spot.hours = DAYS.map((day, i) => ({ day, open: opens[i] || '10:00', close: closes[i] || '22:00', closed: closed.includes(day) }));
    await spot.save();
    revalidatePath('/', 'layout');
    go('/dashboard/spot', 'success', 'Your spot details have been saved.');
}

export async function uploadCoverAction(formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const back = '/dashboard/spot#photos';
    const file = formData.get('image');
    if (!isFile(file)) go(back, 'error', 'Please choose an image.');
    const url = await upload(file as File, back);
    const kind = str(formData, 'kind') === 'logo' ? 'logo' : 'coverImage';
    await removeImage(spot[kind]);
    spot[kind] = url;
    await spot.save();
    go(back, 'success', kind === 'logo' ? 'Logo updated.' : 'Cover photo updated.');
}

export async function addGalleryAction(formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const back = '/dashboard/spot#photos';
    const files = formData.getAll('images').filter(isFile) as File[];
    if (!files.length) go(back, 'error', 'Please choose at least one image.');
    const room = Math.max(0, 24 - spot.gallery.length);
    if (!room) go(back, 'error', 'Your gallery is full (24 photos). Remove some to add more.');
    for (const f of files.slice(0, room)) {
        // eslint-disable-next-line no-await-in-loop
        spot.gallery.push({ url: await upload(f, back) } as never);
    }
    await spot.save();
    go(back, 'success', `${Math.min(files.length, room)} photo(s) added.`);
}

export async function removeGalleryAction(photoId: string): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const photo = spot.gallery.find((g) => String(g._id) === photoId);
    if (photo) {
        await removeImage(photo.url);
        spot.gallery = spot.gallery.filter((g) => String(g._id) !== photoId);
        await spot.save();
    }
    go('/dashboard/spot#photos', 'success', 'Photo removed.');
}

// ---------------- Menu ----------------
const itemFields = (fd: FormData) => ({
    name: str(fd, 'name'),
    category: str(fd, 'category') || 'Mains',
    description: str(fd, 'description').slice(0, 400),
    price: Math.max(0, Number(str(fd, 'price').replace(/[^\d.]/g, '')) || 0),
    tags: fd.getAll('tags').map(String).filter((t) => t in MENU_TAGS)
});

export async function saveMenuItemAction(formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const id = str(formData, 'id');
    const data = itemFields(formData);
    if (!data.name) go('/dashboard/menu', 'error', 'Please give the dish a name.');
    const file = formData.get('image');

    if (!spot.menuCategories.includes(data.category)) {
        spot.menuCategories.push(data.category);
        await spot.save();
    }

    if (id) {
        const item = await MenuItem.findOne({ _id: id, spot: spot._id });
        if (!item) go('/dashboard/menu', 'error', 'That dish no longer exists.');
        Object.assign(item!, data, { available: formData.get('available') === 'on' });
        if (isFile(file)) {
            await removeImage(item!.image);
            item!.image = await upload(file, `/dashboard/menu?edit=${id}`);
        } else if (formData.get('removeImage') === 'on') {
            await removeImage(item!.image);
            item!.image = undefined;
        }
        await item!.save();
        revalidatePath(`/m/${spot.slug}`);
        go(`/dashboard/menu#item-${id}`, 'success', `"${item!.name}" updated.`);
    }

    const image = isFile(file) ? await upload(file, '/dashboard/menu') : str(formData, 'imageUrl') || undefined;
    const order = await MenuItem.countDocuments({ spot: spot._id });
    const created = await MenuItem.create({ ...data, image, spot: spot._id, order, available: true });
    revalidatePath(`/m/${spot.slug}`);
    go(`/dashboard/menu#item-${created._id}`, 'success', `"${data.name}" added to your menu.`);
}

export async function toggleMenuItemAction(id: string): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const item = await MenuItem.findOne({ _id: id, spot: spot._id });
    if (item) {
        item.available = !item.available;
        await item.save();
    }
    redirect(`/dashboard/menu#item-${id}`);
}

export async function deleteMenuItemAction(id: string): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const item = await MenuItem.findOneAndDelete({ _id: id, spot: spot._id });
    if (item) await removeImage(item.image);
    go('/dashboard/menu', 'success', item ? `"${item.name}" removed from your menu.` : 'Dish removed.');
}

export async function categoryAction(formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const op = str(formData, 'op');
    const name = str(formData, 'name');
    const cats = [...spot.menuCategories];
    let msg = '';
    if (op === 'add' && name && !cats.includes(name)) {
        cats.push(name);
        msg = `Category "${name}" added.`;
    } else if (op === 'up' || op === 'down') {
        const i = cats.indexOf(name);
        const j = op === 'up' ? i - 1 : i + 1;
        if (i >= 0 && j >= 0 && j < cats.length) [cats[i], cats[j]] = [cats[j], cats[i]];
    } else if (op === 'rename') {
        const to = str(formData, 'to');
        if (name && to && name !== to) {
            const idx = cats.indexOf(name);
            if (idx >= 0) cats[idx] = to;
            if (!cats.includes(to)) cats.push(to);
            await MenuItem.updateMany({ spot: spot._id, category: name }, { category: to });
            msg = `Renamed "${name}" to "${to}".`;
        }
    } else if (op === 'delete') {
        const used = await MenuItem.countDocuments({ spot: spot._id, category: name });
        if (used) go('/dashboard/menu', 'error', `Move or delete the ${used} item(s) in "${name}" first.`);
        cats.splice(cats.indexOf(name), 1);
        msg = `Category "${name}" removed.`;
    }
    spot.menuCategories = [...new Set(cats)];
    await spot.save();
    if (msg) go('/dashboard/menu', 'success', msg);
    redirect('/dashboard/menu');
}

// ---------------- Reviews ----------------
export async function replyReviewAction(id: string, formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const text = str(formData, 'reply').slice(0, 1000);
    await Review.updateOne({ _id: id, spot: spot._id }, { ownerReply: text ? { text, repliedAt: new Date() } : { text: '' } });
    go(`/dashboard/reviews#r-${id}`, 'success', text ? 'Reply posted.' : 'Reply removed.');
}

export async function toggleReviewAction(id: string): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const r = await Review.findOne({ _id: id, spot: spot._id });
    if (r) {
        r.status = r.status === 'published' ? 'hidden' : 'published';
        await r.save();
        await refreshSpotRating(spot._id);
        go(`/dashboard/reviews#r-${id}`, 'success', r.status === 'hidden' ? 'Review hidden from your public page.' : 'Review is visible again.');
    }
    redirect('/dashboard/reviews');
}

// ---------------- Reservations (Sweet) ----------------
export async function addBookingAction(formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    if (!hasSweet(spot)) go('/dashboard/billing?plan=sweet', 'info', 'Reservations are part of the Sweet plan.');
    const name = str(formData, 'name');
    const phone = str(formData, 'phone');
    const date = str(formData, 'date');
    const time = str(formData, 'time');
    if (!name || !phone || !date || !time) go('/dashboard/reservations', 'error', 'Name, phone, date and time are required.');
    let code = randomCode(6);
    // eslint-disable-next-line no-await-in-loop
    while (await Reservation.exists({ code })) code = randomCode(6);
    await Reservation.create({
        spot: spot._id, code, name, phone, date, time,
        partySize: Math.max(1, int(formData, 'partySize', 2)),
        table: str(formData, 'table') || undefined,
        notes: str(formData, 'notes'),
        status: 'confirmed'
    });
    go(`/dashboard/reservations?date=${date}`, 'success', `Booking for ${name} added.`);
}

export async function updateReservationAction(id: string, formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const back = str(formData, 'back') || '/dashboard/reservations';
    const r = await Reservation.findOne({ _id: id, spot: spot._id });
    if (!r) redirect(back);
    const status = str(formData, 'status') as ReservationStatus;
    if (RESERVATION_STATUSES.includes(status)) r!.status = status;
    if (formData.has('table')) r!.table = (str(formData, 'table') || null) as never;
    await r!.save();
    if (r!.table && ['seated', 'completed', 'cancelled', 'no_show'].includes(r!.status)) {
        await Table.updateOne({ _id: r!.table, spot: spot._id }, { status: r!.status === 'seated' ? 'occupied' : 'available' });
    }
    go(back.startsWith('/dashboard') ? back : '/dashboard/reservations', 'success', `Reservation ${r!.code} updated.`);
}

// ---------------- Tables (Sweet) ----------------
export async function addTablesAction(formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    if (!hasSweet(spot)) go('/dashboard/billing?plan=sweet', 'info', 'Table management is part of the Sweet plan.');
    const label = str(formData, 'label');
    if (!label) go('/dashboard/tables', 'error', 'Give the table a name or number.');
    const qty = Math.min(30, Math.max(1, int(formData, 'qty', 1)));
    const m = label.match(/^(.*?)(\d+)$/);
    const docs = Array.from({ length: qty }, (_, i) => ({
        spot: spot._id,
        label: qty === 1 ? label : m ? `${m[1]}${Number(m[2]) + i}` : `${label} ${i + 1}`,
        seats: Math.max(1, int(formData, 'seats', 4)),
        area: str(formData, 'area') || 'Indoor'
    }));
    await Table.insertMany(docs);
    go('/dashboard/tables', 'success', `${docs.length} table(s) added.`);
}

export async function updateTableAction(id: string, formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const status = str(formData, 'status') as TableStatus;
    if (TABLE_STATUSES.includes(status)) await Table.updateOne({ _id: id, spot: spot._id }, { status });
    redirect('/dashboard/tables');
}

export async function deleteTableAction(id: string): Promise<void> {
    const { spot } = await requireOwnerSpot();
    await Table.deleteOne({ _id: id, spot: spot._id });
    go('/dashboard/tables', 'success', 'Table removed.');
}

// ---------------- Billing ----------------
export async function checkoutAction(formData: FormData): Promise<void> {
    const { user, spot } = await requireOwnerSpot();
    const plan = formData.get('plan');
    if (!isPlanKey(plan)) go('/dashboard/billing', 'error', 'Please choose a plan.');
    const account = await User.findById(user.id);
    const price = priceFor(plan as 'basic' | 'sweet', account);
    const reference = `DNG-${Date.now()}-${randomCode(4)}`;
    const payment = await Payment.create({
        user: user.id,
        spot: spot._id,
        plan,
        amount: price.amount,
        regularAmount: price.regular,
        firstCustomerDiscount: price.firstCustomer,
        reference,
        provider: flutterwaveEnabled() ? 'flutterwave' : 'demo'
    });

    if (!flutterwaveEnabled()) {
        await activatePayment(payment);
        revalidatePath('/', 'layout');
        go('/dashboard', 'success', `${PLANS[plan as 'basic'].name} plan activated (demo mode — no card was charged). Add FLW_SECRET_KEY to take real payments.`);
    }

    let authUrl = '';
    try {
        const base = await appUrl();
        const tx = await createPaymentLink({
            txRef: reference,
            amount: price.amount,
            redirectUrl: `${base}/dashboard/billing/verify`,
            customer: { email: account!.email, name: account!.name, phonenumber: account!.phone },
            title: 'Diner.ng',
            description: `${PLANS[plan as 'basic'].name} plan — ${spot.name}${price.firstCustomer ? ' (first customer discount)' : ''}`,
            logo: `${base}/images/icon-512.png`,
            meta: { spot: String(spot._id), plan: String(plan), firstCustomer: price.firstCustomer }
        });
        authUrl = tx.link;
    } catch (e) {
        payment.status = 'failed';
        await payment.save();
        go('/dashboard/billing', 'error', `We couldn't start the payment: ${(e as Error).message}`);
    }
    redirect(authUrl);
}

// ---------------- Settings ----------------
export async function reservationSettingsAction(formData: FormData): Promise<void> {
    const { spot } = await requireOwnerSpot();
    const slot = int(formData, 'slotMinutes', 30);
    spot.reservations = {
        enabled: formData.get('enabled') === 'on',
        openTime: str(formData, 'openTime') || '11:00',
        closeTime: str(formData, 'closeTime') || '22:00',
        slotMinutes: [15, 30, 60].includes(slot) ? slot : 30,
        maxPartySize: Math.min(50, Math.max(1, int(formData, 'maxPartySize', 12))),
        note: str(formData, 'note')
    };
    await spot.save();
    go('/dashboard/settings', 'success', 'Reservation settings saved.');
}

export async function accountSettingsAction(formData: FormData): Promise<void> {
    const { user } = await requireOwnerSpot();
    await connectDB();
    const account = await User.findById(user.id);
    if (!account) redirect('/login');
    account!.name = str(formData, 'name') || account!.name;
    account!.phone = str(formData, 'phone');
    const newPassword = String(formData.get('newPassword') || '');
    if (newPassword) {
        if (!(await account!.comparePassword(String(formData.get('currentPassword') || '')))) go('/dashboard/settings', 'error', 'Your current password is incorrect.');
        if (newPassword.length < 8) go('/dashboard/settings', 'error', 'New password should be at least 8 characters.');
        account!.password = newPassword;
    }
    await account!.save();
    const { getSession } = await import('@/lib/session');
    const session = await getSession();
    if (session.user) {
        session.user.name = account!.name;
        session.user.firstName = account!.name.split(' ')[0];
        await session.save();
    }
    go('/dashboard/settings', 'success', 'Account updated.');
}
