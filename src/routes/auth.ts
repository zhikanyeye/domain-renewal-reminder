/**
 * Authentication routes
 */

import { Hono } from 'hono';
import { AuthService } from '../services/auth';
import { rateLimitAuth } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';

const auth = new Hono();

// Apply rate limiting to all auth routes
auth.use('*', rateLimitAuth);

/**
 * POST /auth/register
 * Register a new user
 */
auth.post('/register', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Email and password are required',
          },
        },
        400
      );
    }

    const authService = new AuthService(c.env.DB as D1Database, c.env.KV as KVNamespace);
    const result = await authService.register(email, password);

    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.error('Register route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during registration',
        },
      },
      500
    );
  }
});

/**
 * POST /auth/verify
 * Verify email with token
 */
auth.post('/verify', async (c) => {
  try {
    const { token } = await c.req.json();

    if (!token) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Verification token is required',
          },
        },
        400
      );
    }

    const authService = new AuthService(c.env.DB as D1Database, c.env.KV as KVNamespace);
    const result = await authService.verifyEmail(token);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Verify route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during verification',
        },
      },
      500
    );
  }
});

/**
 * POST /auth/login
 * User login
 */
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Email and password are required',
          },
        },
        400
      );
    }

    const authService = new AuthService(c.env.DB as D1Database, c.env.KV as KVNamespace);
    const result = await authService.login(email, password);

    return c.json(result, result.success ? 200 : 401);
  } catch (error) {
    console.error('Login route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during login',
        },
      },
      500
    );
  }
});

/**
 * POST /auth/logout
 * User logout
 */
auth.post('/logout', requireAuth, async (c) => {
  try {
    const token = c.get('sessionToken') as string;
    const authService = new AuthService(c.env.DB as D1Database, c.env.KV as KVNamespace);
    const result = await authService.logout(token);

    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('Logout route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during logout',
        },
      },
      500
    );
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
auth.get('/me', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    
    const user = await (c.env.DB as D1Database)
      .prepare('SELECT id, email, is_verified, created_at FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        404
      );
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      },
      500
    );
  }
});

export default auth;
