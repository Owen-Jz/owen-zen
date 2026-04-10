import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Canvas from '@/models/Canvas';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { position, content, description, subNodes } = await req.json();
    const newNode = {
      id: randomUUID(),
      type: 'idea',
      position: position || { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        content: content || '',
        description: description || '',
        color: '#f97316',
        labels: [],
        subNodes: subNodes || [],
      },
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
