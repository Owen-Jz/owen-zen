import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/owen-zen';

async function connectToDatabase() {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(MONGODB_URI);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const Prompt = (await import('@/models/Prompt')).default;

    const { id } = await params;
    const body = await request.json();
    const { title, prompt, category } = body;

    const updatedPrompt = await Prompt.findByIdAndUpdate(
      id,
      { title, prompt, category },
      { new: true }
    );

    if (!updatedPrompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedPrompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ success: false, error: 'Failed to update prompt' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const Prompt = (await import('@/models/Prompt')).default;

    const { id } = await params;
    const deletedPrompt = await Prompt.findByIdAndDelete(id);

    if (!deletedPrompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedPrompt });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete prompt' }, { status: 500 });
  }
}