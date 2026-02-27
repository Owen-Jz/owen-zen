import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const body = await req.json();
        const project = await Project.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json({ success: true, data: project });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        await Project.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
    }
}
