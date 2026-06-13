import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

// POST /api/zeal/assign — hand an Owen Zen task to ZEAL.
// Sets the task to the "AI Agent" column + zeal.status = "queued", then fires a
// best-effort kick at the ZEAL processor (the ZEAL cron is the backstop, so a
// failed kick never matters).
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const taskId = body?.taskId;

    if (!taskId) {
      return NextResponse.json({ success: false, error: "taskId is required" }, { status: 400 });
    }

    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Guard against re-assigning a task ZEAL is already handling.
    const currentZealStatus = existingTask.zeal?.status;
    if (currentZealStatus && ["queued", "routing", "working"].includes(currentZealStatus)) {
      return NextResponse.json({ success: true, data: existingTask, alreadyAssigned: true });
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { status: "ai-agent", zeal: { status: "queued", assignedAt: new Date() } },
      { new: true }
    );
    if (!task) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Fire-and-forget kick to ZEAL for immediacy. Never throw if it fails.
    const processUrl = process.env.ZEAL_PROCESS_URL;
    if (processUrl) {
      fetch(processUrl, {
        method: "POST",
        headers: { "x-zeal-key": process.env.ZEAL_INBOUND_KEY || "" },
        signal: AbortSignal.timeout(2500),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Attributes: POST /api/zeal/assign error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
