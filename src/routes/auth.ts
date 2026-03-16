/**
 * Authentication routes
 */

import { Hono } from 'hono';
import { AuthService } from '../services/auth';
import { AdminService } from '../services/admin';
import { EmailService } from '../services/email';
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

    if (!result.success || !result.data) {
      return c.json(result, 400);
    }

    // Send verification email
    try {
      const adminService = new AdminService(
        c.env.DB as D1Database,
        c.env.KV as KVNamespace,
        c.env.ENCRYPTION_KEY as string
      );
      
      const smtpConfigResult = await adminService.getDecryptedSmtpConfig();
      
      if (smtpConfigResult.success && smtpConfigResult.data) {
        const emailService = new EmailService(smtpConfigResult.data);
        
        const token = result.data.verificationToken as string;
        const baseUrl = (c.env.FRONTEND_URL as string | undefined) || new URL(c.req.url).origin;
        
        const { subject, body } = emailService.composeVerificationEmail(email, token, baseUrl);
        
        console.log('Sending verification email:', {
          to: email,
          subject,
          smtpProvider: smtpConfigResult.data.provider,
          smtpHost: smtpConfigResult.data.host,
          smtpPort: smtpConfigResult.data.port,
          frontendUrl: baseUrl,
        });
        
        const emailResult = await emailService.sendEmail(email, subject, body);
        
        if (!emailResult.success) {
          console.error('Failed to send verification email:', emailResult.error);
          // Don't fail registration if email fails
          return c.json({
            success: true,
            data: { userId: result.data.userId },
            message: 'Registration successful, but failed to send verification email. Please contact support.',
          }, 201);
        }
        
        console.log('Verification email sent successfully');
      } else {
        console.warn('SMTP not configured, skipping verification email');
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Don't return the verification token to the client
    return c.json({
      success: true,
      data: { userId: result.data.userId },
      message: result.message,
    }, 201);
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

/**
 * POST /auth/resend-verification
 * Resend verification email
 */
auth.post('/resend-verification', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(
        {
          success: false,
          error: {
            code: 'MISSING_EMAIL',
            message: 'Email is required',
          },
        },
        400
      );
    }

    const authService = new AuthService(c.env.DB as D1Database, c.env.KV as KVNamespace);
    const result = await authService.resendVerification(email);

    if (!result.success || !result.data) {
      return c.json(result, 400);
    }

    // Send verification email
    try {
      const adminService = new AdminService(
        c.env.DB as D1Database,
        c.env.KV as KVNamespace,
        c.env.ENCRYPTION_KEY as string
      );
      
      const smtpConfigResult = await adminService.getDecryptedSmtpConfig();
      
      if (smtpConfigResult.success && smtpConfigResult.data) {
        const emailService = new EmailService(smtpConfigResult.data);
        
        const token = result.data.verificationToken as string;
        const baseUrl = (c.env.FRONTEND_URL as string | undefined) || new URL(c.req.url).origin;
        
        const { subject, body } = emailService.composeVerificationEmail(email, token, baseUrl);
        
        console.log('Resending verification email:', {
          to: email,
          subject,
          smtpProvider: smtpConfigResult.data.provider,
          frontendUrl: baseUrl,
        });
        
        const emailResult = await emailService.sendEmail(email, subject, body);
        
        if (!emailResult.success) {
          console.error('Failed to resend verification email:', emailResult.error);
          return c.json({
            success: false,
            error: {
              code: 'EMAIL_SEND_FAILED',
              message: 'Failed to send verification email. Please try again later.',
              details: emailResult.error,
            },
          }, 500);
        }
        
        console.log('Verification email resent successfully');
      } else {
        console.warn('SMTP not configured');
        return c.json({
          success: false,
          error: {
            code: 'SMTP_NOT_CONFIGURED',
            message: 'Email service is not configured. Please contact support.',
          },
        }, 500);
      }
    } catch (emailError) {
      console.error('Error resending verification email:', emailError);
      return c.json({
        success: false,
        error: {
          code: 'EMAIL_ERROR',
          message: 'An error occurred while sending email',
        },
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification route error:', error);
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
