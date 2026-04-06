// ==================== Rate Limiting ====================
// Simple in-memory rate limiter (use Redis in production)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number;      // Max requests per window
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(key, newEntry);
    return {
      success: true,
      remaining: config.max - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= config.max) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  store.set(key, entry);

  return {
    success: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
  };
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Preset configs
export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 10 },       // 10 per 15 min
  contact: { windowMs: 60 * 60 * 1000, max: 5 },      // 5 per hour
  checkout: { windowMs: 60 * 1000, max: 10 },          // 10 per min
  newsletter: { windowMs: 60 * 60 * 1000, max: 3 },   // 3 per hour
  general: { windowMs: 60 * 1000, max: 60 },           // 60 per min
};

// Object-style alias used by API routes
export const rateLimiter = {
  check(key: string, config: RateLimitConfig): boolean {
    return rateLimit(key, config).success;
  },
};
