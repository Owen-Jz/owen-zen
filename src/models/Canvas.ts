import mongoose from 'mongoose';

const CanvasNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, default: 'idea' },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  data: {
    content: { type: String, default: '' },
    color: { type: String, default: '#f97316' },
    labels: [{ type: String }],
  },
}, { _id: false });

const CanvasEdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  label: { type: String, default: '' },
  animated: { type: Boolean, default: false },
}, { _id: false });

const CanvasSchema = new mongoose.Schema({
  viewport: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 },
  },
  nodes: [CanvasNodeSchema],
  edges: [CanvasEdgeSchema],
}, { timestamps: true });

export default mongoose.models.Canvas || mongoose.model('Canvas', CanvasSchema);