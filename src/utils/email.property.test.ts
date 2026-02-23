/**
 * Property-Based Tests for Email Domain Validation
 * Feature: domain-renewal-reminder, Property 1: Email Domain Whitelist Validation
 * 
 * Validates: Requirements 1.1, 1.2
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { isEmailDomainAllowed, ALLOWED_EMAIL_DOMAINS } from './email';

describe('Property-Based Tests: Email Domain Validation', () => {
  it('Property 1: Email Domain Whitelist Validation - whitelisted domains should always be accepted', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_EMAIL_DOMAINS),
        fc.stringMatching(/^[a-zA-Z0-9._+-]+$/),
        (domain, localPart) => {
          const email = `${localPart}@${domain}`;
          return isEmailDomainAllowed(email) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Email Domain Whitelist Validation - non-whitelisted domains should always be rejected', () => {
    // Generate random domains that are NOT in the whitelist
    const nonWhitelistedDomain = fc.domain().filter(
      domain => !ALLOWED_EMAIL_DOMAINS.includes(domain.toLowerCase() as any)
    );

    fc.assert(
      fc.property(
        nonWhitelistedDomain,
        fc.stringMatching(/^[a-zA-Z0-9._+-]+$/),
        (domain, localPart) => {
          const email = `${localPart}@${domain}`;
          return isEmailDomainAllowed(email) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Email Domain Whitelist Validation - case insensitivity', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_EMAIL_DOMAINS),
        fc.stringMatching(/^[a-zA-Z0-9._+-]+$/),
        fc.constantFrom('lower', 'upper', 'mixed'),
        (domain, localPart, caseType) => {
          let transformedDomain: string = domain;
          if (caseType === 'upper') {
            transformedDomain = domain.toUpperCase();
          } else if (caseType === 'mixed') {
            transformedDomain = domain
              .split('')
              .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
              .join('');
          }
          
          const email = `${localPart}@${transformedDomain}`;
          return isEmailDomainAllowed(email) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: Email Domain Whitelist Validation - invalid email formats should be rejected', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('notanemail'),
          fc.string().filter(s => !s.includes('@')),
          fc.string().map(s => `@${s}`),
          fc.string().map(s => `${s}@`)
        ),
        (invalidEmail) => {
          return isEmailDomainAllowed(invalidEmail) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
