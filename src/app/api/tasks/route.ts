import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    // Sort by 'order' ascending (so 0 is top), then by createdAt
    const tasks = await Task.find({}).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    
    // Auto-assign order: put at the top (0) or bottom? 
    // Let's put at bottom: find max order and add 1
    const lastTask = await Task.findOne().sort({ order: -1 });
    const newOrder = lastTask && lastTask.order !== undefined ? lastTask.order + 1 : 0;
    
    const task = await Task.create({ ...body, order: newOrder });
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  // Batch update for reordering
  await dbConnect();
  try {
    const body = await req.json();
    const { tasks } = body; // Expects array of { _id, order, status }
    
    if (!Array.isArray(tasks)) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
    }

    // Bulk write for performance
    const bulkOps = tasks.map((task: any) => ({
      updateOne: {
        filter: { _id: task._id },
        update: { $set: { order: task.order, status: task.status } }
      }
    }));

    await Task.bulkWrite(bulkOps);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
