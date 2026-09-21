import mongoose, { Schema, type Model, type Types } from 'mongoose';

export const RESERVATION_STATUSES = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface IReservation {
    _id: Types.ObjectId;
    spot: Types.ObjectId;
    table?: Types.ObjectId | null;
    code: string;
    name: string;
    phone: string;
    email?: string;
    partySize: number;
    date: string; // YYYY-MM-DD (Lagos time)
    time: string; // HH:mm
    seating?: string;
    occasion?: string;
    notes?: string;
    status: ReservationStatus;
    createdAt: Date;
}

const reservationSchema = new Schema<IReservation>(
    {
        spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true, index: true },
        table: { type: Schema.Types.ObjectId, ref: 'Table' },
        code: { type: String, required: true, unique: true },
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        partySize: { type: Number, required: true, min: 1 },
        date: { type: String, required: true },
        time: { type: String, required: true },
        seating: { type: String, trim: true },
        occasion: { type: String, trim: true },
        notes: { type: String, trim: true, maxlength: 500 },
        status: { type: String, enum: RESERVATION_STATUSES, default: 'pending' }
    },
    { timestamps: true }
);

export const Reservation =
    (mongoose.models.Reservation as Model<IReservation>) || mongoose.model<IReservation>('Reservation', reservationSchema);
