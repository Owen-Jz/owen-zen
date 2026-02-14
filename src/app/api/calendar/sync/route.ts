import { google } from 'googleapis';
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

// Initialize Google Auth
const getGoogleCalendar = async () => {
    // Priority 1: Use Environment Variable (Production/Vercel)
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
        }
    }

    // Priority 2: Fallback to local file path (Local Dev / VPS)
    // Note: This path will fail on Vercel, so we catch the error gracefully
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: '/home/ubuntu/.config/google/service_account.json', 
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        return google.calendar({ version: 'v3', auth });
    } catch (e) {
        throw new Error("Could not initialize Google Calendar auth. Missing GOOGLE_SERVICE_ACCOUNT_JSON env var or local key file.");
    }
};

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { taskId, date } = await req.json();
    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // 1. Create Google Calendar Event
    const calendar = await getGoogleCalendar();
    const calendarId = 'owendigitals@gmail.com';
    
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

    return NextResponse.json({ success: true, data: task, googleLink: res.data.htmlLink });

  } catch (error) {
    console.error("Calendar Sync Error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
