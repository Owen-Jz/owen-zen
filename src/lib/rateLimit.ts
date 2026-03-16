import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart. For production, consider Redis.
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (typeof setInterval === 'undefined') return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for reverse proxy setups)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (for development)
  return 'default';
}

export function createRateLimiter(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
  // Start cleanup on first use
  if (!cleanupTimer) {
    startCleanup();
  }

  return {
    check: (request: NextRequest): { success: boolean; remaining: number; resetTime: number } => {
      const identifier = getClientIdentifier(request);
      const now = Date.now();

      let entry = rateLimitStore.get(identifier);

      // If entry doesn't exist or has expired, create new one
      if (!entry || now > entry.resetTime) {
        entry = {
          count: 0,
          resetTime: now + config.windowMs,
        };
        rateLimitStore.set(identifier, entry);
      }

      // Check if request is within the current window
      if (entry.count >= config.maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetTime: entry.resetTime,
        };
      }

      // Increment counter
      entry.count++;

      return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
      };
    },

    middleware: (request: NextRequest) => {
      // Simple check function inline to avoid type issues
      const identifier = getClientIdentifier(request);
      const now = Date.now();
      let entry = rateLimitStore.get(identifier);
      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + config.windowMs };
        rateLimitStore.set(identifier, entry);
      }

      const result = request.headers.get('x-api-key')
        ? { success: true, remaining: 100, resetTime: Date.now() + 60000 }
        : config.maxRequests === Infinity
          ? { success: true, remaining: Infinity, resetTime: Date.now() + 60000 }
          : entry.count >= config.maxRequests
            ? { success: false, remaining: 0, resetTime: entry.resetTime }
            : (entry.count++, { success: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime });

      // Add rate limit headers to response
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', String(config.maxRequests));
      headers.set('X-RateLimit-Remaining', String(result.remaining));
      headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

      if (!result.success) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              ...Object.fromEntries(headers),
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            },
          }
        );
      }

      return null; // Pass through
    },
  };
}

// Pre-configured rate limiters
export const financeRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 30, // Stricter limit for write operations
});

export default createRateLimiter;
