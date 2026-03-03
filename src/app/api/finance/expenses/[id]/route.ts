import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";

// DELETE - Delete expense by ID
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        await Expense.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: "Expense deleted" });
    } catch (error: any) {
        console.error("Error deleting expense:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update expense by ID
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const expense = await Expense.findByIdAndUpdate(id, body, { new: true })
            .populate("categoryId", "name color icon");
        return NextResponse.json({ success: true, expense });
    } catch (error: any) {
        console.error("Error updating expense:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
