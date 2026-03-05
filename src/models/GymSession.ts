import mongoose from 'mongoose';

const SetSchema = new mongoose.Schema({
  reps: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
});

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: [SetSchema], default: [] },
});

const GymSessionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  exercises: {
    type: [ExerciseSchema],
    default: [],
  },
  duration: {
    type: Number,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.GymSession || mongoose.model('GymSession', GymSessionSchema);
