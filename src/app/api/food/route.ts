import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FoodEntry from '@/models/FoodEntry';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items required' }, { status: 400 });
    }

    // Get today's date normalized to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find existing entry for today
    let entry = await FoodEntry.findOne({ date: today });

    if (entry) {
      // Append new items
      entry.items.push(...items);
      entry.totalCalories = null; // Reset analysis
      entry.analyzedAt = null;
      await entry.save();
    } else {
      // Create new entry
      entry = await FoodEntry.create({
        date: today,
        items,
      });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Food POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let date = new Date();
    if (dateParam) {
      date = new Date(dateParam);
    }
    date.setHours(0, 0, 0, 0);

    const entry = await FoodEntry.findOne({ date });
    return NextResponse.json(entry || { items: [], totalCalories: null });
  } catch (error) {
    console.error('Food GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}