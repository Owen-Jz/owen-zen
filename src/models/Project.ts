import mongoose from 'mongoose';

const DeliverableSchema = new mongoose.Schema({
    title: String,
    completed: { type: Boolean, default: false }
});

const LinkSchema = new mongoose.Schema({
    title: String,
    url: String
});

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    category: {
        type: String,
        enum: ['design', 'development', 'business', 'personal'],
        default: 'development'
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'paused', 'completed'],
        default: 'planning'
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    startDate: String,
    dueDate: String,
    deliverables: [DeliverableSchema],
    notes: [{ type: String }],
    links: [LinkSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
