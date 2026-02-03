import mongoose from 'mongoose';

const PaperWalletSchema = new mongoose.Schema({
  balanceUsd: { type: Number, default: 100000 },
  startBalance: { type: Number, default: 100000 },
  positions: [{
    id: String,
    token: String,
    entryPrice: Number,
    currentPrice: Number,
    amount: Number,
    valueUsd: Number,
    roi: Number,
    timestamp: Date
  }],
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    maxDrawdown: { type: Number, default: 0 }
  }
});

export default mongoose.models.PaperWallet || mongoose.model('PaperWallet', PaperWalletSchema);
