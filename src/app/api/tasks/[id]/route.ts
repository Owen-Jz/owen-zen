import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

async function recalculateProjectProgress(projectId: string) {
  const totalTasks = await Task.countDocuments({ projectId });
  const completedTasks = await Task.countDocuments({ projectId, status: 'completed' });
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  await Project.findByIdAndUpdate(projectId, { progress });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Get existing task to check if projectId is being changed
    const existingTask = await Task.findById(id);
    const previousProjectId = existingTask?.projectId?.toString();
    const newProjectId = body.projectId;

    if (body.status) {
      if (body.status === 'completed' && !body.completedAt) {
        body.completedAt = new Date();
      } else if (body.status !== 'completed') {
        body.completedAt = null;
      }
    }

    const task = await Task.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!task) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Recalculate project progress if task was completed or un-completed
    if (task.projectId && body.status === 'completed') {
      await recalculateProjectProgress(task.projectId.toString());
    }
    // If task was removed from project or moved, recalculate old project
    if (previousProjectId && previousProjectId !== newProjectId) {
      await recalculateProjectProgress(previousProjectId);
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("Attributes: PUT /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    // Get task's projectId before deletion for progress recalculation
    const task = await Task.findById(id);
    const projectId = task?.projectId?.toString();

    const deletedTask = await Task.deleteOne({ _id: id });
    if (!deletedTask) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Recalculate project progress after deletion
    if (projectId) {
      await recalculateProjectProgress(projectId);
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error("Attributes: DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
