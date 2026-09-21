import mongoose, { Schema, type Model, type Types } from 'mongoose';

export const TABLE_STATUSES = ['available', 'reserved', 'occupied', 'out_of_service'] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

export interface ITable {
    _id: Types.ObjectId;
    spot: Types.ObjectId;
    label: string;
    seats: number;
    area: string;
    status: TableStatus;
    active: boolean;
}

const tableSchema = new Schema<ITable>(
    {
        spot: { type: Schema.Types.ObjectId, ref: 'Spot', required: true, index: true },
        label: { type: String, required: true, trim: true },
        seats: { type: Number, min: 1, max: 50, default: 4 },
        area: { type: String, trim: true, default: 'Indoor' },
        status: { type: String, enum: TABLE_STATUSES, default: 'available' },
        active: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export const Table = (mongoose.models.Table as Model<ITable>) || mongoose.model<ITable>('Table', tableSchema);
