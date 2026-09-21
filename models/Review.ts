import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface IReview {
    _id: Types.ObjectId;
    spot: Types.ObjectId;
    name: string;
    email?: string;
    rating: number;
    food?: number;
    service?: number;
    ambience?: number;
    comment?: string;
    source: 'web' | 'qr';
    ownerReply?: { text?: string; repliedAt?: Date };
    status: 'published' | 'hidden';
    createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 60 },
        email: { type: String, trim: true, lowercase: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        food: { type: Number, min: 1, max: 5 },
        service: { type: Number, min: 1, max: 5 },
        ambience: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true, maxlength: 1500 },
        source: { type: String, enum: ['web', 'qr'], default: 'web' },
        ownerReply: { text: String, repliedAt: Date },
        status: { type: String, enum: ['published', 'hidden'], default: 'published' }
    },
    { timestamps: true }
);

export const Review = (mongoose.models.Review as Model<IReview>) || mongoose.model<IReview>('Review', reviewSchema);

/** Recompute a spot's average rating from its published reviews. */
export async function refreshSpotRating(spotId: Types.ObjectId | string) {
    const { Spot } = await import('./Spot');
    const reviews = await Review.find({ spot: spotId, status: 'published' }).select('rating').lean();
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    await Spot.updateOne({ _id: spotId }, { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count });
}
