import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FoodEntry from '@/models/FoodEntry';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { items, date } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items required' }, { status: 400 });
    }

    // Parse the date - use provided date or today
    let entryDate: Date;
    if (date) {
      // Parse date string as local date (YYYY-MM-DD)
      const [year, month, day] = date.split('-').map(Number);
      entryDate = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid timezone issues
    } else {
      entryDate = new Date();
    }
    entryDate.setHours(0, 0, 0, 0);

    // Find existing entry for the date
    let entry = await FoodEntry.findOne({ date: entryDate });

    if (entry) {
      // Append new items
      entry.items.push(...items);
      entry.totalCalories = null; // Reset analysis
      entry.analyzedAt = null;
      await entry.save();
    } else {
      // Create new entry
      entry = await FoodEntry.create({
        date: entryDate,
        items,
      });
    }

    return NextResponse.json({
      _id: entry._id,
      date: entry.date,
      items: entry.items,
      totalCalories: entry.totalCalories,
      analyzedAt: entry.analyzedAt,
    });
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

    let entryDate: Date;
    if (dateParam) {
      // Parse date string as local date (YYYY-MM-DD)
      const [year, month, day] = dateParam.split('-').map(Number);
      entryDate = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid timezone issues
    } else {
      entryDate = new Date();
    }
    entryDate.setHours(0, 0, 0, 0);

    const entry = await FoodEntry.findOne({ date: entryDate });
    return NextResponse.json(entry || { items: [], totalCalories: null });
  } catch (error) {
    console.error('Food GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}