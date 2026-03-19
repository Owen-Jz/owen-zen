import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FoodEntry from '@/models/FoodEntry';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    await FoodEntry.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Food DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}