import { normalizeOrigin, SessionTokenError, verifySessionToken } from '../_lib/session-token.js';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ authorized: false, error: 'Request body must be JSON.' }, 400);
  }

  try {
    const claims = verifySessionToken(body?.token, process.env.PSCB_SESSION_SECRET);
    const parentOrigin = normalizeOrigin(body?.parentOrigin);
    if (claims.allowedOrigin !== parentOrigin) {
      return json({ authorized: false, error: 'Parent origin is not authorized.' }, 403);
    }
    return json({
      authorized: true,
      sessionId: claims.sid,
      documentId: claims.documentId,
      allowedOrigin: claims.allowedOrigin,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    }, 200);
  } catch (error) {
    if (error instanceof SessionTokenError) return json({ authorized: false, error: error.message }, error.message.includes('configured') ? 503 : 401);
    return json({ authorized: false, error: 'Session validation failed.' }, 500);
  }
}

export function GET() {
  return json({ authorized: false, error: 'Method not allowed.' }, 405, { Allow: 'POST' });
}

function json(body, status, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...extraHeaders },
  });
}
