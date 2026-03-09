import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: 200,
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    default: '',
  },
  source: {
    type: String,
    enum: ['manual', 'ai'],
    default: 'manual',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

NoteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
