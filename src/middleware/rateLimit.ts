/**
 * Rate limiting middleware
 */

import { Context, Next } from 'hono';

const RATE_LIMIT_WINDOW = 60; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Rate limiting middleware for authentication endpoints
 */
export async function rateLimitAuth(c: Context, next: Next) {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const key = `ratelimit:auth:${ip}`;

  try {
    const current = await c.env.KV.get(key, 'text');
    const count = current ? parseInt(current, 10) : 0;

    if (count >= MAX_REQUESTS) {
      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        },
        429
      );
    }

    // Increment counter
    await c.env.KV.put(key, (count + 1).toString(), {
      expirationTtl: RATE_LIMIT_WINDOW,
    });

    await next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request to proceed
    await next();
  }
}
