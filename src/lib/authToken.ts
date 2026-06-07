/**
 * Signed session-token helpers for the API auth layer.
 *
 * Uses Web Crypto (HMAC-SHA256), which is available in both the Node.js route
 * runtime and the Edge middleware runtime, so the same token can be issued by
 * the verify-password route and validated by middleware.
 *
 * Token format: `<expiryMs>.<hexHmac>` where the HMAC is keyed by a server-only
 * secret (LOCK_SCREEN_PASSWORD). Single-user app, so a static signing key with
 * an expiry is sufficient — an attacker cannot forge the HMAC without the key.
 */

const ENCODER = new TextEncoder();
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, ENCODER.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(secret: string, ttlMs: number = DEFAULT_TTL_MS): Promise<string> {
  const exp = String(Date.now() + ttlMs);
  const sig = await hmacHex(secret, exp);
  return `${exp}.${sig}`;
}

export async function verifySessionToken(secret: string, token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || Date.now() > expNum) return false;

  const expected = await hmacHex(secret, exp);
  // Constant-time comparison to avoid leaking the signature via timing.
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_COOKIE = "oz_session";
export const SESSION_TTL_MS = DEFAULT_TTL_MS;
