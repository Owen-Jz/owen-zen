import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/googleCalendar";

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { taskId, date, account = 'personal' } = await req.json();

    if (!taskId || !date) {
      return NextResponse.json({ success: false, error: "Missing taskId or date" }, { status: 400 });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // Get the appropriate calendar client
    let calendar;
    try {
      calendar = await getCalendarClient(account).getCalendar();
    } catch (authError: any) {
      console.error("Google Auth Failed:", authError.message);
      return NextResponse.json({
        success: false,
        error: "Google Calendar configuration missing.",
        details: authError.message
      }, { status: 500 });
    }

    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1); // Default 1 hour duration

    const event = {
      summary: `🎯 Focus: ${task.title}`,
      description: `Task Priority: ${task.priority}\n\nScheduled via Owen Zen Dashboard.`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Africa/Lagos',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Africa/Lagos',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
          { method: 'email', minutes: 30 },
        ],
      },
    };

    const calendarId = account === 'work'
      ? (process.env.GOOGLE_WORK_CALENDAR_ID || 'owen@twolions.co')
      : 'owendigitals@gmail.com';

    const res = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    // 2. Update Task with Schedule Info
    task.scheduledDate = startDate;
    task.googleEventId = res.data.id;
    await task.save();

    console.log(`Successfully scheduled task "${task.title}" to Google Calendar (${account})`);

    return NextResponse.json({ success: true, data: task, googleLink: res.data.htmlLink });

  } catch (error: any) {
    console.error("Calendar Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
}