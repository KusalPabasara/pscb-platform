import { bearerMatches, createSessionToken, normalizeOrigin, SessionTokenError } from '../_lib/session-token.js';

export const PUBLIC_DEMO_API_KEY = 'pscb_demo_v1_boss_preview_4f7c9a2d';
const DEMO_TTL_SECONDS = 120;

export async function POST(request) {
  const requestOrigin = safeOrigin(request.headers.get('origin'));
  if (!bearerMatches(request, PUBLIC_DEMO_API_KEY)) {
    return json({ error: 'Invalid public demo key.' }, 401, requestOrigin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400, requestOrigin);
  }

  try {
    const allowedOrigin = normalizeOrigin(body?.allowedOrigin);
    if (requestOrigin && requestOrigin !== allowedOrigin) {
      return json({ error: 'allowedOrigin must match the requesting browser origin.' }, 403, requestOrigin);
    }
    if (typeof body?.documentId !== 'string' || !body.documentId.startsWith('demo-')) {
      return json({ error: 'Public demo documentId must start with demo-.' }, 400, requestOrigin);
    }
    const { token, claims } = createSessionToken({
      documentId: body.documentId,
      allowedOrigin,
      ttlSeconds: DEMO_TTL_SECONDS,
    }, process.env.PSCB_SESSION_SECRET);
    const baseUrl = new URL(request.url).origin;
    return json({
      object: 'viewer.session',
      version: '1',
      mode: 'public-demo',
      sessionId: claims.sid,
      documentId: claims.documentId,
      allowedOrigin: claims.allowedOrigin,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
      token,
      delivery: {
        sdkUrl: `${baseUrl}/sdk/pscb-viewer.js`,
        viewerUrl: `${baseUrl}/viewer`,
      },
      warning: 'Demo credential only. Do not use it for production authorization.',
    }, 201, requestOrigin);
  } catch (error) {
    if (error instanceof SessionTokenError) return json({ error: error.message }, error.message.includes('configured') ? 503 : 400, requestOrigin);
    return json({ error: 'Demo session creation failed.' }, 500, requestOrigin);
  }
}

export function OPTIONS(request) {
  const requestOrigin = safeOrigin(request.headers.get('origin'));
  if (!requestOrigin) return json({ error: 'A valid browser origin is required.' }, 400, null);
  return new Response(null, {
    status: 204,
    headers: corsHeaders(requestOrigin, {
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '600',
    }),
  });
}

export function GET(request) {
  return json({ error: 'Method not allowed.' }, 405, safeOrigin(request.headers.get('origin')), { Allow: 'POST, OPTIONS' });
}

function safeOrigin(value) {
  if (!value) return null;
  try {
    return normalizeOrigin(value);
  } catch {
    return null;
  }
}

function json(body, status, origin, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: corsHeaders(origin, { 'Cache-Control': 'no-store', ...extraHeaders }),
  });
}

function corsHeaders(origin, headers) {
  return {
    ...headers,
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
  };
}
