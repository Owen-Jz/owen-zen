import dbConnect from "@/lib/db";
import Goal from "@/models/Goal";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id } = await params;

        const goal = await Goal.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json({ success: true, data: goal });
    } catch (error) {
        console.error("PUT /api/goals/[id] error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;

        // Recursive delete helper (or use cascading if possible, but manual is safer here)
        const recursiveDelete = async (goalId: string) => {
            // Find children
            const children = await Goal.find({ parentId: goalId });
            for (const child of children) {
                await recursiveDelete(child._id);
            }
            await Goal.findByIdAndDelete(goalId);
        };

        await recursiveDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/goals/[id] error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 400 });
    }
}
