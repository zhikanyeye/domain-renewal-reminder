/**
 * Type definitions for Domain Renewal Reminder Service
 */

// User types
export type User = {
  id: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  createdAt: number;
  updatedAt: number;
};

// Domain types
export type Domain = {
  id: string;
  userId: string;
  domainAddress: string;
  renewalUrl: string;
  registrationDate: number;
  usagePeriodYears: number;
  expiryDate: number;
  reminderDaysOffset: number;
  reminderStartDate: number;
  reminderEmail: string;
  reminderCount: number;
  remindersSent: number;
  createdAt: number;
  updatedAt: number;
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

// SMTP configuration types
export type SmtpConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
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
  userId: string;
  createdAt: number;
};

// Verification token types
export type VerificationToken = {
  userId: string;
  email: string;
};
