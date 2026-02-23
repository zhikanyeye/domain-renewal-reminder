/**
 * Date calculation utilities
 */

/**
 * Calculates expiry date by adding years to registration date
 */
export function calculateExpiryDate(
  registrationDate: Date,
  usagePeriodYears: number
): Date {
  const expiry = new Date(registrationDate);
  expiry.setUTCFullYear(expiry.getUTCFullYear() + usagePeriodYears);
  return expiry;
}

/**
 * Calculates reminder start date by subtracting days from expiry date
 */
export function calculateReminderDate(
  expiryDate: Date,
  reminderDaysOffset: number
): Date {
  const reminder = new Date(expiryDate);
  reminder.setUTCDate(reminder.getUTCDate() - reminderDaysOffset);
  return reminder;
}

/**
 * Calculates days remaining until expiry
 */
export function getDaysUntilExpiry(expiryDate: Date): number {
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Converts Date to Unix timestamp (seconds)
 */
export function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Converts Unix timestamp (seconds) to Date
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Gets current UTC date with time set to 00:00:00
 */
export function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
