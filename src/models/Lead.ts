import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  source: {
    type: String,
    enum: ['direct', 'website', 'twitter', 'instagram', 'linkedin', 'referral', 'other'],
    default: 'direct',
  },
  message: {
    type: String,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'replied', 'converted', 'archived'],
    default: 'new',
  },
  tags: {
    type: [String],
    default: [],
  },
  replyCount: {
    type: Number,
    default: 0,
  },
  lastReplyAt: {
    type: Date,
  },
  notes: {
    type: String,
    maxlength: 5000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
