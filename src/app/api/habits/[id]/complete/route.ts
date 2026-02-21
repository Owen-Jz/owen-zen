import dbConnect from "@/lib/db";
import Habit from "@/models/Habit";
import { NextResponse } from "next/server";

/**
 * GET /api/habits/[id]/complete?token=SECRET
 *
 * One-tap habit completion endpoint — designed to be called from a Telegram
 * inline URL button. Marks the habit as completed for today, then returns an
 * HTML page so the user sees a success message in their browser.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  // Token guard — matches HABIT_COMPLETE_TOKEN env var, or fallback default
  const validToken = process.env.HABIT_COMPLETE_TOKEN || "2f0b3176-54b5-4a27-bd45-6191c59b31d7";
  if (token !== validToken) {
    return new NextResponse(
      html("⛔ Unauthorized", "Invalid or missing token.", "#ef4444"),
      { status: 401, headers: { "Content-Type": "text/html" } }
    );
  }

  await dbConnect();

  try {
    const habit = await Habit.findById(id);
    if (!habit) {
      return new NextResponse(
        html("❌ Not Found", "Habit not found.", "#ef4444"),
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    const toDateString = (d: Date) => d.toISOString().split("T")[0];
    const todayStr = toDateString(new Date());

    const alreadyDone = habit.completedDates.some(
      (d: Date) => toDateString(new Date(d)) === todayStr
    );

    if (alreadyDone) {
      return new NextResponse(
        html(
          "✅ Already Done!",
          `<strong>${habit.title}</strong> was already marked complete for today.<br/>Streak: 🔥 ${habit.streak} days`,
          "#10b981"
        ),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    // Add today's completion
    const newDates = [...habit.completedDates, new Date()];
    newDates.sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());

    // Recalculate streak
    let streak = 0;
    if (newDates.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const latest = new Date(newDates[0]);
      const diffDays = Math.floor(
        (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 1) {
        streak = 1;
        for (let i = 0; i < newDates.length - 1; i++) {
          const curr = new Date(newDates[i]);
          const prev = new Date(newDates[i + 1]);
          const dayDiff = Math.floor(
            (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (dayDiff === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    await Habit.findByIdAndUpdate(id, {
      completedDates: newDates,
      streak,
    });

    return new NextResponse(
      html(
        "✅ Done!",
        `<strong>${habit.title}</strong> marked complete for today.<br/>Streak: 🔥 ${streak} day${streak !== 1 ? "s" : ""}`,
        "#10b981"
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Habit complete error:", error);
    return new NextResponse(
      html("❌ Error", "Something went wrong. Try again.", "#ef4444"),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

function html(title: string, body: string, color: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 380px;
      width: 100%;
      text-align: center;
    }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 700; color: ${color}; margin-bottom: 12px; }
    p { font-size: 16px; color: #aaa; line-height: 1.6; }
    p strong { color: #fff; }
    .back {
      display: inline-block;
      margin-top: 28px;
      padding: 12px 24px;
      background: ${color};
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${title.split(" ")[0]}</div>
    <h1>${title.replace(/^[^\s]+\s/, "")}</h1>
    <p>${body}</p>
    <a class="back" href="javascript:window.close()">Close</a>
  </div>
</body>
</html>`;
}
