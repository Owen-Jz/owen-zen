import mongoose from 'mongoose';

const CostHistorySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
}, { _id: false });

const SubscriptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a subscription name.'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, 'Please provide a subscription amount.'],
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly', 'quarterly'],
        default: 'monthly',
    },
    category: {
        type: String,
        enum: ['entertainment', 'software', 'health', 'finance', 'utilities', 'other'],
        default: 'other',
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date.'],
    },
    nextBillingDate: {
        type: Date,
        required: [true, 'Please provide the next billing date.'],
    },
    website: {
        type: String,
        trim: true,
    },
    color: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    costHistory: [CostHistorySchema],
}, {
    timestamps: true,
});

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);