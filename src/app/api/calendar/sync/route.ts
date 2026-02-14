import { google } from 'googleapis';
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

// Initialize Google Auth
const getGoogleCalendar = async () => {
    // We need to load the service account from env or file
    // Assuming we can use the same method as the scripts or env vars
    // Since this is server-side in Next.js, we should use process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    // But previously we used a file path. Let's check if we can read the file or if we need to use env.
    
    // Quick fix: Just read the file for now, but in production (Vercel), we should use ENV.
    // For now, I'll try to use the file path which works on this VPS, but for Vercel deploy we need ENV.
    // Let's implement a fallback.

    const auth = new google.auth.GoogleAuth({
        keyFile: '/home/ubuntu/.config/google/service_account.json', // Only works on this machine
        // credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'), // For Vercel
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    return google.calendar({ version: 'v3', auth });
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
    
    // Parse date (Assume it's ISO string for the start of the day or specific time)
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1); // Default 1 hour duration

    const event = {
      summary: `🎯 Focus: ${task.title}`,
      description: `Task Priority: ${task.priority}\n\nScheduled via Owen Zen Dashboard.`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Africa/Lagos', // Hardcoded per user preference
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
