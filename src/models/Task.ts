import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this task.'],
    maxlength: [500, 'Title cannot be more than 500 characters'],
  },
  description: {
    type: String,
    default: '',
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
  category: {
    type: String,
    enum: ['Work', 'Personal', 'Health', 'Finance', 'Other'],
    default: 'Other',
  },
  order: {
    type: Number,
    default: 0,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: false, // Make it optional for migration, but ideally required
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
    isActive: { type: Boolean, default: false },
    sessionTitle: String,
    accumulatedTime: { type: Number, default: 0 }
  },
  scheduledDate: { type: Date },
  dueDate: { type: Date },
  googleEventId: { type: String },
  isMIT: { type: Boolean, default: false },
  mitDate: { type: Date }, // To track which day it was assigned as MIT
  overdueNotified: { type: Boolean, default: false }, // Track if overdue email has been sent
  completedAt: { type: Date }
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);

