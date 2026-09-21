import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface IMenuItem {
    _id: Types.ObjectId;
    spot: Types.ObjectId;
    category: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    tags: string[];
    available: boolean;
    order: number;
    createdAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
    {
        spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true, index: true },
        category: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true, maxlength: 400 },
        price: { type: Number, required: true, min: 0 },
        image: String,
        tags: [{ type: String, enum: ['chef', 'spicy', 'vegetarian', 'new', 'popular'] }],
        available: { type: Boolean, default: true },
        order: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export const MenuItem = (mongoose.models.MenuItem as Model<IMenuItem>) || mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
