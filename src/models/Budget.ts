import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBudget extends Document {
    categoryId?: mongoose.Types.ObjectId;
    amount: number;
    month: string; // Format "YYYY-MM"
}

const BudgetSchema: Schema = new Schema({
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'FinanceCategory',
        default: null, // Null means global budget
    },
    amount: {
        type: Number,
        required: true,
    },
    month: {
        type: String, // YYYY-MM
        required: true,
    },
});

// Ensure one budget per category per month
BudgetSchema.index({ categoryId: 1, month: 1 }, { unique: true });

const Budget: Model<IBudget> =
    mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);

export default Budget;
