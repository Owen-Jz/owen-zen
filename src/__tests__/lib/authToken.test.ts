import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/authToken";

const SECRET = "correct-horse-battery-staple";

describe("authToken", () => {
  it("verifies a freshly created token", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(SECRET, token)).toBe(true);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken("wrong-secret", token)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await createSessionToken(SECRET, -1000); // already expired
    expect(await verifySessionToken(SECRET, token)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await createSessionToken(SECRET);
    const [exp] = token.split(".");
    const tampered = `${exp}.${"0".repeat(64)}`;
    expect(await verifySessionToken(SECRET, tampered)).toBe(false);
  });

  it("rejects a tampered expiry (signature no longer matches)", async () => {
    const token = await createSessionToken(SECRET);
    const sig = token.split(".")[1];
    const farFuture = String(Date.now() + 1000 * 60 * 60 * 24 * 365);
    expect(await verifySessionToken(SECRET, `${farFuture}.${sig}`)).toBe(false);
  });

  it("rejects empty / malformed tokens", async () => {
    expect(await verifySessionToken(SECRET, undefined)).toBe(false);
    expect(await verifySessionToken(SECRET, null)).toBe(false);
    expect(await verifySessionToken(SECRET, "")).toBe(false);
    expect(await verifySessionToken(SECRET, "no-dot")).toBe(false);
    expect(await verifySessionToken(SECRET, ".sigonly")).toBe(false);
    expect(await verifySessionToken(SECRET, "notanumber.deadbeef")).toBe(false);
  });
});
