import mongoose, { Schema, type Model, type Types } from 'mongoose';

export const POST_TYPES = {
    article: { label: 'Article', plural: 'Articles', icon: 'fa-newspaper' },
    review: { label: 'Review', plural: 'Reviews', icon: 'fa-star' },
    promo: { label: 'Promotion', plural: 'Promotions', icon: 'fa-tags' }
} as const;
export type PostType = keyof typeof POST_TYPES;
export const POST_TYPE_KEYS = Object.keys(POST_TYPES) as PostType[];
export const isPostType = (v: unknown): v is PostType => typeof v === 'string' && v in POST_TYPES;

export interface IPost {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    type: PostType;
    excerpt?: string;
    content: string; // Markdown
    coverImage?: string;
    tags: string[];
    spot?: Types.ObjectId | null; // spot featured in a review / promotion
    author?: Types.ObjectId;
    authorName?: string;
    status: 'draft' | 'published';
    featured: boolean;
    publishedAt?: Date | null;
    // Review fields
    rating?: number;
    verdict?: string;
    // Promotion fields
    promoCode?: string;
    validUntil?: Date | null;
    ctaLabel?: string;
    ctaUrl?: string;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPost>(
    {
        title: { type: String, required: true, trim: true, maxlength: 160 },
        slug: { type: String, required: true, unique: true, lowercase: true },
        type: { type: String, enum: Object.keys(POST_TYPES), default: 'article', index: true },
        excerpt: { type: String, trim: true, maxlength: 300 },
        content: { type: String, default: '' },
        coverImage: String,
        tags: [{ type: String, trim: true, lowercase: true }],
        spot: { type: Schema.Types.ObjectId, ref: 'Spot', index: true },
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        authorName: String,
        status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
        featured: { type: Boolean, default: false },
        publishedAt: Date,
        rating: { type: Number, min: 1, max: 5 },
        verdict: { type: String, trim: true, maxlength: 200 },
        promoCode: { type: String, trim: true, maxlength: 40 },
        validUntil: Date,
        ctaLabel: { type: String, trim: true, maxlength: 40 },
        ctaUrl: { type: String, trim: true },
        views: { type: Number, default: 0 }
    },
    { timestamps: true }
);

postSchema.index({ status: 1, publishedAt: -1 });

export const Post = (mongoose.models.Post as Model<IPost>) || mongoose.model<IPost>('Post', postSchema);

/** Posts the public may read: published and not scheduled in the future. */
export const publishedFilter = () => ({ status: 'published', publishedAt: { $lte: new Date() } });
