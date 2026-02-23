/**
 * Admin Service
 * Handles admin operations like user management and SMTP configuration
 */

import { User, SmtpConfig, ApiResponse, AdminLog } from '../types';
import { validateSmtpConfig } from '../utils/validation';
import { encrypt, decrypt } from '../utils/crypto';

export class AdminService {
  constructor(
    private db: D1Database,
    private kv: KVNamespace,
    private encryptionKey: string
  ) {}

  /**
   * List all users with pagination
   */
  async listUsers(page: number = 1, pageSize: number = 20): Promise<ApiResponse<{
    users: User[];
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

      // Get users
      const result = await this.db
        .prepare(
          `SELECT id, email, is_verified, is_blacklisted, blacklist_reason, created_at, updated_at
           FROM users
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`
        )
        .bind(pageSize, offset)
        .all();

      return {
        success: true,
        data: {
          users: result.results as User[],
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
  async updateSmtpConfig(config: SmtpConfig): Promise<ApiResponse> {
    try {
      // Validate config
      const validation = validateSmtpConfig(config);
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

      // Encrypt password
      const encryptedPassword = await encrypt(config.password, this.encryptionKey);

      // Store in KV
      const configToStore = {
        ...config,
        password: encryptedPassword,
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
   * Get SMTP configuration
   */
  async getSmtpConfig(): Promise<ApiResponse<SmtpConfig>> {
    try {
      const configData = await this.kv.get('smtp_config', 'text');

      if (!configData) {
        return {
          success: false,
          error: {
            code: 'SMTP_NOT_CONFIGURED',
            message: 'SMTP configuration not found',
          },
        };
      }

      const config = JSON.parse(configData);

      // Decrypt password
      const decryptedPassword = await decrypt(config.password, this.encryptionKey);

      return {
        success: true,
        data: {
          ...config,
          password: decryptedPassword,
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
   * Log an admin action
   */
  private async logAction(action: string, details?: any): Promise<void> {
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
