/**
 * IP-based Rate Limiter
 * Uses in-memory storage for development; replace with Redis for production.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (replace with Redis in production for multi-instance setups)
const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000);

/**
 * Check and increment rate limit for a given key (typically IP + endpoint).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

// Pre-configured rate limits per endpoint
export const RATE_LIMITS = {
  analyze: { maxRequests: 10, windowMs: 60_000 },    // 10 analyzes/min
  process: { maxRequests: 5, windowMs: 60_000 },     // 5 processes/min
  download: { maxRequests: 20, windowMs: 60_000 },   // 20 downloads/min
} as const;
