/**
 * Reminder Service
 * Handles reminder detection and scheduling
 */

import { Domain, ApiResponse } from '../types';
import { getTodayUTC, dateToTimestamp } from '../utils/date';
import { EmailService } from './email';
import { AdminService } from './admin';

export class ReminderService {
  constructor(
    private db: D1Database,
    private kv: KVNamespace,
    private encryptionKey: string
  ) {}

  /**
   * Check all domains and send reminders
   * Called by cron trigger
   */
  async checkReminders(): Promise<ApiResponse<{ sent: number; failed: number }>> {
    try {
      const today = getTodayUTC();
      const todayTimestamp = dateToTimestamp(today);

      // Get domains that need reminders
      const domains = await this.getDomainsNeedingReminder(todayTimestamp);

      console.log(`Found ${domains.length} domains needing reminders`);

      let sent = 0;
      let failed = 0;

      // Get SMTP config
      const adminService = new AdminService(this.db, this.kv, this.encryptionKey);
      const smtpResult = await adminService.getDecryptedSmtpConfig();

      if (!smtpResult.success || !smtpResult.data) {
        console.error('SMTP not configured, cannot send reminders');
        return {
          success: false,
          error: {
            code: 'SMTP_NOT_CONFIGURED',
            message: 'SMTP configuration not found',
          },
        };
      }

      const emailService = new EmailService(smtpResult.data);

      // Send reminders
      for (const domain of domains) {
        const result = await this.sendReminder(domain, emailService);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }

      return {
        success: true,
        data: { sent, failed },
        message: `Sent ${sent} reminders, ${failed} failed`,
      };
    } catch (error) {
      console.error('Check reminders error:', error);
      return {
        success: false,
        error: {
          code: 'CHECK_REMINDERS_FAILED',
          message: 'Failed to check reminders',
        },
      };
    }
  }

  /**
   * Get domains that need reminders today
   */
  private async getDomainsNeedingReminder(todayTimestamp: number): Promise<Domain[]> {
    try {
      const result = await this.db
        .prepare(
          `SELECT * FROM domains
           WHERE reminder_start_date <= ?
           AND reminders_sent < reminder_count
           ORDER BY expiry_date ASC`
        )
        .bind(todayTimestamp)
        .all();

      return result.results as Domain[];
    } catch (error) {
      console.error('Get domains needing reminder error:', error);
      return [];
    }
  }

  /**
   * Send reminder for a specific domain
   */
  private async sendReminder(domain: Domain, emailService: EmailService): Promise<ApiResponse> {
    try {
      // Compose email
      const { subject, body } = emailService.composeReminderEmail(domain);

      // Send email
      const sendResult = await emailService.sendEmail(domain.reminder_email, subject, body);

      if (!sendResult.success) {
        console.error(`Failed to send reminder for domain ${domain.id}:`, sendResult.error);
        return sendResult;
      }

      // Increment reminder sent count
      await this.incrementReminderSent(domain.id);

      console.log(`Reminder sent for domain ${domain.domain_address}`);

      return {
        success: true,
        message: 'Reminder sent successfully',
      };
    } catch (error) {
      console.error('Send reminder error:', error);
      return {
        success: false,
        error: {
          code: 'SEND_REMINDER_FAILED',
          message: 'Failed to send reminder',
        },
      };
    }
  }

  /**
   * Increment reminder sent count for a domain
   */
  private async incrementReminderSent(domainId: string): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      await this.db
        .prepare(
          'UPDATE domains SET reminders_sent = reminders_sent + 1, updated_at = ? WHERE id = ?'
        )
        .bind(now, domainId)
        .run();
    } catch (error) {
      console.error('Increment reminder sent error:', error);
      throw error;
    }
  }
}
