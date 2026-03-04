import mongoose from 'mongoose';

const WeeklyGoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this weekly goal.'],
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['goal', 'habit'],
    default: 'goal',
  },
  target: {
    type: Number,
    default: 1, // Number of times it should be completed per week
  },
  completedWeeks: {
    type: [String], // Stores week identifiers like "2026-W10"
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  order: {
    type: Number,
    default: 0,
  }
});

export default mongoose.models.WeeklyGoal || mongoose.model('WeeklyGoal', WeeklyGoalSchema);
