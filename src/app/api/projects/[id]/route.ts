import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const body = await req.json();
        const project = await Project.findByIdAndUpdate(id, body, { new: true, runValidators: true });
        if (!project) {
            return NextResponse.json({ success: false }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: project });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const deleted = await Project.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ success: false }, { status: 404 });
        }
        // Un-link tasks from the deleted project so they return to the general pool
        // instead of dangling with a dead projectId reference.
        await Task.updateMany({ projectId: id }, { $unset: { projectId: "" } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }
}
