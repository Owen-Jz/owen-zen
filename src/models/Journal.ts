// src/models/Journal.ts
import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required'],
    unique: true, // one entry per day
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

export default mongoose.models.Journal || mongoose.model('Journal', JournalSchema);
