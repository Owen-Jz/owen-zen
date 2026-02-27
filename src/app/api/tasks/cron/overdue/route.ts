import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(req: Request) {
    // We use GET for cron jobs usually
    try {
        // Check for authorization: Vercel sends `Authorization: Bearer CRON_SECRET`
        // For local testing, we might want a simple secret, or just allow it if no CRON_SECRET is set
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Find tasks that are overdue, not completed, not pinned, and haven't been notified yet
        const now = new Date();
        const overdueTasks = await Task.find({
            dueDate: { $lt: now },
            status: { $nin: ['completed', 'pinned'] },
            overdueNotified: { $ne: true } // Handles both false and undefined
        });

        if (overdueTasks.length === 0) {
            return NextResponse.json({ success: true, message: "No new overdue tasks found" });
        }

        // Prepare email content
        const adminEmail = process.env.ADMIN_EMAIL || "owen@owendigitals.com";
        const taskListHtml = overdueTasks.map(task => `
      <li style="margin-bottom: 12px; padding: 12px; border-left: 4px solid #ef4444; background: #f9fafb;">
        <strong>${task.title}</strong><br/>
        <span style="font-size: 13px; color: #6b7280;">Due: ${new Date(task.dueDate).toLocaleString()}</span>
      </li>
    `).join('');

        // Send email via Resend
        try {
            await resend.emails.send({
                from: "Owen Zen <onboarding@resend.dev>",
                to: adminEmail,
                subject: `⚠️ You have ${overdueTasks.length} overdue task(s)`,
                html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <h2 style="font-size: 20px; color: #dc2626;">We noticed some tasks fell behind...</h2>
            <p style="font-size: 16px; color: #444; margin-bottom: 24px;">
              Hey Owen, just a gentle reminder that the following task(s) have passed their due date:
            </p>
            <ul style="list-style: none; padding: 0; margin-bottom: 24px;">
              ${taskListHtml}
            </ul>
            <p style="font-size: 16px; color: #444;">
              Time to jump back into Zen Mode and knock them out! 🚀
            </p>
          </div>
        `,
            });

            // Update the notified flag on these tasks
            const taskIds = overdueTasks.map(t => t._id);
            await Task.updateMany(
                { _id: { $in: taskIds } },
                { $set: { overdueNotified: true } }
            );

            return NextResponse.json({
                success: true,
                message: `Sent notification for ${overdueTasks.length} overdue tasks.`
            });

        } catch (emailError) {
            console.error("Failed to send overdue email:", emailError);
            return NextResponse.json({ success: false, error: "Email delivery failed" }, { status: 500 });
        }

    } catch (error) {
        console.error("Cron error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
