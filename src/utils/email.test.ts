/**
 * Email validation utility tests
 */

import { describe, it, expect } from 'vitest';
import { isEmailDomainAllowed, ALLOWED_EMAIL_DOMAINS } from './email';

describe('Email Domain Validation', () => {
  describe('Unit Tests', () => {
    it('should accept Gmail addresses', () => {
      expect(isEmailDomainAllowed('user@gmail.com')).toBe(true);
      expect(isEmailDomainAllowed('test.user@gmail.com')).toBe(true);
    });

    it('should accept Outlook addresses', () => {
      expect(isEmailDomainAllowed('user@outlook.com')).toBe(true);
      expect(isEmailDomainAllowed('user@hotmail.com')).toBe(true);
    });

    it('should accept Yahoo addresses', () => {
      expect(isEmailDomainAllowed('user@yahoo.com')).toBe(true);
    });

    it('should accept iCloud addresses', () => {
      expect(isEmailDomainAllowed('user@icloud.com')).toBe(true);
    });

    it('should accept Chinese email providers', () => {
      expect(isEmailDomainAllowed('user@qq.com')).toBe(true);
      expect(isEmailDomainAllowed('user@163.com')).toBe(true);
      expect(isEmailDomainAllowed('user@126.com')).toBe(true);
      expect(isEmailDomainAllowed('user@sina.com')).toBe(true);
      expect(isEmailDomainAllowed('user@sina.cn')).toBe(true);
    });

    it('should accept Proton Mail addresses', () => {
      expect(isEmailDomainAllowed('user@proton.me')).toBe(true);
      expect(isEmailDomainAllowed('user@protonmail.com')).toBe(true);
    });

    it('should accept other mainstream providers', () => {
      expect(isEmailDomainAllowed('user@zoho.com')).toBe(true);
      expect(isEmailDomainAllowed('user@yandex.com')).toBe(true);
      expect(isEmailDomainAllowed('user@gmx.com')).toBe(true);
      expect(isEmailDomainAllowed('user@aol.com')).toBe(true);
      expect(isEmailDomainAllowed('user@mail.com')).toBe(true);
    });

    it('should reject non-whitelisted domains', () => {
      expect(isEmailDomainAllowed('user@example.com')).toBe(false);
      expect(isEmailDomainAllowed('user@test.org')).toBe(false);
      expect(isEmailDomainAllowed('user@mydomain.net')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isEmailDomainAllowed('user@GMAIL.COM')).toBe(true);
      expect(isEmailDomainAllowed('user@Gmail.Com')).toBe(true);
      expect(isEmailDomainAllowed('user@OUTLOOK.COM')).toBe(true);
    });

    it('should handle invalid email formats gracefully', () => {
      expect(isEmailDomainAllowed('')).toBe(false);
      expect(isEmailDomainAllowed('notanemail')).toBe(false);
      expect(isEmailDomainAllowed('@gmail.com')).toBe(false);
      expect(isEmailDomainAllowed('user@')).toBe(false);
    });

    it('should support at least 15 email providers', () => {
      expect(ALLOWED_EMAIL_DOMAINS.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Edge Cases', () => {
    it('should handle emails with multiple dots', () => {
      expect(isEmailDomainAllowed('first.last.name@gmail.com')).toBe(true);
    });

    it('should handle emails with plus signs', () => {
      expect(isEmailDomainAllowed('user+tag@gmail.com')).toBe(true);
    });

    it('should handle emails with numbers', () => {
      expect(isEmailDomainAllowed('user123@gmail.com')).toBe(true);
    });

    it('should reject emails with spaces', () => {
      expect(isEmailDomainAllowed('user @gmail.com')).toBe(false);
      expect(isEmailDomainAllowed('user@ gmail.com')).toBe(false);
    });

    it('should reject emails with multiple @ symbols', () => {
      expect(isEmailDomainAllowed('user@@gmail.com')).toBe(false);
      expect(isEmailDomainAllowed('user@test@gmail.com')).toBe(false);
    });
  });
});
