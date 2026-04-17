import mongoose from 'mongoose';

const RoutineItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this item.'],
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  completedDates: {
    type: [Date],
    default: [],
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    default: null,
  },
});

const RoutineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this routine.'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  icon: {
    type: String,
    default: '✨',
  },
  color: {
    type: String,
    default: '#6366f1',
  },
  items: {
    type: [RoutineItemSchema],
    default: [],
  },
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Routine || mongoose.model('Routine', RoutineSchema);
