import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PaperWallet from '@/models/PaperWallet';

export async function GET() {
  await dbConnect();

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
