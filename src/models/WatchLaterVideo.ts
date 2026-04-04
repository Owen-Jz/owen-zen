import mongoose from 'mongoose';

const WatchLaterVideoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Please provide a URL for this video.'],
  },
  title: {
    type: String,
    maxlength: [500, 'Title cannot be more than 500 characters'],
  },
  format: {
    type: String,
    enum: ['tutorial', 'entertainment', 'documentary', 'music', 'podcast', 'other'],
    default: 'other',
  },
  topics: {
    type: [String],
    enum: ['technology', 'business', 'communication'],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.WatchLaterVideo || mongoose.model('WatchLaterVideo', WatchLaterVideoSchema);
