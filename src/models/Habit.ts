import mongoose from 'mongoose';

const HabitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this habit.'],
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
  completedDates: {
    type: [Date], // Stores dates when the habit was completed (normalized to midnight)
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Habit || mongoose.model('Habit', HabitSchema);
