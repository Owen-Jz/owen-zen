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
    },
    source: {
        type: String,
        required: [true, 'Please provide a source.'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Income: Model<IIncome> =
    mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);

export default Income;
