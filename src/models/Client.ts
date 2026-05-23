import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: () => Date.now(),
  },
  summary: {
    type: String,
  },
  followUps: {
    type: [String],
    default: [],
  },
  nextSteps: {
    type: String,
  },
}, { _id: false });

const CommunicationPrefsSchema = new mongoose.Schema({
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'slack', 'video', 'other'],
  },
  bestTimeToContact: {
    type: String,
  },
  timezone: {
    type: String,
  },
  communicationStyle: {
    type: String,
  },
}, { _id: false });

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: 100,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 200,
  },
  phone: {
    type: String,
    maxlength: 50,
  },
  company: {
    type: String,
    maxlength: 200,
  },
  role: {
    type: String,
    maxlength: 100,
  },
  communicationPrefs: {
    type: CommunicationPrefsSchema,
  },
  personalNotes: {
    type: String,
    maxlength: 5000,
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  }],
  sessions: {
    type: [SessionSchema],
    default: [],
  },
  tags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'dormant', 'needs-followup'],
    default: 'active',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);