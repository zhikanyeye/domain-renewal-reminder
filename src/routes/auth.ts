/**
 * Authentication routes
 */

import { Hono } from 'hono';
import { AuthService } from '../services/auth';
import { AdminService } from '../services/admin';
import { EmailService } from '../services/email';
import { rateLimitAuth } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';
import { resolveAppBaseUrl } from '../utils/appUrl';

const auth = new Hono();

function getVerificationAppUrl(c: { req: { url: string; header(name: string): string | undefined } }): string {
  return resolveAppBaseUrl(
    c.req.url,
    c.req.header('Origin'),
    c.req.header('Referer')
  );
}

function describeProvider(config: { provider: string; apiType?: string; host?: string; port?: number }): string {
  if (config.provider === 'http-api') {
    return `http-api:${config.apiType || 'custom'}`;
  }

  return `smtp:${config.host || 'unknown'}:${config.port || 'unknown'}`;
}

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
        const provider = describeProvider(smtpConfigResult.data);
        
        const token = result.data.verificationToken as string;
        const appUrl = getVerificationAppUrl(c);
        
        const { subject, htmlBody, textBody } = emailService.composeVerificationEmail(email, token, appUrl);
        
        console.log('Sending verification email:', {
          to: email,
          subject,
          smtpProvider: smtpConfigResult.data.provider,
          smtpHost: smtpConfigResult.data.host,
          smtpPort: smtpConfigResult.data.port,
          appUrl,
        });
        
        const emailResult = await emailService.sendEmail(email, subject, htmlBody, textBody);
        
        if (!emailResult.success) {
          console.error('Failed to send verification email:', emailResult.error);
          await adminService.recordEmailSend({
            userId: result.data.userId as string,
            userEmail: email,
            emailType: 'verification',
            triggerSource: 'register',
            provider,
            recipientEmail: email,
            subject,
            status: 'failed',
            errorCode: emailResult.error?.code,
            errorMessage: emailResult.error?.message,
          });
          // Don't fail registration if email fails
          return c.json({
            success: true,
            data: { userId: result.data.userId },
            message: 'Registration successful, but failed to send verification email. Please contact support.',
          }, 201);
        }
        
        await adminService.recordEmailSend({
          userId: result.data.userId as string,
          userEmail: email,
          emailType: 'verification',
          triggerSource: 'register',
          provider,
          recipientEmail: email,
          subject,
          status: 'sent',
        });

        console.log('Verification email sent successfully');
      } else {
        console.warn('SMTP not configured, skipping verification email');
        await adminService.recordEmailSend({
          userId: result.data.userId as string,
          userEmail: email,
          emailType: 'verification',
          triggerSource: 'register',
          provider: 'unconfigured',
          recipientEmail: email,
          subject: 'Verification email',
          status: 'failed',
          errorCode: 'SMTP_NOT_CONFIGURED',
          errorMessage: 'SMTP configuration not found',
        });
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      const adminService = new AdminService(
        c.env.DB as D1Database,
        c.env.KV as KVNamespace,
        c.env.ENCRYPTION_KEY as string
      );
      await adminService.recordEmailSend({
        userId: result.data.userId as string,
        userEmail: email,
        emailType: 'verification',
        triggerSource: 'register',
        provider: 'unknown',
        recipientEmail: email,
        subject: 'Verification email',
        status: 'failed',
        errorCode: 'EMAIL_ERROR',
        errorMessage: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
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
        const provider = describeProvider(smtpConfigResult.data);
        
        const token = result.data.verificationToken as string;
        const appUrl = getVerificationAppUrl(c);
        
        const { subject, htmlBody, textBody } = emailService.composeVerificationEmail(email, token, appUrl);
        
        console.log('Resending verification email:', {
          to: email,
          subject,
          smtpProvider: smtpConfigResult.data.provider,
          appUrl,
        });
        
        const emailResult = await emailService.sendEmail(email, subject, htmlBody, textBody);
        
        if (!emailResult.success) {
          console.error('Failed to resend verification email:', emailResult.error);
          await adminService.recordEmailSend({
            userEmail: email,
            emailType: 'verification',
            triggerSource: 'resend-verification',
            provider,
            recipientEmail: email,
            subject,
            status: 'failed',
            errorCode: emailResult.error?.code,
            errorMessage: emailResult.error?.message,
          });
          return c.json({
            success: false,
            error: {
              code: 'EMAIL_SEND_FAILED',
              message: 'Failed to send verification email. Please try again later.',
              details: emailResult.error,
            },
          }, 500);
        }
        
        await adminService.recordEmailSend({
          userEmail: email,
          emailType: 'verification',
          triggerSource: 'resend-verification',
          provider,
          recipientEmail: email,
          subject,
          status: 'sent',
        });

        console.log('Verification email resent successfully');
      } else {
        console.warn('SMTP not configured');
        await adminService.recordEmailSend({
          userEmail: email,
          emailType: 'verification',
          triggerSource: 'resend-verification',
          provider: 'unconfigured',
          recipientEmail: email,
          subject: 'Verification email',
          status: 'failed',
          errorCode: 'SMTP_NOT_CONFIGURED',
          errorMessage: 'SMTP configuration not found',
        });
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
      const adminService = new AdminService(
        c.env.DB as D1Database,
        c.env.KV as KVNamespace,
        c.env.ENCRYPTION_KEY as string
      );
      await adminService.recordEmailSend({
        userEmail: email,
        emailType: 'verification',
        triggerSource: 'resend-verification',
        provider: 'unknown',
        recipientEmail: email,
        subject: 'Verification email',
        status: 'failed',
        errorCode: 'EMAIL_ERROR',
        errorMessage: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
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
