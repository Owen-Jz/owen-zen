import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide content for the post.'],
    maxlength: [280, 'Content cannot be more than 280 characters for Twitter compatibility'],
  },
  platforms: {
    type: [String], // ["twitter", "linkedin", "instagram"]
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft',
  },
  scheduledFor: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
