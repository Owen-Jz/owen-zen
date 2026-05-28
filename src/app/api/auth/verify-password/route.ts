import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const CORRECT_PASSWORD = process.env.LOCK_SCREEN_PASSWORD;

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ valid: false, error: "No password provided" }, { status: 400 });
    }

    if (!CORRECT_PASSWORD) {
      console.error("LOCK_SCREEN_PASSWORD environment variable is not set");
      return NextResponse.json({ valid: false, error: "Lock not configured" }, { status: 500 });
    }

    // Pad to same length before comparing to avoid leaking length via timing
    const maxLen = Math.max(password.length, CORRECT_PASSWORD.length);
    const a = Buffer.alloc(maxLen);
    const b = Buffer.alloc(maxLen);
    Buffer.from(password).copy(a);
    Buffer.from(CORRECT_PASSWORD).copy(b);
    const isValid = timingSafeEqual(a, b) && password.length === CORRECT_PASSWORD.length;

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("Password verification error:", error);
    return NextResponse.json({ valid: false, error: "Verification failed" }, { status: 500 });
  }
}
