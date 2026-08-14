import { bearerMatches, createSessionToken, SessionTokenError } from '../_lib/session-token.js';

export async function POST(request) {
  if (!bearerMatches(request, process.env.PSCB_API_KEY)) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400);
  }

  try {
    const { token, claims } = createSessionToken({
      documentId: body?.documentId,
      allowedOrigin: body?.allowedOrigin,
      ttlSeconds: body?.expiresIn ?? 300,
    }, process.env.PSCB_SESSION_SECRET);
    const baseUrl = new URL(request.url).origin;
    return json({
      object: 'viewer.session',
      version: '1',
      sessionId: claims.sid,
      documentId: claims.documentId,
      allowedOrigin: claims.allowedOrigin,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
      token,
      delivery: {
        sdkUrl: `${baseUrl}/sdk/pscb-viewer.js`,
        viewerUrl: `${baseUrl}/viewer`,
      },
    }, 201);
  } catch (error) {
    if (error instanceof SessionTokenError) return json({ error: error.message }, error.message.includes('configured') ? 503 : 400);
    return json({ error: 'Session creation failed.' }, 500);
  }
}

export function GET() {
  return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
}

function json(body, status, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...extraHeaders },
  });
}
