import mongoose from 'mongoose';

const PromptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: 100,
    trim: true,
  },
  prompt: {
    type: String,
    required: [true, 'Prompt text is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Writing', 'Coding', 'Brainstorming', 'Personal', 'Other'],
    default: 'Other',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Prompt || mongoose.model('Prompt', PromptSchema);
