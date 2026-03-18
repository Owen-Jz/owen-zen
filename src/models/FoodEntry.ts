import mongoose from 'mongoose';

const FoodEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  items: {
    type: [String],
    default: [],
  },
  totalCalories: {
    type: Number,
    default: null,
  },
  analyzedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Normalize date to midnight for consistent querying
FoodEntrySchema.pre('save', function(next) {
  const date = new Date(this.date);
  date.setHours(0, 0, 0, 0);
  this.date = date;
  next();
});

export default mongoose.models.FoodEntry || mongoose.model('FoodEntry', FoodEntrySchema);