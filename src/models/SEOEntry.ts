import mongoose, { Schema, Document } from 'mongoose';

export interface ISEOEntry extends Document {
  type: 'blog' | 'keyword' | 'backlink';
  title: string;
  url: string;
  status: 'idea' | 'in_progress' | 'published' | 'ranking';
  metrics: {
    ranking?: number;
    traffic?: number;
    backlinks?: number;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SEOEntrySchema = new Schema<ISEOEntry>({
  type: { type: String, enum: ['blog', 'keyword', 'backlink'], required: true },
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  status: { type: String, enum: ['idea', 'in_progress', 'published', 'ranking'], default: 'idea' },
  metrics: {
    ranking: { type: Number },
    traffic: { type: Number },
    backlinks: { type: Number },
  },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

SEOEntrySchema.index({ isDeleted: 1 });

export default mongoose.models.SEOEntry || mongoose.model('SEOEntry', SEOEntrySchema);
