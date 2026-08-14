# PSCB Platform

MVP for signed viewer sessions, iframe delivery, structured protected pages, controlled display clearing, and a Windows secure-viewer prototype.

Demo: https://pscb-study-pss34w32f-kusals-projects-99bd2f7a.vercel.app

The hosted demo currently requires Vercel Team Authentication.

## Setup

Requirements:

- Node.js 22 or newer
- npm

Install and start the web interface:

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173.

To run the API locally:

```bash
cp .env.example .env.local
npm run dev:api
```

Open http://127.0.0.1:3000.

## Environment

```text
PSCB_API_KEY=replace-with-a-random-server-api-key
PSCB_SESSION_SECRET=replace-with-at-least-32-random-characters
```

Keep both values on the server. Never include the production API key in browser code.

## Integration

Create a session from the customer backend:

```js
const response = await fetch(PLATFORM_URL + '/api/v1/sessions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + process.env.PSCB_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: 'dashboard-1',
    allowedOrigin: 'https://customer.example',
    expiresIn: 300
  })
});

const session = await response.json();
```

Mount the viewer in the browser:

```html
<script src="https://YOUR-PLATFORM/sdk/pscb-viewer.js"></script>
<div id="viewer"></div>
<script>
  const viewer = new PscbViewer({
    baseUrl: 'https://YOUR-PLATFORM',
    sessionToken: session.token
  });

  viewer.mount(document.querySelector('#viewer'));
  viewer.loadPage(protectedPage);
</script>
```

The complete customer example is in `examples/customer-demo`.

## Screenshot behavior

The browser API does not guarantee black operating-system screenshots. `clearDisplay()` clears content only for capture or export flows controlled by the host application.

The Windows client in `secure-viewer` uses native content protection for supported Windows capture paths. Test the supplied Windows capture matrix before making deployment claims. Physical cameras and compromised devices remain outside the boundary.

## Verify

```bash
npm run check
```

This runs the API and rendering tests, native-viewer policy tests, TypeScript checks, and production build.

## Deploy

```bash
npx vercel
```

Configure `PSCB_API_KEY` and `PSCB_SESSION_SECRET` as encrypted Vercel environment variables before using the production session endpoint.

See `openapi.yaml` for the API contract and `SECURITY.md` for vulnerability reporting.
