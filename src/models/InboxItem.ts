import mongoose from 'mongoose';

const InboxItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: 300,
    trim: true,
  },
  url: {
    type: String,
    trim: true,
    default: '',
  },
  entryType: {
    type: String,
    enum: ['Idea', 'Article', 'Video', 'Social Post', 'Location', 'Tool/App'],
    default: 'Idea',
  },
  status: {
    type: String,
    enum: ['New', 'Reviewing', 'Processed', 'Archive'],
    default: 'New',
  },
  source: {
    type: String,
    trim: true,
    default: '',
  },
  quickNotes: {
    type: String,
    maxlength: 2000,
    default: '',
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.InboxItem || mongoose.model('InboxItem', InboxItemSchema);
