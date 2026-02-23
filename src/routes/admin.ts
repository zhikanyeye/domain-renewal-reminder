/**
 * Admin routes
 */

import { Hono } from 'hono';
import { AdminService } from '../services/admin';
import { requireAdmin } from '../middleware/auth';

const admin = new Hono();

// All admin routes require admin authentication
admin.use('*', requireAdmin);

/**
 * GET /admin/users
 * List all users with pagination
 */
admin.get('/users', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
    const pageSize = parseInt(c.req.query('pageSize') || '20', 10);

    const adminService = new AdminService(
      c.env.DB as D1Database,
      c.env.KV as KVNamespace,
      c.env.ENCRYPTION_KEY as string
    );
    const result = await adminService.listUsers(page, pageSize);

    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('List users route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while listing users',
        },
      },
      500
    );
  }
});

/**
 * POST /admin/users/:id/blacklist
 * Blacklist a user
 */
admin.post('/users/:id/blacklist', async (c) => {
  try {
    const userId = c.req.param('id');
    const { reason } = await c.req.json();

    if (!reason) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_REASON',
            message: 'Blacklist reason is required',
          },
        },
        400
      );
    }

    const adminService = new AdminService(
      c.env.DB as D1Database,
      c.env.KV as KVNamespace,
      c.env.ENCRYPTION_KEY as string
    );
    const result = await adminService.blacklistUser(userId, reason);

    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    console.error('Blacklist user route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while blacklisting user',
        },
      },
      500
    );
  }
});

/**
 * DELETE /admin/users/:id
 * Delete a user
 */
admin.delete('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');

    const adminService = new AdminService(
      c.env.DB as D1Database,
      c.env.KV as KVNamespace,
      c.env.ENCRYPTION_KEY as string
    );
    const result = await adminService.deleteUser(userId);

    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    console.error('Delete user route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting user',
        },
      },
      500
    );
  }
});

/**
 * POST /admin/smtp
 * Update SMTP configuration
 */
admin.post('/smtp', async (c) => {
  try {
    const config = await c.req.json();

    const adminService = new AdminService(
      c.env.DB as D1Database,
      c.env.KV as KVNamespace,
      c.env.ENCRYPTION_KEY as string
    );
    const result = await adminService.updateSmtpConfig(config);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Update SMTP route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating SMTP configuration',
        },
      },
      500
    );
  }
});

/**
 * GET /admin/smtp
 * Get SMTP configuration
 */
admin.get('/smtp', async (c) => {
  try {
    const adminService = new AdminService(
      c.env.DB as D1Database,
      c.env.KV as KVNamespace,
      c.env.ENCRYPTION_KEY as string
    );
    const result = await adminService.getSmtpConfig();

    return c.json(result, result.success ? 200 : 404);
  } catch (error) {
    console.error('Get SMTP route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while getting SMTP configuration',
        },
      },
      500
    );
  }
});

/**
 * GET /admin/logs
 * Get admin action logs
 */
admin.get('/logs', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100', 10);

    const adminService = new AdminService(
      c.env.DB as D1Database,
      c.env.KV as KVNamespace,
      c.env.ENCRYPTION_KEY as string
    );
    const result = await adminService.getAdminLogs(limit);

    return c.json(result, result.success ? 200 : 500);
  } catch (error) {
    console.error('Get logs route error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while getting logs',
        },
      },
      500
    );
  }
});

export default admin;
