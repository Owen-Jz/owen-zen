import dbConnect from "@/lib/db";
import Subscription from "@/models/Subscription";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const subscription = await Subscription.findById(id).lean();
        if (!subscription) {
            return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: subscription });
    } catch (error) {
        console.error("GET /api/subscriptions/[id] error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 400 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const body = await req.json();
        const { id } = await params;

        // If amount is being changed, record the old amount in costHistory
        if (body.amount !== undefined) {
            const existing = await Subscription.findById(id);
            if (existing && existing.amount !== body.amount) {
                body.costHistory = [
                    ...(existing.costHistory || []),
                    { date: new Date(), amount: existing.amount },
                ];
            }
        }

        const subscription = await Subscription.findByIdAndUpdate(id, body, { new: true });
        if (!subscription) {
            return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: subscription });
    } catch (error) {
        console.error("PUT /api/subscriptions/[id] error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const subscription = await Subscription.findByIdAndDelete(id);
        if (!subscription) {
            return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/subscriptions/[id] error:", error);
        return NextResponse.json({ success: false, error: error }, { status: 400 });
    }
}