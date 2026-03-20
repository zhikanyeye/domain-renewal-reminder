/**
 * Type definitions for Domain Renewal Reminder Service
 */

// User types
export type User = {
  id: string;
  email: string;
  password_hash: string;
  is_verified: number; // SQLite uses INTEGER for boolean (0 or 1)
  is_blacklisted: number; // SQLite uses INTEGER for boolean (0 or 1)
  blacklist_reason?: string;
  created_at: number;
  updated_at: number;
};

// Domain types
export type Domain = {
  id: string;
  user_id: string;
  domain_address: string;
  renewal_url: string;
  registration_date: number;
  usage_period_years: number;
  expiry_date: number;
  reminder_days_offset: number;
  reminder_start_date: number;
  reminder_email: string;
  reminder_count: number;
  reminders_sent: number;
  created_at: number;
  updated_at: number;
};

export type DomainInput = {
  domainAddress: string;
  renewalUrl: string;
  registrationDate: Date;
  usagePeriodYears: number;
  reminderDaysOffset: number;
  reminderEmail: string;
  reminderCount: number;
};

export type DomainFilters = {
  renewalUrl?: string;
  usagePeriodYears?: number;
  reminderCount?: number;
};

// Admin log types
export type AdminLog = {
  id: string;
  action: string;
  details?: string;
  timestamp: number;
};

export type EmailSendType = 'verification' | 'reminder';

export type EmailSendStatus = 'sent' | 'failed';

export type EmailTriggerSource = 'register' | 'resend-verification' | 'cron' | 'manual';

export type EmailSendLog = {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  domain_id?: string | null;
  domain_address?: string | null;
  email_type: EmailSendType;
  trigger_source: EmailTriggerSource;
  provider: string;
  recipient_email: string;
  subject: string;
  status: EmailSendStatus;
  error_code?: string | null;
  error_message?: string | null;
  created_at: number;
};

export type EmailSendLogInput = {
  userId?: string;
  userEmail?: string;
  domainId?: string;
  domainAddress?: string;
  emailType: EmailSendType;
  triggerSource: EmailTriggerSource;
  provider: string;
  recipientEmail: string;
  subject: string;
  status: EmailSendStatus;
  errorCode?: string;
  errorMessage?: string;
};

// Email configuration types
export type EmailProvider = 'http-api' | 'smtp';

export type SmtpConfig = {
  provider: EmailProvider;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  // HTTP API specific fields
  apiType?: 'resend' | 'sendgrid' | 'mailgun' | 'custom';
  apiKey?: string;
  mailgunDomain?: string; // For Mailgun only
};

export type SmtpConfigUpdate = Omit<SmtpConfig, 'password' | 'apiKey'> & {
  password?: string;
  apiKey?: string;
};

export type SmtpConfigSummary = Omit<SmtpConfig, 'password' | 'apiKey'> & {
  hasPassword: boolean;
  hasApiKey: boolean;
};

// API response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
};

// Session types
export type Session = {
  userId: string; // This is stored in KV, not DB, so we can keep camelCase
  createdAt: number;
};

// Verification token types
export type VerificationToken = {
  userId: string;
  email: string;
};
