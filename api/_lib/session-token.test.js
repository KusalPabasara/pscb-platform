import { describe, expect, it } from 'vitest';
import { createSessionToken, normalizeOrigin, verifySessionToken } from './session-token.js';

const secret = 'test-secret-that-is-long-enough-for-hmac-signing';

describe('viewer session tokens', () => {
  it('round trips bounded claims', () => {
    const issued = createSessionToken({ documentId: 'dashboard-1', allowedOrigin: 'https://customer.example', ttlSeconds: 300 }, secret, 1_000);
    expect(verifySessionToken(issued.token, secret, 1_001)).toMatchObject({
      documentId: 'dashboard-1',
      allowedOrigin: 'https://customer.example',
      iat: 1_000,
      exp: 1_300,
    });
  });

  it('rejects expiry and modification', () => {
    const issued = createSessionToken({ documentId: 'brief-1', allowedOrigin: 'https://customer.example', ttlSeconds: 60 }, secret, 2_000);
    expect(() => verifySessionToken(issued.token, secret, 2_061)).toThrow('expired');
    expect(() => verifySessionToken(`${issued.token}x`, secret, 2_001)).toThrow('Invalid session token');
  });

  it('accepts local HTTP but requires HTTPS elsewhere', () => {
    expect(normalizeOrigin('http://127.0.0.1:4174')).toBe('http://127.0.0.1:4174');
    expect(() => normalizeOrigin('http://customer.example')).toThrow('HTTPS');
    expect(() => normalizeOrigin('https://customer.example/path')).toThrow('origin');
  });
});
