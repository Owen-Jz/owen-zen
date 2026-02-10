import mongoose from 'mongoose';

const BoardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for this board.'],
        maxlength: [60, 'Title cannot be more than 60 characters'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Board || mongoose.model('Board', BoardSchema);
