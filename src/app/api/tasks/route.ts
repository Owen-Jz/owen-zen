import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const quadrant = searchParams.get('quadrant');
    const pool = searchParams.get('pool');

    await dbConnect();

    let query: Record<string, any>;
    if (pool === 'true') {
      // Pool = tasks with no quadrant, not banked, not archived, not completed
      query = {
        quadrant: null,
        isBanked: { $ne: true },
        isArchived: { $ne: true },
        status: { $ne: 'completed' },
      };
    } else if (quadrant) {
      query = { quadrant };
    } else if (projectId) {
      query = { projectId };
    } else if (boardId) {
      query = { boardId };
    } else if (status) {
      query = { status };
    } else {
      query = { $or: [{ boardId: null }, { boardId: { $exists: false } }] };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { boardId } = body;

    // Auto-assign order: put at the top (0) or bottom? 
    // Let's put at bottom: find max order and add 1
    // Filter by boardId
    const query = boardId
      ? { boardId }
      : { $or: [{ boardId: null }, { boardId: { $exists: false } }] };

    // New tasks get order 0 (order field kept for drag-and-drop compatibility)
    const newOrder = 0;

    const task = await Task.create({ ...body, order: newOrder });
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error("Attributes: POST /api/tasks error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  // Batch update for reordering or clearBoardId migration
  try {
    await dbConnect();
    const body = await req.json();

    // Migration: clear boardId from all tasks (move everything to "All Tasks")
    if (body.action === 'clearBoardId') {
      await Task.updateMany(
        { boardId: { $exists: true, $ne: null } },
        { $set: { boardId: null } }
      );
      return NextResponse.json({ success: true, message: "All tasks moved to All Tasks" });
    }

    const { tasks } = body;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
    }

    // Bulk write for performance
    const bulkOps = tasks.map((task: any) => ({
      updateOne: {
        filter: { _id: task._id },
        update: {
          $set: {
            order: task.order,
            status: task.status,
            priority: task.priority,
            title: task.title,
            isArchived: task.isArchived,
            completedAt: task.completedAt,
            isBanked: task.isBanked,
            quadrant: task.quadrant,
          }
        }
      }
    }));

    await Task.bulkWrite(bulkOps);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attributes: PUT /api/tasks error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
