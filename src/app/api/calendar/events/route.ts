import { NextResponse } from "next/server";
import { GoogleCalendarService } from "@/lib/googleCalendar";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const account = (searchParams.get('account') as 'personal' | 'work') || 'personal';

  if (account !== 'personal' && account !== 'work') {
    return NextResponse.json(
      { success: false, error: 'Invalid account. Use "personal" or "work".' },
      { status: 400 }
    );
  }

  try {
    const service = GoogleCalendarService.getInstance();
    const result = await service.getUpcomingEventsForAccount(account, 10);

    return NextResponse.json({
      success: true,
      data: {
        events: result.events,
        lastSync: new Date().toISOString(),
        isIncremental: result.isIncremental,
        account,
      },
    });
  } catch (error: any) {
    console.error(`Failed to fetch calendar events (${account}):`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const account = (searchParams.get('account') as 'personal' | 'work') || 'personal';

  if (account !== 'personal' && account !== 'work') {
    return NextResponse.json(
      { success: false, error: 'Invalid account. Use "personal" or "work".' },
      { status: 400 }
    );
  }

  try {
    const { title, description, start, end, location } = await req.json();

    if (!title || !start || !end) {
      return NextResponse.json(
        { success: false, error: 'Missing title, start, or end' },
        { status: 400 }
      );
    }

    const service = GoogleCalendarService.getInstance();
    const result = await service.createEventOnAccount(account, {
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      location,
    });

    return NextResponse.json({ success: true, data: result, account });
  } catch (error: any) {
    console.error(`Failed to create calendar event (${account}):`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}