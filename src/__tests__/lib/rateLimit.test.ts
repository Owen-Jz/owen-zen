import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "@/lib/rateLimit";

// Minimal NextRequest-like stub — the limiter only reads forwarding headers.
function reqFrom(ip: string) {
  return {
    headers: {
      get: (name: string) => (name === "x-forwarded-for" ? ip : null),
    },
  } as any;
}

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to maxRequests then blocks", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
    const req = reqFrom("1.1.1.1");

    expect(limiter.check(req).success).toBe(true);
    expect(limiter.check(req).success).toBe(true);
    expect(limiter.check(req).success).toBe(true);
    const blocked = limiter.check(req);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks clients independently by IP", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    expect(limiter.check(reqFrom("2.2.2.2")).success).toBe(true);
    expect(limiter.check(reqFrom("2.2.2.2")).success).toBe(false);
    // Different IP is unaffected.
    expect(limiter.check(reqFrom("3.3.3.3")).success).toBe(true);
  });

  it("resets after the window elapses", () => {
    const limiter = createRateLimiter({ windowMs: 1_000, maxRequests: 1 });
    const req = reqFrom("4.4.4.4");
    expect(limiter.check(req).success).toBe(true);
    expect(limiter.check(req).success).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(limiter.check(req).success).toBe(true);
  });
});
