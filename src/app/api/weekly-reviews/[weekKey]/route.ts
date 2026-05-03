import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WeeklyReview from '@/models/WeeklyReview';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ weekKey: string }> }
) {
    await dbConnect();
    const { weekKey } = await params;
    const review = await WeeklyReview.findOne({ weekKey });
    if (!review) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: review });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ weekKey: string }> }
) {
    await dbConnect();
    const { weekKey } = await params;
    await WeeklyReview.deleteOne({ weekKey });
    return NextResponse.json({ success: true });
}