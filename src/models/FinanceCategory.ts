import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFinanceCategory extends Document {
    name: string;
    color: string;
    icon: string;
    type: 'expense' | 'income';
    isSystem: boolean;
}

const FinanceCategorySchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a category name.'],
    },
    color: {
        type: String,
        default: '#6b7280',
    },
    icon: {
        type: String,
        default: '💰',
    },
    type: {
        type: String,
        enum: ['expense', 'income'],
        default: 'expense',
    },
    isSystem: {
        type: Boolean,
        default: false,
    },
});

const FinanceCategory: Model<IFinanceCategory> =
    mongoose.models.FinanceCategory ||
    mongoose.model<IFinanceCategory>('FinanceCategory', FinanceCategorySchema);

export default FinanceCategory;
