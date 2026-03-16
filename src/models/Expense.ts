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
        index: true,
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceCategory',
        required: true,
        index: true,
    },
    date: {
        type: Date,
        default: Date.now,
        index: true,
    },
    note: {
        type: String,
        maxlength: [200, 'Note cannot be more than 200 characters'],
        index: 'text', // For full-text search
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound indexes for optimized queries
ExpenseSchema.index({ date: 1, categoryId: 1 });
ExpenseSchema.index({ date: -1, amount: -1 });
ExpenseSchema.index({ categoryId: 1, amount: 1 });

const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
