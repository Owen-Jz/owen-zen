import { google } from 'googleapis';
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";
import path from 'path';

// Initialize Google Auth
const getGoogleCalendar = async () => {
  // Priority 1: Use Environment Variable (Production/Vercel/Local)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      return google.calendar({ version: 'v3', auth });
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON", e);
      throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON format.");
    }
  }

  // Priority 2: Fallback to local file in project root (Cross-platform)
  try {
    const keyFilePath = path.join(process.cwd(), 'service_account.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    return google.calendar({ version: 'v3', auth });
  } catch (e) {
    console.warn("Could not initialize Google Calendar with local file:", e);
    throw new Error("Google Calendar credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON env var or place service_account.json in project root.");
  }
};

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { taskId, date } = await req.json();

    if (!taskId || !date) {
      return NextResponse.json({ success: false, error: "Missing taskId or date" }, { status: 400 });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // 1. Create Google Calendar Event
    let calendar;
    try {
      calendar = await getGoogleCalendar();
    } catch (authError: any) {
      console.error("Google Auth Failed:", authError.message);
      return NextResponse.json({
        success: false,
        error: "Google Calendar configuration missing. Please add GOOGLE_SERVICE_ACCOUNT_JSON to .env.local",
        details: authError.message
      }, { status: 500 });
    }

    const calendarId = 'owendigitals@gmail.com'; // TODO: Make this configurable if needed

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

    const res = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    // 2. Update Task with Schedule Info
    task.scheduledDate = startDate;
    task.googleEventId = res.data.id;
    await task.save();

    console.log(`Successfully scheduled task "${task.title}" to Google Calendar`);

    return NextResponse.json({ success: true, data: task, googleLink: res.data.htmlLink });

  } catch (error: any) {
    console.error("Calendar Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
}
