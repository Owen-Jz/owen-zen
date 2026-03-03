import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Income from "@/models/Income";

// DELETE - Delete income entry
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        await Income.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: "Income deleted" });
    } catch (error: any) {
        console.error("Error deleting income:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
