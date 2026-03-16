import mongoose from 'mongoose';

const PomodoroStateSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['focus', 'shortBreak', 'longBreak'],
    default: 'focus',
  },
  timeLeft: {
    type: Number,
    default: 25 * 60,
  },
  isRunning: {
    type: Boolean,
    default: false,
  },
  sessions: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PomodoroStateSchema.pre('save', function (this: any) {
  this.updatedAt = new Date();
});

export default mongoose.models.PomodoroState || mongoose.model('PomodoroState', PomodoroStateSchema);
