import { NextResponse } from "next/server";

// Server-side password verification
// The password is stored in an environment variable and compared securely
const CORRECT_PASSWORD = process.env.LOCK_SCREEN_PASSWORD;

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ valid: false, error: "No password provided" }, { status: 400 });
    }

    // If no password is configured, deny access
    if (!CORRECT_PASSWORD) {
      console.error("LOCK_SCREEN_PASSWORD environment variable is not set");
      return NextResponse.json({ valid: false, error: "Lock not configured" }, { status: 500 });
    }

    // Use timing-safe comparison to prevent timing attacks
    const isValid = timingSafeEqual(password, CORRECT_PASSWORD);

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("Password verification error:", error);
    return NextResponse.json({ valid: false, error: "Verification failed" }, { status: 500 });
  }
}

// Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
