import { NextResponse } from "next/server";
import { GoogleCalendarService } from "@/lib/googleCalendar";

export async function GET() {
  try {
    const service = GoogleCalendarService.getInstance();
    const result = await service.getUpcomingEvents(10);

    return NextResponse.json({
      success: true,
      data: {
        events: result.events,
        lastSync: new Date().toISOString(),
        isIncremental: result.isIncremental,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch calendar events:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, start, end, location } = await req.json();

    if (!title || !start || !end) {
      return NextResponse.json(
        { success: false, error: 'Missing title, start, or end' },
        { status: 400 }
      );
    }

    const service = GoogleCalendarService.getInstance();
    const result = await service.createEvent({
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      location,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
