import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Canvas from '@/models/Canvas';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const canvas = await Canvas.findOneAndUpdate(
      {},
      {
        $pull: {
          nodes: { id },
          edges: { $or: [{ source: id }, { target: id }] },
        },
      },
      { new: true }
    );
    return NextResponse.json({ success: true, data: canvas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete node' }, { status: 400 });
  }
}
