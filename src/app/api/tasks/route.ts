import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');
    const status = searchParams.get('status');
    console.log("Attributes: GET /api/tasks called", boardId ? `for board ${boardId}` : "for all tasks (or default)");
    await dbConnect();

    let query: Record<string, any>;
    if (boardId) {
      query = { boardId };
    } else if (status) {
      query = { status };
    } else {
      query = { $or: [{ boardId: null }, { boardId: { $exists: false } }] };
    }

    // Sort by createdAt descending — newest tasks appear first
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Attributes: GET /api/tasks error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 400 });
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
  // Batch update for reordering
  try {
    await dbConnect();
    const body = await req.json();
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
            priority: task.priority, // Allow priority updates
            title: task.title,       // Allow title updates
            isArchived: task.isArchived, // Allow archiving
            completedAt: task.completedAt // Allow date logging
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
