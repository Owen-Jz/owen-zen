import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Canvas from '@/models/Canvas';

export async function GET() {
  await dbConnect();
  try {
    let canvas = await Canvas.findOne({});
    if (!canvas) {
      canvas = await Canvas.create({
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [],
        edges: [],
      });
    }
    return NextResponse.json({ success: true, data: canvas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch canvas' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  await dbConnect();
  try {
    const { viewport, nodes, edges } = await req.json();
    const canvas = await Canvas.findOneAndUpdate(
      {},
      { viewport, nodes, edges },
      { new: true, upsert: true, runValidators: true }
    );
    return NextResponse.json({ success: true, data: canvas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save canvas' }, { status: 400 });
  }
}
