import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Returns an Upstash Redis client, or null if not configured.
 * Rate limiting is optional — if env vars are missing, routes skip rate checks.
 */
function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

/**
 * AI chat rate limiter: 30 requests per 1-minute sliding window per user.
 * Returns null if Redis is not configured (graceful degradation).
 */
export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "ratelimit:ai",
    })
  : null;

/**
 * Password reset rate limiter: 3 requests per 1-hour sliding window per email.
 * Returns null if Redis is not configured.
 */
export const passwordResetRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      prefix: "ratelimit:pwd-reset",
    })
  : null;
