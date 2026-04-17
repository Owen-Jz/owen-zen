// src/models/Journal.ts
import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required'],
  },
  slot: {
    type: String,
    enum: ['morning', 'evening'],
    default: 'evening',
  },
  text: {
    type: String,
    default: '',
  },
  mood: {
    type: Number,
    default: 3,
    min: 1,
    max: 5,
  },
  tags: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Compound unique index: one entry per date+slot combination
JournalSchema.index({ date: 1, slot: 1 }, { unique: true });

export default mongoose.models.Journal || mongoose.model('Journal', JournalSchema);
