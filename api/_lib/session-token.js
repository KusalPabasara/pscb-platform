import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 'v1';
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 900;

export function createSessionToken({ documentId, allowedOrigin, ttlSeconds = 300 }, secret, nowSeconds = unixTime()) {
  requireSecret(secret);
  const origin = normalizeOrigin(allowedOrigin);
  const id = cleanDocumentId(documentId);
  const ttl = Number(ttlSeconds);
  if (!Number.isInteger(ttl) || ttl < MIN_TTL_SECONDS || ttl > MAX_TTL_SECONDS) {
    throw new SessionTokenError('expiresIn must be an integer from 60 to 900 seconds.');
  }

  const claims = {
    v: 1,
    sid: randomUUID(),
    documentId: id,
    allowedOrigin: origin,
    iat: nowSeconds,
    exp: nowSeconds + ttl,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const unsigned = `${TOKEN_VERSION}.${payload}`;
  return {
    token: `${unsigned}.${signature(unsigned, secret)}`,
    claims,
  };
}

export function verifySessionToken(token, secret, nowSeconds = unixTime()) {
  requireSecret(secret);
  if (typeof token !== 'string' || token.length > 4096) throw new SessionTokenError('Invalid session token.');
  const [version, payload, suppliedSignature, extra] = token.split('.');
  if (version !== TOKEN_VERSION || !payload || !suppliedSignature || extra) throw new SessionTokenError('Invalid session token.');

  const unsigned = `${version}.${payload}`;
  const expected = signature(unsigned, secret);
  const suppliedBytes = Buffer.from(suppliedSignature);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    throw new SessionTokenError('Invalid session token.');
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new SessionTokenError('Invalid session token.');
  }
  if (!claims || claims.v !== 1 || typeof claims.sid !== 'string' || typeof claims.documentId !== 'string') {
    throw new SessionTokenError('Invalid session token.');
  }
  claims.allowedOrigin = normalizeOrigin(claims.allowedOrigin);
  if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp) || claims.exp <= nowSeconds) {
    throw new SessionTokenError('Session token expired.');
  }
  if (claims.iat > nowSeconds + 30 || claims.exp - claims.iat > MAX_TTL_SECONDS) {
    throw new SessionTokenError('Invalid session token lifetime.');
  }
  return claims;
}

export function normalizeOrigin(value) {
  if (typeof value !== 'string' || value.length > 500) throw new SessionTokenError('allowedOrigin must be an HTTP or HTTPS origin.');
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new SessionTokenError('allowedOrigin must be an HTTP or HTTPS origin.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new SessionTokenError('allowedOrigin must be an HTTP or HTTPS origin.');
  }
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new SessionTokenError('allowedOrigin must use HTTPS outside local development.');
  }
  return url.origin;
}

export function bearerMatches(request, expected) {
  if (typeof expected !== 'string' || expected.length < 24) return false;
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const wanted = Buffer.from(expected);
  return supplied.length === wanted.length && timingSafeEqual(supplied, wanted);
}

export class SessionTokenError extends Error {}

function cleanDocumentId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(value)) {
    throw new SessionTokenError('documentId must contain 1 to 120 safe identifier characters.');
  }
  return value;
}

function signature(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function requireSecret(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new SessionTokenError('Session signing is not configured.');
}

function unixTime() {
  return Math.floor(Date.now() / 1000);
}
