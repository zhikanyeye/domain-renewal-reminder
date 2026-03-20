/**
 * Reminder Service
 * Handles reminder detection and scheduling
 */

import { Domain, ApiResponse, EmailTriggerSource } from '../types';
import { getTodayUTC, dateToTimestamp } from '../utils/date';
import { EmailService } from './email';
import { AdminService } from './admin';

const REMINDER_GRACE_PERIOD_DAYS = 30;

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
  async checkReminders(
    source: Extract<EmailTriggerSource, 'cron' | 'manual'> = 'cron'
  ): Promise<ApiResponse<{ processed: number; sent: number; failed: number; source: 'cron' | 'manual' }>> {
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
      const provider = this.describeProvider(smtpResult.data);

      // Send reminders
      for (const domain of domains) {
        const result = await this.sendReminder(domain, emailService, adminService, provider, source);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }

      return {
        success: true,
        data: {
          processed: domains.length,
          sent,
          failed,
          source,
        },
        message: `Processed ${domains.length} reminders, ${sent} sent, ${failed} failed`,
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
      const gracePeriodStart = todayTimestamp - REMINDER_GRACE_PERIOD_DAYS * 24 * 60 * 60;

      const result = await this.db
        .prepare(
          `SELECT * FROM domains
           WHERE reminder_start_date <= ?
           AND expiry_date >= ?
           AND reminders_sent < reminder_count
           ORDER BY expiry_date ASC`
        )
        .bind(todayTimestamp, gracePeriodStart)
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
  private async sendReminder(
    domain: Domain,
    emailService: EmailService,
    adminService: AdminService,
    provider: string,
    source: Extract<EmailTriggerSource, 'cron' | 'manual'>
  ): Promise<ApiResponse> {
    try {
      // Compose email
      const { subject, htmlBody, textBody } = emailService.composeReminderEmail(domain);

      // Send email
      const sendResult = await emailService.sendEmail(domain.reminder_email, subject, htmlBody, textBody);

      if (!sendResult.success) {
        console.error(`Failed to send reminder for domain ${domain.id}:`, sendResult.error);
        await adminService.recordEmailSend({
          userId: domain.user_id,
          domainId: domain.id,
          domainAddress: domain.domain_address,
          emailType: 'reminder',
          triggerSource: source,
          provider,
          recipientEmail: domain.reminder_email,
          subject,
          status: 'failed',
          errorCode: sendResult.error?.code,
          errorMessage: sendResult.error?.message,
        });
        return sendResult;
      }

      // Increment reminder sent count
      await this.incrementReminderSent(domain.id);

      await adminService.recordEmailSend({
        userId: domain.user_id,
        domainId: domain.id,
        domainAddress: domain.domain_address,
        emailType: 'reminder',
        triggerSource: source,
        provider,
        recipientEmail: domain.reminder_email,
        subject,
        status: 'sent',
      });

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

  private describeProvider(config: { provider: string; apiType?: string; host?: string; port?: number }): string {
    if (config.provider === 'http-api') {
      return `http-api:${config.apiType || 'custom'}`;
    }

    return `smtp:${config.host || 'unknown'}:${config.port || 'unknown'}`;
  }
}
