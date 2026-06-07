import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/authToken";

/**
 * Server-side auth gate for the API.
 *
 * OPT-IN: only enforces when `ENABLE_API_AUTH === "true"` AND a
 * `LOCK_SCREEN_PASSWORD` (the HMAC signing key) is configured. This lets the
 * capability ship without immediately locking out an existing deployment —
 * flip the env var (and test on a preview) when ready. Until then it is a
 * pass-through and behavior is unchanged.
 *
 * When enabled, every /api/* request must present a valid signed session cookie
 * (set by /api/auth/verify-password on successful unlock), except for routes
 * that authenticate by other means: the login endpoint itself, the LinkedIn
 * OAuth flow (callback arrives from LinkedIn with no cookie), cron jobs
 * (CRON_SECRET), and the external lead webhook (signature).
 */

const EXEMPT_PREFIXES = [
  "/api/auth/verify-password",
  "/api/auth/linkedin",
  "/api/tasks/cron",
  "/api/leads/webhook",
  "/api/susan",
];

export async function middleware(req: NextRequest) {
  const secret = process.env.LOCK_SCREEN_PASSWORD;

  // Disabled (default) or unconfigured → pass through, no behavior change.
  if (process.env.ENABLE_API_AUTH !== "true" || !secret) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(secret, token)) {
    return NextResponse.next();
  }

  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/api/:path*"],
};
