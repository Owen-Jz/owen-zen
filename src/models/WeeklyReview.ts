import mongoose from 'mongoose';

const NotableDaySchema = new mongoose.Schema({
    date: { type: String, required: true },
    label: { type: String, required: true },
    notes: { type: String, default: '' },
    highlights: { type: String, default: '' },
}, { _id: false });

const WeeklyReviewSchema = new mongoose.Schema({
    weekKey: {
        type: String,
        required: [true, 'Week key is required'],
        unique: true,
    },
    autoStats: {
        tasksCompleted: { type: Number, default: 0 },
        tasksTotal: { type: Number, default: 0 },
        dailyHabitCompliance: { type: Number, default: 0 },
        weeklyHabitCompliance: { type: Number, default: 0 },
        gymSessions: { type: Number, default: 0 },
        totalWorkoutMinutes: { type: Number, default: 0 },
        expensesTotal: { type: Number, default: 0 },
        incomeTotal: { type: Number, default: 0 },
        netCashflow: { type: Number, default: 0 },
    },
    wins: { type: String, default: '' },
    challenges: { type: String, default: '' },
    lessonsLearned: { type: String, default: '' },
    nextWeekActions: { type: String, default: '' },
    mood: {
        type: String,
        enum: ['great', 'good', 'okay', 'rough', 'terrible'],
        default: null,
    },
    energy: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: null,
    },
    focus: {
        type: String,
        enum: ['sharp', 'moderate', 'scattered'],
        default: null,
    },
    notableDays: [NotableDaySchema],
}, {
    timestamps: true,
});

export default mongoose.models.WeeklyReview || mongoose.model('WeeklyReview', WeeklyReviewSchema);