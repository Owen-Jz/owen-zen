import dbConnect from "@/lib/db";
import Journal from "@/models/Journal";
import { NextResponse } from "next/server";

function calculateStreaks(entries: { date: string }[]): { current: number; longest: number } {
  if (!entries || entries.length === 0) return { current: 0, longest: 0 };

  const dates = entries.map(e => e.date).sort(); // ascending
  let longest = 1;
  let current = 0;

  // Build set for O(1) lookup
  const dateSet = new Set(dates);

  // Check if streak is alive (ends at today or yesterday)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Count current streak backwards from today
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    let checkDate = dateSet.has(today) ? today : yesterday;
    current = 1;
    let prev = new Date(checkDate);
    while (true) {
      prev = new Date(prev.getTime() - 86400000);
      const prevStr = prev.toISOString().split('T')[0];
      if (dateSet.has(prevStr)) {
        current++;
        checkDate = prevStr;
      } else {
        break;
      }
    }
  }

  // Find longest streak using simple linear pass
  longest = 1;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
    );
    if (diff === 1) {
      streak++;
    } else {
      streak = 1;
    }
    longest = Math.max(longest, streak);
  }

  return { current, longest };
}

export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const search = searchParams.get('search')?.toLowerCase();
    const tag = searchParams.get('tag');
    const slot = searchParams.get('slot'); // "morning" | "evening" | null

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const query: Record<string, any> = { date: { $gte: startDate, $lte: endDate } };
    if (slot === 'morning' || slot === 'evening') {
      query.slot = slot;
    }

    if (tag) {
      query.tags = tag;
    }

    const entries = await Journal.find(query).sort({ date: 1 }).lean();

    let filtered = entries;
    if (search) {
      filtered = entries.filter(e =>
        (e.text ?? '').toLowerCase().includes(search) ||
        e.tags.some((t: string) => t.toLowerCase().includes(search))
      );
    }

    // For streaks, always get ALL entries for the year (all slots) and deduplicate by date
    const allEntriesForYear = await Journal.find({ date: { $gte: startDate, $lte: endDate } }).lean();
    const uniqueDates = [...new Set(allEntriesForYear.map(e => e.date))];
    const streaks = calculateStreaks(uniqueDates.map(d => ({ date: d })));

    return NextResponse.json({
      success: true,
      data: filtered,
      stats: {
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        totalEntries: allEntriesForYear.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const { date, text, mood, tags, slot } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: 'date is required' }, { status: 400 });
    }

    const resolvedSlot = slot === 'morning' || slot === 'evening' ? slot : 'evening';

    const entry = await Journal.findOneAndUpdate(
      { date, slot: resolvedSlot },
      { $set: { text, mood, tags, slot: resolvedSlot } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
