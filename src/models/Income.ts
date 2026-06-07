import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIncome extends Document {
    amount: number;
    source: string;
    date: Date;
    createdAt: Date;
}

const IncomeSchema: Schema = new Schema({
    amount: {
        type: Number,
        required: [true, 'Please provide an amount.'],
        min: [0, 'Amount cannot be negative'],
        // Round to 2 decimals (cents) on write to prevent float drift accumulating in totals.
        set: (v: number) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v),
        index: true,
    },
    source: {
        type: String,
        required: [true, 'Please provide a source.'],
        index: 'text', // For full-text search
    },
    date: {
        type: Date,
        default: Date.now,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound indexes for optimized queries
IncomeSchema.index({ date: 1, amount: -1 });
IncomeSchema.index({ source: 1, date: -1 });

const Income: Model<IIncome> =
    mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);

export default Income;
