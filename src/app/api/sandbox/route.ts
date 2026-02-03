import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PaperWallet from '@/models/PaperWallet';

const MONGODB_URI = process.env.MONGODB_URI;

export async function GET() {
  if (!MONGODB_URI) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  // Get or Create
  let wallet = await PaperWallet.findOne();
  if (!wallet) {
    wallet = await PaperWallet.create({ balanceUsd: 100000, startBalance: 100000 });
  }

  // Calc live equity
  const openValue = wallet.positions.reduce((acc: number, p: any) => acc + (p.valueUsd || 0), 0);
  const totalEquity = wallet.balanceUsd + openValue;

  return NextResponse.json({ ...wallet.toObject(), totalEquity });
}
