import mongoose from 'mongoose';

const ShoppingItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    category: {
        type: String,
        default: "General",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.ShoppingItem || mongoose.model('ShoppingItem', ShoppingItemSchema);
