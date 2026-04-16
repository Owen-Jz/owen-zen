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
