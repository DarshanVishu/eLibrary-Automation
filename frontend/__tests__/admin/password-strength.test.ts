import { getPasswordStrength } from '@/components/admin/users/reset-password-modal';
import { describe, expect, it } from 'vitest';

describe('getPasswordStrength', () => {
  it('returns "weak" for short passwords', () => {
    expect(getPasswordStrength('')).toBe('weak');
    expect(getPasswordStrength('abc')).toBe('weak');
    expect(getPasswordStrength('12345')).toBe('weak');
  });

  it('returns "weak" for long but simple passwords', () => {
    expect(getPasswordStrength('abcdefgh')).toBe('weak');
  });

  it('returns "fair" for 8+ char passwords with 2+ traits', () => {
    expect(getPasswordStrength('Abcdefgh')).toBe('fair'); // upper + lower
    expect(getPasswordStrength('abcdefg1')).toBe('fair'); // lower + number
  });

  it('returns "strong" for 10+ char passwords with 3+ traits', () => {
    expect(getPasswordStrength('Abcdefgh1!')).toBe('strong'); // upper + lower + number + special
    expect(getPasswordStrength('HelloWorld1')).toBe('strong'); // upper + lower + number
  });
});
