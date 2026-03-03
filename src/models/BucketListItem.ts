import mongoose from 'mongoose';

const BucketListItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: 300,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Travel', 'Experience', 'Finance', 'Health', 'Career', 'Personal', 'Faith', 'Other'],
    default: 'Personal',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.BucketListItem ||
  mongoose.model('BucketListItem', BucketListItemSchema);
