import mongoose from 'mongoose';

const SessionHistorySchema = new mongoose.Schema({
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, default: null },
  duration: { type: Number, default: 0 }, // seconds
}, { _id: false });

const DailyTrackSchema = new mongoose.Schema({
  accumulatedSeconds: { type: Number, default: 0 },
  sessionHistory: { type: [SessionHistorySchema], default: [] },
  deepWorkHabitId: { type: String, default: null },
  lastResetDate: { type: String, default: null }, // "YYYY-MM-DD"
  autoCompleteTriggered: { type: Boolean, default: false },
}, { _id: false });

const PomodoroStateSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['focus', 'shortBreak', 'longBreak'],
    default: 'focus',
  },
  timerMode: {
    type: String,
    enum: ['pomodoro', 'dailyTrack'],
    default: 'pomodoro',
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
  dailyTrack: {
    type: DailyTrackSchema,
    default: () => ({}),
  },
});

PomodoroStateSchema.pre('save', function (this: { updatedAt: Date }) {
  this.updatedAt = new Date();
});

export default mongoose.models.PomodoroState || mongoose.model('PomodoroState', PomodoroStateSchema);
