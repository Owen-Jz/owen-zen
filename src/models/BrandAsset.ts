import mongoose, { Schema, Document } from 'mongoose';

export interface IBrandAsset extends Document {
  name: string;
  type: 'guidelines' | 'logo' | 'template' | 'swipe';
  url: string;
  notes: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandAssetSchema = new Schema<IBrandAsset>({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['guidelines', 'logo', 'template', 'swipe'], required: true },
  url: { type: String, required: true },
  notes: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false, index: true },
}, { timestamps: true });

BrandAssetSchema.index({ isDeleted: 1 });

export default mongoose.models.BrandAsset || mongoose.model('BrandAsset', BrandAssetSchema);
