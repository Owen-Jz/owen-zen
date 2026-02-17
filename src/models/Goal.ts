import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for this goal/idea.'],
    },
    description: {
        type: String,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal',
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'achieved'],
        default: 'pending',
    },
    type: {
        type: String,
        enum: ['goal', 'idea'],
        default: 'goal',
    },
    year: {
        type: Number,
        default: 2026,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    order: {
        type: Number,
        default: 0
    }
});

// Virtual for children to make population easier if needed, though we might just fetch all and build tree in client
GoalSchema.virtual('children', {
    ref: 'Goal',
    localField: '_id',
    foreignField: 'parentId',
});

export default mongoose.models.Goal || mongoose.model('Goal', GoalSchema);
