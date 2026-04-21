import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  description: string;
  platform: 'email' | 'ads' | 'social';
  status: 'planning' | 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  budget: number;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    roi: number;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  platform: { type: String, enum: ['email', 'ads', 'social'], required: true },
  status: { type: String, enum: ['planning', 'active', 'completed', 'paused'], default: 'planning' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  budget: { type: Number, default: 0 },
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
  },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

CampaignSchema.index({ isDeleted: 1 });

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
