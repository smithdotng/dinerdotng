import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { SPOT_TYPE_KEYS } from '@/lib/spot';

export interface ISpot {
    _id: Types.ObjectId;
    owner: Types.ObjectId;
    name: string;
    slug: string;
    type: string;
    tagline?: string;
    description?: string;
    cuisines: string[];
    priceRange: number;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    instagram?: string;
    hours: { day: string; open: string; close: string; closed: boolean }[];
    coverImage?: string;
    logo?: string;
    gallery: { _id: Types.ObjectId; url: string; caption?: string }[];
    menuCategories: string[];
    ratingAvg: number;
    ratingCount: number;
    views: number;
    menuScans: number;
    subscription: { plan: 'basic' | 'sweet' | null; status: 'inactive' | 'active' | 'expired'; currentPeriodEnd?: Date | null; startedAt?: Date | null; reminderSentFor?: Date | null };
    reservations: { enabled: boolean; openTime: string; closeTime: string; slotMinutes: number; maxPartySize: number; note?: string };
    featuredOverride: boolean;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const spotSchema = new Schema<ISpot>(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        type: { type: String, enum: SPOT_TYPE_KEYS, default: 'restaurant' },
        tagline: { type: String, trim: true, maxlength: 120 },
        description: { type: String, trim: true, maxlength: 2000 },
        cuisines: [{ type: String, trim: true }],
        priceRange: { type: Number, min: 1, max: 4, default: 2 },
        address: { type: String, trim: true },
        area: { type: String, trim: true },
        city: { type: String, trim: true, index: true },
        state: { type: String, trim: true },
        phone: String,
        whatsapp: String,
        email: String,
        website: String,
        instagram: String,
        hours: [{ _id: false, day: String, open: String, close: String, closed: { type: Boolean, default: false } }],
        coverImage: String,
        logo: String,
        gallery: [{ url: String, caption: String }],
        menuCategories: [{ type: String, trim: true }],
        ratingAvg: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        menuScans: { type: Number, default: 0 },
        subscription: {
            plan: { type: String, enum: ['basic', 'sweet', null], default: null },
            status: { type: String, enum: ['inactive', 'active', 'expired'], default: 'inactive' },
            currentPeriodEnd: Date,
            startedAt: Date,
            reminderSentFor: Date
        },
        reservations: {
            enabled: { type: Boolean, default: true },
            openTime: { type: String, default: '11:00' },
            closeTime: { type: String, default: '22:00' },
            slotMinutes: { type: Number, default: 30 },
            maxPartySize: { type: Number, default: 12 },
            note: String
        },
        featuredOverride: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export const Spot = (mongoose.models.Spot as Model<ISpot>) || mongoose.model<ISpot>('Spot', spotSchema);
