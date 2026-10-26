import { getFriendlyError } from '@/lib/utils';
import { describe, expect, it } from 'vitest';

// ─── getFriendlyError ────────────────────────────────────────────────────────
describe('getFriendlyError', () => {
  it('returns connection error message for network failures', () => {
    const result = getFriendlyError('fetch failed');
    expect(result).toContain('Unable to reach the server');
  });

  it('returns connection error message for timeout', () => {
    const result = getFriendlyError('ETIMEDOUT');
    expect(result).toContain('Unable to reach the server');
  });

  it('returns credentials message for invalid login', () => {
    const result = getFriendlyError('Invalid login credentials');
    expect(result).toContain('Incorrect email or password');
  });

  it('returns confirmation message for unverified email', () => {
    const result = getFriendlyError('Email not confirmed');
    expect(result).toContain('email address has not been confirmed');
  });

  it('returns not-found message for user not found', () => {
    const result = getFriendlyError('user not found');
    expect(result).toContain('No account found');
  });

  it('returns not-found message for 404 status', () => {
    const result = getFriendlyError('some error', 404);
    expect(result).toContain('No account found');
  });

  it('returns rate-limit message for too many requests', () => {
    const result = getFriendlyError('too many requests');
    expect(result).toContain('Too many login attempts');
  });

  it('returns rate-limit message for 429 status', () => {
    const result = getFriendlyError('error', 429);
    expect(result).toContain('Too many login attempts');
  });

  it('returns email validation message for invalid email', () => {
    const result = getFriendlyError('email is invalid');
    expect(result).toContain('valid email address');
  });

  it('returns password message for short password', () => {
    const result = getFriendlyError('password too short');
    expect(result).toContain('too short');
  });

  it('returns disabled account message', () => {
    const result = getFriendlyError('account has been disabled');
    expect(result).toContain('account has been disabled');
  });

  it('returns generic fallback for unknown errors', () => {
    const result = getFriendlyError('something completely unexpected happened');
    expect(result).toContain('Sign in failed');
  });
});
