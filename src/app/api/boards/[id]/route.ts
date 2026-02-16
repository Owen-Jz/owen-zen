import dbConnect from "@/lib/db";
import Board from "@/models/Board";
import Task from "@/models/Task";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    
    // Optional: Delete all tasks associated with this board
    await Task.deleteMany({ boardId: id });
    
    const deletedBoard = await Board.findByIdAndDelete(id);
    if (!deletedBoard) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 400 });
  }
}
