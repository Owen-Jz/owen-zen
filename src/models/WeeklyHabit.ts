import mongoose from 'mongoose';

const WeeklyHabitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this weekly habit.'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  category: {
    type: String,
    enum: ['health', 'work', 'learning', 'mindset'],
    default: 'work',
  },
  streak: {
    type: Number,
    default: 0,
  },
  completedWeeks: {
    type: [String], // ISO week strings: "YYYY-Www" e.g. "2026-W12"
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.WeeklyHabit || mongoose.model('WeeklyHabit', WeeklyHabitSchema);
