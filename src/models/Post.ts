import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide content for the post.'],
    maxlength: [500, 'Content cannot be more than 500 characters'], // Increased for LinkedIn/IG
  },
  imageIdea: {
    type: String,
  },
  strategy: {
    type: String,
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
