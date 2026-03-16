import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'Please provide a user ID.'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title for this note.'],
    maxlength: [200, 'Title cannot be more than 200 characters'],
    default: 'Untitled Note',
  },
  content: {
    type: String,
    default: '',
    maxlength: [5000, 'Content cannot be more than 5000 characters'],
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
NoteSchema.pre('save', function(this: any) {
  this.updatedAt = new Date();
});

// Create indexes for optimized queries
NoteSchema.index({ userId: 1, createdAt: -1 });
NoteSchema.index({ userId: 1, isPinned: -1 });
NoteSchema.index({ userId: 1, isArchived: 1 });

export interface INote extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);