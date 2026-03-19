import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FoodEntry from '@/models/FoodEntry';

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Get date from request body or use today
    const { date } = await request.json().catch(() => ({}));

    let entryDate: Date;
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      entryDate = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      entryDate = new Date();
    }
    entryDate.setHours(0, 0, 0, 0);

    const entry = await FoodEntry.findOne({ date: entryDate });

    if (!entry || entry.items.length === 0) {
      return NextResponse.json({ error: 'No food items to analyze' }, { status: 400 });
    }

    // Call Minimax API
    const apiKey = process.env.MINIMAX_API_KEY;
    const itemsList = entry.items.join(', ');

    const prompt = `Analyze the following food items and estimate total calories. Return only the total number, nothing else.

Items: ${itemsList}`;

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    // Parse calorie number from response
    const calories = parseInt(content.replace(/[^0-9]/g, ''), 10);

    if (isNaN(calories)) {
      return NextResponse.json({ error: 'Failed to parse calories' }, { status: 500 });
    }

    // Update entry
    entry.totalCalories = calories;
    entry.analyzedAt = new Date();
    await entry.save();

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Food analyze error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}