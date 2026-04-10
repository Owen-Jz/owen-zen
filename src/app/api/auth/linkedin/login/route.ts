
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;

export async function GET() {
    if (!CLIENT_ID) {
        return NextResponse.json({ error: "Missing LinkedIn credentials" }, { status: 500 });
    }

    if (!REDIRECT_URI) {
        return NextResponse.json({ error: "Missing LinkedIn redirect URI configuration" }, { status: 500 });
    }

    // Generate cryptographically secure state for CSRF protection
    const state = randomBytes(32).toString('hex');

    const scope = "openid profile email w_member_social";
    // w_member_social is required for posting
    // openid, profile, email are standard login scopes

    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;

    // Create response with state cookie for validation
    const response = NextResponse.redirect(url);
    response.cookies.set('linkedin_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });

    return response;
}
