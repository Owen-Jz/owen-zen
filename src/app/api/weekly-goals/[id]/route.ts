import dbConnect from "@/lib/db";
import WeeklyGoal from "@/models/WeeklyGoal";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        await WeeklyGoal.findByIdAndDelete(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/weekly-goals error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
    }
}
