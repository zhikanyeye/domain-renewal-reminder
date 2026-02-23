/**
 * Email validation utilities
 */

// Whitelist of allowed email providers (15+ mainstream providers)
export const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'sina.cn',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'yandex.ru',
  'gmx.com',
  'gmx.net',
  'aol.com',
  'mail.com',
] as const;

/**
 * Validates if an email domain is in the whitelist
 */
export function isEmailDomainAllowed(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailLower = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(emailLower)) {
    return false;
  }

  const domain = emailLower.split('@')[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain as any);
}

/**
 * Validates email format
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase().trim());
}
