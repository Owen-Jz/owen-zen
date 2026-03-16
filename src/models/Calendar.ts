import mongoose from 'mongoose';

const CalendarSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    default: 'Content Calendar',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Ensure unique calendar per user
CalendarSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.Calendar || mongoose.model('Calendar', CalendarSchema);
