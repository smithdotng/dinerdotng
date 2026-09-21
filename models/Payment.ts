import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface IPayment {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    spot: Types.ObjectId;
    plan: 'basic' | 'sweet';
    amount: number;
    regularAmount?: number;
    firstCustomerDiscount: boolean;
    reference: string;
    provider: 'flutterwave' | 'demo' | 'manual';
    transactionId?: string;
    status: 'pending' | 'success' | 'failed';
    periodStart?: Date;
    periodEnd?: Date;
    paidAt?: Date;
    checkedAt?: Date;
    createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true, index: true },
        plan: { type: String, enum: ['basic', 'sweet'], required: true },
        amount: { type: Number, required: true },
        regularAmount: Number,
        firstCustomerDiscount: { type: Boolean, default: false },
        reference: { type: String, required: true, unique: true },
        provider: { type: String, enum: ['flutterwave', 'demo', 'manual'], default: 'flutterwave' },
        transactionId: String,
        status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
        periodStart: Date,
        periodEnd: Date,
        paidAt: Date,
        checkedAt: Date
    },
    { timestamps: true }
);

export const Payment = (mongoose.models.Payment as Model<IPayment>) || mongoose.model<IPayment>('Payment', paymentSchema);
