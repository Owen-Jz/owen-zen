
import { NextResponse } from 'next/server';

const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://127.0.0.1:3000/api/auth/linkedin/callback';
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;

export async function GET() {
    if (!CLIENT_ID) {
        return NextResponse.json({ error: "Missing LinkedIn credentials" }, { status: 500 });
    }

    const scope = "openid profile email w_member_social";
    // w_member_social is required for posting
    // openid, profile, email are standard login scopes (optional if just posting, but often come together)

    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(url);
}
