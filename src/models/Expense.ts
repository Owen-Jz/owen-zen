import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
    amount: number;
    categoryId: mongoose.Types.ObjectId;
    date: Date;
    note?: string;
    createdAt: Date;
}

const ExpenseSchema: Schema = new Schema({
    amount: {
        type: Number,
        required: [true, 'Please provide an amount.'],
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceCategory',
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    note: {
        type: String,
        maxlength: [200, 'Note cannot be more than 200 characters'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
