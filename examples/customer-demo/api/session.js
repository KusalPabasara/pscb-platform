export async function POST(request) {
  const platformUrl = cleanPlatformUrl(process.env.PSCB_PLATFORM_URL);
  const apiKey = process.env.PSCB_API_KEY;
  if (!platformUrl || !apiKey) return json({ error: 'Customer server integration is not configured.' }, 503);

  const allowedOrigin = new URL(request.url).origin;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (process.env.PSCB_PLATFORM_BYPASS) headers['x-vercel-protection-bypass'] = process.env.PSCB_PLATFORM_BYPASS;
  if (process.env.VERCEL_OIDC_TOKEN) headers['x-vercel-trusted-oidc-idp-token'] = process.env.VERCEL_OIDC_TOKEN;

  try {
    const response = await fetch(`${platformUrl}/api/v1/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ documentId: 'northstar-dashboard-v1', allowedOrigin, expiresIn: 300 }),
    });
    const result = await response.json();
    if (!response.ok) return json({ error: result.error || 'Platform session request failed.' }, response.status);
    return json(result, 201);
  } catch {
    return json({ error: 'Platform session request failed.' }, 502);
  }
}

export function GET() {
  return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
}

function cleanPlatformUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function json(body, status, extraHeaders = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extraHeaders } });
}
