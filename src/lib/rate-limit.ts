/**
 * Simple in-memory rate limiter for API routes.
 * For production, replace with Redis-based rate limiting (e.g., @upstash/ratelimit).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited.
 *
 * @param key - Unique identifier for the requestor (e.g., IP, studentId, userId)
 * @param limit - Maximum number of requests allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns null if allowed, or a NextResponse JSON with 429 status if limited
 */
export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): { allowed: true } | { allowed: false; response: Response } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: `Too many requests. Please try again in ${retryAfter} seconds.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      ),
    };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Generate a rate limit key from the request's IP address.
 * Falls back to "unknown" if the IP cannot be determined.
 */
export function ipFromRequest(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}