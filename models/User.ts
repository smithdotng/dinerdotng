import mongoose, { Schema, type Model, type HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/lib/session';

export interface IUserFields {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
    hasPaid: boolean; // false => eligible for the first-customer discount
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface IUserMethods {
    comparePassword(plain: string): Promise<boolean>;
}
export type IUser = HydratedDocument<IUserFields, IUserMethods>;

const userSchema = new Schema<IUserFields, Model<IUserFields, object, IUserMethods>, IUserMethods>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['owner', 'admin'], default: 'owner' },
        hasPaid: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        lastLogin: Date
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = function (plain: string) {
    return bcrypt.compare(plain, this.password);
};

export const User =
    (mongoose.models.User as Model<IUserFields, object, IUserMethods>) ||
    mongoose.model<IUserFields, Model<IUserFields, object, IUserMethods>>('User', userSchema);
