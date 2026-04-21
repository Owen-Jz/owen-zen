import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailCampaign extends Document {
  name: string;
  type: 'newsletter' | 'automated';
  status: 'draft' | 'active' | 'completed';
  subscriberCount: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailCampaignSchema = new Schema<IEmailCampaign>({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['newsletter', 'automated'], required: true },
  status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
  subscriberCount: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  openRate: { type: Number, default: 0 },
  clickRate: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

EmailCampaignSchema.index({ isDeleted: 1 });

export default mongoose.models.EmailCampaign || mongoose.model('EmailCampaign', EmailCampaignSchema);
