/**
 * Authentication middleware
 */

import { Context, Next } from 'hono';

/**
 * Middleware to validate user session
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      401
    );
  }

  const token = authHeader.substring(7);
  const sessionData = await c.env.KV.get(`session:${token}`, 'text');

  if (!sessionData) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Session is invalid or expired',
        },
      },
      401
    );
  }

  const session = JSON.parse(sessionData);
  const user = await (c.env.DB as D1Database)
    .prepare('SELECT id, is_blacklisted FROM users WHERE id = ?')
    .bind(session.userId)
    .first<{ id: string; is_blacklisted: number }>();

  if (!user) {
    await c.env.KV.delete(`session:${token}`);
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Session user no longer exists',
        },
      },
      401
    );
  }

  if (user.is_blacklisted) {
    await c.env.KV.delete(`session:${token}`);
    return c.json(
      {
        success: false,
        error: {
          code: 'ACCOUNT_BLACKLISTED',
          message: 'Your account has been suspended',
        },
      },
      403
    );
  }

  c.set('userId', session.userId);
  c.set('sessionToken', token);

  await next();
}

/**
 * Middleware to validate admin password
 */
export async function requireAdmin(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Admin authentication required',
        },
      },
      401
    );
  }

  const password = authHeader.substring(7);
  const adminPassword = c.env.ADMIN_PASSWORD;

  if (password !== adminPassword) {
    return c.json(
      {
        success: false,
        error: {
          code: 'INVALID_ADMIN_PASSWORD',
          message: 'Invalid admin password',
        },
      },
      403
    );
  }

  await next();
}
