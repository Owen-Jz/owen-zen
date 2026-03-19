import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/owen-zen';

async function connectToDatabase() {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(MONGODB_URI);
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const Prompt = (await import('@/models/Prompt')).default;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query: Record<string, unknown> = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { prompt: { $regex: search, $options: 'i' } },
      ];
    }

    const prompts = await Prompt.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const Prompt = (await import('@/models/Prompt')).default;

    const body = await request.json();
    const { title, prompt, category } = body;

    if (!title || !prompt || !category) {
      return NextResponse.json({ success: false, error: 'Title, prompt, and category are required' }, { status: 400 });
    }

    const newPrompt = await Prompt.create({ title, prompt, category });
    return NextResponse.json({ success: true, data: newPrompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ success: false, error: 'Failed to create prompt' }, { status: 500 });
  }
}
