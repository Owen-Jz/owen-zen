import mongoose from 'mongoose';

const QuickLinkSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Label is required'],
    maxlength: 100,
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
  },
  emoji: {
    type: String,
    default: '🔗',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.QuickLink || mongoose.model('QuickLink', QuickLinkSchema);
