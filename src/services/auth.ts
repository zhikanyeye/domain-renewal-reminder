/**
 * Authentication Service
 * Handles user registration, login, and session management
 */

import bcrypt from 'bcrypt';
import { User, Session, VerificationToken, ApiResponse } from '../types';
import { isEmailDomainAllowed } from '../utils/email';
import { isValidPassword } from '../utils/validation';

const SALT_ROUNDS = 10;
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const VERIFICATION_TTL = 24 * 60 * 60; // 24 hours in seconds

export class AuthService {
  constructor(
    private db: D1Database,
    private kv: KVNamespace
  ) {}

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<ApiResponse<{ userId: string }>> {
    try {
      // Validate email domain
      if (!isEmailDomainAllowed(email)) {
        return {
          success: false,
          error: {
            code: 'INVALID_EMAIL_DOMAIN',
            message: 'Email domain is not allowed. Please use a mainstream email provider.',
          },
        };
      }

      // Validate password
      const passwordValidation = isValidPassword(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Password does not meet requirements',
            details: passwordValidation.errors,
          },
        };
      }

      // Check if user already exists
      const existing = await this.db
        .prepare('SELECT id FROM users WHERE email = ?')
        .bind(email.toLowerCase())
        .first();

      if (existing) {
        return {
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'An account with this email already exists',
          },
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const userId = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);

      await this.db
        .prepare(
          `INSERT INTO users (id, email, password_hash, is_verified, is_blacklisted, created_at, updated_at)
           VALUES (?, ?, ?, 0, 0, ?, ?)`
        )
        .bind(userId, email.toLowerCase(), passwordHash, now, now)
        .run();

      // Generate verification token
      const verificationToken = crypto.randomUUID();
      const tokenData: VerificationToken = {
        userId,
        email: email.toLowerCase(),
      };

      await this.kv.put(
        `verify:${verificationToken}`,
        JSON.stringify(tokenData),
        { expirationTtl: VERIFICATION_TTL }
      );

      return {
        success: true,
        data: { userId },
        message: 'Registration successful. Please check your email for verification.',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register user',
        },
      };
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      const tokenData = await this.kv.get(`verify:${token}`, 'text');

      if (!tokenData) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Verification token is invalid or expired',
          },
        };
      }

      const { userId } = JSON.parse(tokenData) as VerificationToken;

      // Update user verification status
      const now = Math.floor(Date.now() / 1000);
      await this.db
        .prepare('UPDATE users SET is_verified = 1, updated_at = ? WHERE id = ?')
        .bind(now, userId)
        .run();

      // Delete verification token
      await this.kv.delete(`verify:${token}`);

      return {
        success: true,
        message: 'Email verified successfully. You can now log in.',
      };
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Failed to verify email',
        },
      };
    }
  }

  /**
   * User login
   */
  async login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
    try {
      // Get user from database
      const user = await this.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(email.toLowerCase())
        .first<User>();

      if (!user) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        };
      }

      // Check if user is blacklisted
      if (user.isBlacklisted) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_BLACKLISTED',
            message: user.blacklistReason || 'Your account has been suspended',
          },
        };
      }

      // Check if user is verified
      if (!user.isVerified) {
        return {
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email before logging in',
          },
        };
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatch) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        };
      }

      // Generate session token
      const sessionToken = crypto.randomUUID();
      const sessionData: Session = {
        userId: user.id,
        createdAt: Math.floor(Date.now() / 1000),
      };

      await this.kv.put(
        `session:${sessionToken}`,
        JSON.stringify(sessionData),
        { expirationTtl: SESSION_TTL }
      );

      return {
        success: true,
        data: { token: sessionToken },
        message: 'Login successful',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Failed to log in',
        },
      };
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const sessionData = await this.kv.get(`session:${token}`, 'text');

      if (!sessionData) {
        return { valid: false };
      }

      const session = JSON.parse(sessionData) as Session;
      return { valid: true, userId: session.userId };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<ApiResponse> {
    try {
      await this.kv.delete(`session:${token}`);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to log out',
        },
      };
    }
  }
}
