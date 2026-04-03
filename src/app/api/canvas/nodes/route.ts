import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Canvas from '@/models/Canvas';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { position, content } = await req.json();
    const newNode = {
      id: randomUUID(),
      type: 'idea',
      position,
      data: { content: content || '', color: '#f97316', labels: [] },
    };
    const canvas = await Canvas.findOneAndUpdate(
      {},
      { $push: { nodes: newNode } },
      { new: true, upsert: true }
    );
    return NextResponse.json({ success: true, data: newNode }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create node' }, { status: 400 });
  }
}
