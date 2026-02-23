/**
 * Input validation utilities
 */

import { DomainInput } from '../types';

/**
 * Validates domain address format
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  // Basic domain regex
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain.trim());
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates domain input for creation/update
 */
export function validateDomainInput(input: Partial<DomainInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.domainAddress || !isValidDomain(input.domainAddress)) {
    errors.push('Invalid domain address');
  }

  if (!input.renewalUrl || !isValidUrl(input.renewalUrl)) {
    errors.push('Invalid renewal URL');
  }

  if (!input.registrationDate || !(input.registrationDate instanceof Date)) {
    errors.push('Invalid registration date');
  }

  if (!input.usagePeriodYears || input.usagePeriodYears < 1 || input.usagePeriodYears > 100) {
    errors.push('Usage period must be between 1 and 100 years');
  }

  if (input.reminderDaysOffset === undefined || input.reminderDaysOffset < 1 || input.reminderDaysOffset > 365) {
    errors.push('Reminder days offset must be between 1 and 365');
  }

  if (!input.reminderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.reminderEmail)) {
    errors.push('Invalid reminder email');
  }

  if (!input.reminderCount || input.reminderCount < 1 || input.reminderCount > 30) {
    errors.push('Reminder count must be between 1 and 30');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates SMTP configuration
 */
export function validateSmtpConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.host || typeof config.host !== 'string') {
    errors.push('SMTP host is required');
  }

  if (!config.port || ![25, 465, 587, 2525].includes(config.port)) {
    errors.push('SMTP port must be 25, 465, 587, or 2525');
  }

  if (!config.username || typeof config.username !== 'string') {
    errors.push('SMTP username is required');
  }

  if (!config.password || typeof config.password !== 'string') {
    errors.push('SMTP password is required');
  }

  if (!config.fromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.fromEmail)) {
    errors.push('Invalid from email');
  }

  if (!config.fromName || typeof config.fromName !== 'string') {
    errors.push('From name is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
