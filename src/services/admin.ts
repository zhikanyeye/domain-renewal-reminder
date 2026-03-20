/**
 * Admin Service
 * Handles admin operations like user management and SMTP configuration
 */

import {
  User,
  SmtpConfig,
  SmtpConfigUpdate,
  SmtpConfigSummary,
  ApiResponse,
  AdminLog,
  EmailSendLog,
  EmailSendLogInput,
} from '../types';
import { validateSmtpConfig } from '../utils/validation';
import { encrypt, decrypt } from '../utils/crypto';

export class AdminService {
  constructor(
    private db: D1Database,
    private kv: KVNamespace,
    private encryptionKey: string
  ) {}

  private async getStoredSmtpConfig(): Promise<(Omit<SmtpConfig, 'password' | 'apiKey'> & {
    password?: string;
    apiKey?: string;
  }) | null> {
    const configData = await this.kv.get('smtp_config', 'text');
    if (!configData) {
      return null;
    }

    return JSON.parse(configData);
  }

  private async decryptSecret(value?: string): Promise<string | undefined> {
    if (!value) {
      return undefined;
    }

    try {
      return await decrypt(value, this.encryptionKey);
    } catch {
      // Backward compatibility for configs stored before secret encryption was added.
      return value;
    }
  }

  /**
   * List all users with pagination
   */
  async listUsers(page: number = 1, pageSize: number = 20): Promise<ApiResponse<{
    users: Array<User & { domain_count: number }>;
    total: number;
    page: number;
    pageSize: number;
  }>> {
    try {
      const offset = (page - 1) * pageSize;

      // Get total count
      const countResult = await this.db
        .prepare('SELECT COUNT(*) as count FROM users')
        .first<{ count: number }>();

      const total = countResult?.count || 0;

      // Get users with domain count
      const result = await this.db
        .prepare(
          `SELECT 
            u.id, 
            u.email, 
            u.is_verified, 
            u.is_blacklisted, 
            u.blacklist_reason, 
            u.created_at, 
            u.updated_at,
            COUNT(d.id) as domain_count
           FROM users u
           LEFT JOIN domains d ON u.id = d.user_id
           GROUP BY u.id, u.email, u.is_verified, u.is_blacklisted, u.blacklist_reason, u.created_at, u.updated_at
           ORDER BY u.created_at DESC
           LIMIT ? OFFSET ?`
        )
        .bind(pageSize, offset)
        .all();

      return {
        success: true,
        data: {
          users: result.results as Array<User & { domain_count: number }>,
          total,
          page,
          pageSize,
        },
      };
    } catch (error) {
      console.error('List users error:', error);
      return {
        success: false,
        error: {
          code: 'LIST_USERS_FAILED',
          message: 'Failed to list users',
        },
      };
    }
  }

  /**
   * Blacklist a user
   */
  async blacklistUser(userId: string, reason: string): Promise<ApiResponse> {
    try {
      const now = Math.floor(Date.now() / 1000);

      const result = await this.db
        .prepare(
          'UPDATE users SET is_blacklisted = 1, blacklist_reason = ?, updated_at = ? WHERE id = ?'
        )
        .bind(reason, now, userId)
        .run();

      if (result.meta.changes === 0) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        };
      }

      // Log admin action
      await this.logAction('BLACKLIST_USER', { userId, reason });

      return {
        success: true,
        message: 'User blacklisted successfully',
      };
    } catch (error) {
      console.error('Blacklist user error:', error);
      return {
        success: false,
        error: {
          code: 'BLACKLIST_FAILED',
          message: 'Failed to blacklist user',
        },
      };
    }
  }

  /**
   * Delete a user and all their domains
   */
  async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      // Delete user (domains will be cascade deleted due to foreign key)
      const result = await this.db
        .prepare('DELETE FROM users WHERE id = ?')
        .bind(userId)
        .run();

      if (result.meta.changes === 0) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        };
      }

      // Log admin action
      await this.logAction('DELETE_USER', { userId });

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: {
          code: 'DELETE_USER_FAILED',
          message: 'Failed to delete user',
        },
      };
    }
  }

  /**
   * Update SMTP configuration
   */
  async updateSmtpConfig(config: SmtpConfigUpdate): Promise<ApiResponse> {
    try {
      const existingConfig = await this.getStoredSmtpConfig();
      const nextPassword = config.password?.trim();
      const nextApiKey = config.apiKey?.trim();

      const configForValidation = {
        ...config,
        password: nextPassword || existingConfig?.password,
        apiKey: nextApiKey || existingConfig?.apiKey,
      };

      // Validate config
      const validation = validateSmtpConfig(configForValidation, {
        requirePassword: !existingConfig?.password,
      });
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid SMTP configuration',
            details: validation.errors,
          },
        };
      }

      const encryptedPassword = nextPassword
        ? await encrypt(nextPassword, this.encryptionKey)
        : existingConfig?.password;
      const encryptedApiKey = nextApiKey
        ? await encrypt(nextApiKey, this.encryptionKey)
        : existingConfig?.apiKey;

      // Store in KV
      const configToStore = {
        ...existingConfig,
        ...config,
        password: encryptedPassword,
        apiKey: encryptedApiKey,
      };

      await this.kv.put('smtp_config', JSON.stringify(configToStore));

      // Log admin action
      await this.logAction('UPDATE_SMTP_CONFIG', { host: config.host, port: config.port });

      return {
        success: true,
        message: 'SMTP configuration updated successfully',
      };
    } catch (error) {
      console.error('Update SMTP config error:', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SMTP_FAILED',
          message: 'Failed to update SMTP configuration',
        },
      };
    }
  }

  /**
   * Get SMTP configuration metadata for the admin UI.
   */
  async getSmtpConfig(): Promise<ApiResponse<SmtpConfigSummary>> {
    try {
      const config = await this.getStoredSmtpConfig();
      if (!config) {
        return {
          success: false,
          error: {
            code: 'SMTP_NOT_CONFIGURED',
            message: 'SMTP configuration not found',
          },
        };
      }

      const safeConfig = {
        ...config,
      };
      delete safeConfig.password;
      delete safeConfig.apiKey;

      return {
        success: true,
        data: {
          ...safeConfig,
          hasPassword: Boolean(config.password),
          hasApiKey: Boolean(config.apiKey),
        },
      };
    } catch (error) {
      console.error('Get SMTP config error:', error);
      return {
        success: false,
        error: {
          code: 'GET_SMTP_FAILED',
          message: 'Failed to get SMTP configuration',
        },
      };
    }
  }

  /**
   * Get full SMTP configuration for server-side email sending.
   */
  async getDecryptedSmtpConfig(): Promise<ApiResponse<SmtpConfig>> {
    try {
      const config = await this.getStoredSmtpConfig();
      if (!config) {
        return {
          success: false,
          error: {
            code: 'SMTP_NOT_CONFIGURED',
            message: 'SMTP configuration not found',
          },
        };
      }

      return {
        success: true,
        data: {
          ...config,
          password: (await this.decryptSecret(config.password)) || '',
          apiKey: await this.decryptSecret(config.apiKey),
        },
      };
    } catch (error) {
      console.error('Get decrypted SMTP config error:', error);
      return {
        success: false,
        error: {
          code: 'GET_SMTP_FAILED',
          message: 'Failed to get SMTP configuration',
        },
      };
    }
  }

  /**
   * Get admin action logs
   */
  async getAdminLogs(limit: number = 100): Promise<ApiResponse<AdminLog[]>> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM admin_logs ORDER BY timestamp DESC LIMIT ?')
        .bind(limit)
        .all();

      return {
        success: true,
        data: result.results as AdminLog[],
      };
    } catch (error) {
      console.error('Get admin logs error:', error);
      return {
        success: false,
        error: {
          code: 'GET_LOGS_FAILED',
          message: 'Failed to get admin logs',
        },
      };
    }
  }

  /**
   * Get email send logs
   */
  async getEmailSendLogs(limit: number = 100): Promise<ApiResponse<EmailSendLog[]>> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM email_send_logs ORDER BY created_at DESC LIMIT ?')
        .bind(limit)
        .all();

      return {
        success: true,
        data: result.results as EmailSendLog[],
      };
    } catch (error) {
      console.error('Get email send logs error:', error);
      return {
        success: false,
        error: {
          code: 'GET_EMAIL_LOGS_FAILED',
          message: 'Failed to get email send logs',
        },
      };
    }
  }

  /**
   * Record an email send attempt
   */
  async recordEmailSend(log: EmailSendLogInput): Promise<void> {
    try {
      const logId = crypto.randomUUID();
      const timestamp = Math.floor(Date.now() / 1000);

      await this.db
        .prepare(
          `INSERT INTO email_send_logs (
            id,
            user_id,
            user_email,
            domain_id,
            domain_address,
            email_type,
            trigger_source,
            provider,
            recipient_email,
            subject,
            status,
            error_code,
            error_message,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          logId,
          log.userId || null,
          log.userEmail || null,
          log.domainId || null,
          log.domainAddress || null,
          log.emailType,
          log.triggerSource,
          log.provider,
          log.recipientEmail,
          log.subject,
          log.status,
          log.errorCode || null,
          log.errorMessage || null,
          timestamp
        )
        .run();
    } catch (error) {
      console.error('Record email send error:', error);
    }
  }

  /**
   * Log an admin action
   */
  async logAction(action: string, details?: any): Promise<void> {
    try {
      const logId = crypto.randomUUID();
      const timestamp = Math.floor(Date.now() / 1000);

      await this.db
        .prepare('INSERT INTO admin_logs (id, action, details, timestamp) VALUES (?, ?, ?, ?)')
        .bind(logId, action, details ? JSON.stringify(details) : null, timestamp)
        .run();
    } catch (error) {
      console.error('Log admin action error:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }
}
