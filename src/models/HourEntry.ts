import mongoose from 'mongoose';

const HourEntrySchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required.'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'],
    index: true,
  },
  hour: {
    type: Number,
    required: [true, 'Hour is required.'],
    min: [0, 'Hour must be between 0 and 23.'],
    max: [23, 'Hour must be between 0 and 23.'],
  },
  text: {
    type: String,
    default: '',
    maxlength: [500, 'Entry cannot be more than 500 characters.'],
  },
  type: {
    type: String,
    enum: ['deep-work', 'routine', 'meetings', 'breaks', 'distracted', 'default'],
    default: 'default',
  },
  isPlanned: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Unique constraint: one entry per date+hour
HourEntrySchema.index({ date: 1, hour: 1 }, { unique: true });

export default mongoose.models.HourEntry || mongoose.model('HourEntry', HourEntrySchema);