import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    default: 'default',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '🏆',
  },
  domain: {
    type: String,
    enum: ['habits', 'tasks', 'gym', 'finance', 'leads', 'social', 'weekly', 'content', 'system'],
    default: 'system',
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
