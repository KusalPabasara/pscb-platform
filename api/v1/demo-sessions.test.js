import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifySessionToken } from '../_lib/session-token.js';
import { OPTIONS, POST, PUBLIC_DEMO_API_KEY } from './demo-sessions.js';

const signingSecret = 'demo-test-secret-that-is-long-enough-for-hmac-signing';

describe('public demo viewer sessions', () => {
  beforeEach(() => { process.env.PSCB_SESSION_SECRET = signingSecret; });
  afterEach(() => { delete process.env.PSCB_SESSION_SECRET; });

  it('issues a two-minute token bound to a demo document and browser origin', async () => {
    const response = await POST(request({
      key: PUBLIC_DEMO_API_KEY,
      origin: 'https://boss.example',
      body: { documentId: 'demo-boss-site', allowedOrigin: 'https://boss.example' },
    }));
    expect(response.status).toBe(201);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://boss.example');
    const session = await response.json();
    expect(session).toMatchObject({ mode: 'public-demo', documentId: 'demo-boss-site', allowedOrigin: 'https://boss.example' });
    const claims = verifySessionToken(session.token, signingSecret);
    expect(claims.exp - claims.iat).toBe(120);
  });

  it('rejects an invalid key, non-demo identifier, and origin mismatch', async () => {
    expect((await POST(request({ key: 'wrong-key-value-that-is-long-enough', body: validBody() }))).status).toBe(401);
    expect((await POST(request({ key: PUBLIC_DEMO_API_KEY, body: { ...validBody(), documentId: 'production-page' } }))).status).toBe(400);
    expect((await POST(request({ key: PUBLIC_DEMO_API_KEY, origin: 'https://other.example', body: validBody() }))).status).toBe(403);
  });

  it('supports a restricted CORS preflight', async () => {
    const response = OPTIONS(new Request('https://platform.example/api/v1/demo-sessions', {
      method: 'OPTIONS',
      headers: { Origin: 'http://127.0.0.1:5173' },
    }));
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:5173');
    expect(response.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS');
  });
});

function validBody() {
  return { documentId: 'demo-boss-site', allowedOrigin: 'https://boss.example' };
}

function request({ key, origin, body }) {
  return new Request('https://platform.example/api/v1/demo-sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
  });
}
