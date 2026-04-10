import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FoodEntry from '@/models/FoodEntry';

const FETCH_TIMEOUT = 30000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Get date from request body or use today
    let dateFromBody: string | undefined;
    try {
      const body = await request.json();
      dateFromBody = body?.date;
    } catch {
      // Empty or invalid body - use today
    }

    let entryDate: Date;
    if (dateFromBody) {
      const [year, month, day] = dateFromBody.split('-').map(Number);
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
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const itemsList = entry.items.join(', ');

    const prompt = `Analyze the following food items and estimate total calories. Return only the total number, nothing else.

Items: ${itemsList}`;

    let response;
    try {
      response = await fetchWithTimeout('https://api.minimax.io/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.5',
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      });
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.error('Minimax fetch timed out');
        return NextResponse.json({ error: 'AI service request timed out. Please try again.' }, { status: 504 });
      }
      console.error('Minimax fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 500 });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      console.error('Failed to parse Minimax response');
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 });
    }

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      console.error('Minimax API error:', data);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
    }

    const content = data.choices[0].message.content.trim();
    const calories = parseInt(content.replace(/[^0-9]/g, ''), 10);

    if (isNaN(calories)) {
      return NextResponse.json({ error: 'Failed to parse calories from AI response' }, { status: 500 });
    }

    // Update entry
    entry.totalCalories = calories;
    entry.analyzedAt = new Date();
    await entry.save();

    return NextResponse.json({
      _id: entry._id,
      date: entry.date,
      items: entry.items,
      totalCalories: entry.totalCalories,
      analyzedAt: entry.analyzedAt,
    });
  } catch (error) {
    console.error('Food analyze error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}