import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this task.'],
    maxlength: [500, 'Title cannot be more than 500 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'pinned'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  order: {
    type: Number,
    default: 0,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  subtasks: {
    type: [{
      title: String,
      completed: { type: Boolean, default: false }
    }],
    default: []
  },
  timeLogs: {
    type: [{
      startedAt: Date,
      endedAt: Date,
      duration: Number, // in seconds
      note: String
    }],
    default: []
  },
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  activeTimer: {
    startedAt: Date,
    isActive: { type: Boolean, default: false }
  }
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
