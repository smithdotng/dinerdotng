// Concierge onboarding: create a venue (owner account, spot, menu and plan) from a
// curated JSON file in content/imports. Admins run it from /admin/imports.
// Re-running is safe: the owner and spot are matched by email and slug, details are
// updated, and the menu is replaced with the file's contents.

import crypto from 'node:crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Spot } from '@/models/Spot';
import { MenuItem } from '@/models/MenuItem';
import { Payment } from '@/models/Payment';
import { PERIOD_DAYS, type PlanKey } from '@/lib/plans';
import { randomCode } from '@/lib/helpers';
import savoySummerset from '@/content/imports/savoy-summerset-hotel.json';

type Tag = 'chef' | 'spicy' | 'vegetarian' | 'new' | 'popular';

export interface VenueImport {
    key: string;
    source?: string;
    owner: { name: string; email: string; phone?: string };
    plan?: PlanKey | null;
    /** Amount recorded for the plan (0 = complimentary / paid offline later). */
    planAmount?: number;
    spot: {
        name: string;
        slug: string;
        type: string;
        tagline?: string;
        description?: string;
        cuisines?: string[];
        priceRange?: number;
        address?: string;
        area?: string;
        city?: string;
        state?: string;
        phone?: string;
        whatsapp?: string;
        email?: string;
        website?: string;
        instagram?: string;
        hours?: { day: string; open: string; close: string; closed: boolean }[];
        coverImage?: string;
        logo?: string;
        gallery?: { url: string; caption?: string }[];
        reservations?: { enabled: boolean; openTime: string; closeTime: string; slotMinutes: number; maxPartySize: number; note?: string };
    };
    categories: string[];
    items: { category: string; name: string; description?: string; price: number; tags?: string[]; available?: boolean }[];
}

/** Every curated venue file. Add new ones here after dropping the JSON into content/imports. */
export const VENUE_IMPORTS: VenueImport[] = [savoySummerset as VenueImport];

export const findVenueImport = (key: string) => VENUE_IMPORTS.find((v) => v.key === key) || null;

export interface ImportResult {
    spotName: string;
    slug: string;
    items: number;
    categories: number;
    ownerCreated: boolean;
    /** Only set when a new owner account was created; shown to the admin once. */
    tempPassword?: string;
    planActivated: boolean;
    planEnds?: Date | null;
}

const TAGS: Tag[] = ['chef', 'spicy', 'vegetarian', 'new', 'popular'];

export async function runVenueImport(data: VenueImport): Promise<ImportResult> {
    await connectDB();

    // 1. Owner account (verified, so they can log straight in)
    const email = data.owner.email.trim().toLowerCase();
    let owner = await User.findOne({ email });
    let tempPassword: string | undefined;
    if (!owner) {
        tempPassword = `Dn-${randomCode(4)}-${randomCode(4)}`;
        owner = await User.create({
            name: data.owner.name,
            email,
            phone: data.owner.phone,
            password: tempPassword,
            role: 'owner',
            emailVerified: true,
            emailVerifiedAt: new Date()
        });
    } else if (owner.role === 'admin') {
        throw new Error(`${email} belongs to an admin account. Use a different owner email in the import file.`);
    }

    // 2. Spot details (matched by slug; must belong to this owner)
    const s = data.spot;
    let spot = await Spot.findOne({ slug: s.slug });
    if (spot && String(spot.owner) !== String(owner._id)) {
        throw new Error(`The slug "${s.slug}" is already used by another account's spot.`);
    }
    const details = {
        owner: owner._id,
        name: s.name,
        slug: s.slug,
        type: s.type,
        tagline: s.tagline,
        description: s.description,
        cuisines: s.cuisines || [],
        priceRange: s.priceRange || 2,
        address: s.address,
        area: s.area,
        city: s.city,
        state: s.state,
        phone: s.phone,
        whatsapp: s.whatsapp,
        email: s.email,
        website: s.website,
        instagram: s.instagram,
        hours: s.hours || [],
        coverImage: s.coverImage,
        logo: s.logo,
        gallery: (s.gallery || []).map((g) => ({ url: g.url, caption: g.caption })),
        menuCategories: data.categories,
        ...(s.reservations ? { reservations: s.reservations } : {}),
        isPublished: true
    };
    if (spot) {
        spot.set(details);
        await spot.save();
    } else {
        spot = await Spot.create(details);
    }

    // 3. Menu: replace with the file's items, in file order within each category
    await MenuItem.deleteMany({ spot: spot._id });
    const counters: Record<string, number> = {};
    await MenuItem.insertMany(
        data.items.map((it) => {
            counters[it.category] = (counters[it.category] || 0) + 1;
            return {
                spot: spot!._id,
                category: it.category,
                name: it.name,
                description: it.description || undefined,
                price: it.price,
                tags: (it.tags || []).filter((t): t is Tag => TAGS.includes(t as Tag)),
                available: it.available !== false,
                order: counters[it.category]
            };
        })
    );

    // 4. Plan: activate for one period if it isn't already running on that plan.
    // Done directly (not via activatePayment) so no receipt email goes to the venue.
    let planActivated = false;
    const now = new Date();
    const sub = spot.subscription;
    const running = sub?.status === 'active' && sub.plan === data.plan && sub.currentPeriodEnd && sub.currentPeriodEnd > now;
    if (data.plan && !running) {
        const end = new Date(now.getTime() + PERIOD_DAYS * 24 * 60 * 60 * 1000);
        await Payment.create({
            user: owner._id,
            spot: spot._id,
            plan: data.plan,
            amount: data.planAmount ?? 0,
            regularAmount: data.planAmount ?? 0,
            reference: `DNG-IMPORT-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
            provider: 'manual',
            status: 'success',
            paidAt: now,
            periodStart: now,
            periodEnd: end
        });
        spot.subscription = { plan: data.plan, status: 'active', currentPeriodEnd: end, startedAt: sub?.startedAt || now, reminderSentFor: null };
        await spot.save();
        await User.updateOne({ _id: owner._id }, { hasPaid: true });
        planActivated = true;
    }

    return {
        spotName: spot.name,
        slug: spot.slug,
        items: data.items.length,
        categories: data.categories.length,
        ownerCreated: !!tempPassword,
        tempPassword,
        planActivated,
        planEnds: spot.subscription?.currentPeriodEnd || null
    };
}
