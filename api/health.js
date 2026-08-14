export function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'pscb-study-mvp',
      version: '1.0.1',
      storage: 'derived-results-remain-client-side',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export function POST() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'GET' } });
}
