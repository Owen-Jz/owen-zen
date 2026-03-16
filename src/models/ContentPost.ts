import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaUrl {
  url: string;
  type: 'image' | 'video';
  mimeType?: string;
}

export interface IContentPost extends Document {
  calendarId: mongoose.Types.ObjectId;
  userId: string;
  network: 'instagram' | 'twitter' | 'linkedin';
  caption: string;
  mediaUrls: IMediaUrl[];
  notes: string;
  scheduledAt: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaUrlSchema = new Schema<IMediaUrl>({
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  mimeType: String,
}, { _id: false });

const ContentPostSchema = new Schema<IContentPost>({
  calendarId: {
    type: Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  network: {
    type: String,
    enum: ['instagram', 'twitter', 'linkedin'],
    required: true,
  },
  caption: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  mediaUrls: {
    type: [MediaUrlSchema],
    default: [],
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: '',
  },
  scheduledAt: {
    type: Date,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft',
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
ContentPostSchema.index({ userId: 1, scheduledAt: 1, isDeleted: 1 });
ContentPostSchema.index({ calendarId: 1, isDeleted: 1 });

// Virtual for character limit based on network
ContentPostSchema.virtual('characterLimit').get(function() {
  switch (this.network) {
    case 'twitter':
      return 2200;
    case 'instagram':
    case 'linkedin':
    default:
      return 10000;
  }
});

// Ensure virtuals are included in JSON
ContentPostSchema.set('toJSON', { virtuals: true });
ContentPostSchema.set('toObject', { virtuals: true });

export default mongoose.models.ContentPost || mongoose.model('ContentPost', ContentPostSchema);
