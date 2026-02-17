
import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Integration from "@/models/Integration";

export async function GET() {
    try {
        await dbConnect();
        const integration = await Integration.findOne({ provider: 'linkedin' });

        if (integration && integration.accessToken) {
            return NextResponse.json({ connected: true, name: integration.profileName });
        }

        return NextResponse.json({ connected: false });
    } catch (error) {
        return NextResponse.json({ connected: false, error }, { status: 500 });
    }
}
