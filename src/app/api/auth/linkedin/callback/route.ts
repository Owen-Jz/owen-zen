
import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Integration from "@/models/Integration";

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://127.0.0.1:3000/api/auth/linkedin/callback';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error: `LinkedIn login failed: ${error}`, desc: searchParams.get('error_description') }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID!,
                client_secret: CLIENT_SECRET!
            })
        });

        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error);
        }

        const accessToken = tokenData.access_token;
        const expiresIn = tokenData.expires_in; // 60 days typically
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        // Fetch User Profile to get URN/ID
        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const profileData = await profileRes.json();

        // Save to Database
        await dbConnect();

        await Integration.findOneAndUpdate(
            { provider: 'linkedin' },
            {
                accessToken,
                expiresAt,
                profileId: profileData.sub, // 'sub' is the unique member ID
                profileName: profileData.name,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        // Redirect back to dashboard with success query param
        return NextResponse.redirect('http://127.0.0.1:3000/?linkedin_connected=true');

    } catch (error: any) {
        console.error("LinkedIn OAuth Error:", error);
        return NextResponse.json({ error: error.message || "Key exchange failed" }, { status: 500 });
    }
}
