const sessionCode = `const response = await fetch('https://YOUR-PLATFORM/api/v1/sessions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + process.env.PSCB_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: 'brief-1042',
    allowedOrigin: 'https://customer.example',
    expiresIn: 300
  })
});
const session = await response.json();`;

const publicDemoCode = `const PLATFORM = 'https://YOUR-PROTECTED-PLATFORM';
const DEMO_KEY = 'pscb_demo_v1_boss_preview_4f7c9a2d';

const response = await fetch(PLATFORM + '/api/v1/demo-sessions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + DEMO_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: 'demo-boss-site',
    allowedOrigin: window.location.origin
  })
});
const session = await response.json();`;

const viewerCode = `<script src="https://YOUR-PROTECTED-HOST/sdk/pscb-viewer.js"></script>
<div id="protected-document"></div>
<script>
  const viewer = new PscbViewer({
    baseUrl: 'https://YOUR-PROTECTED-HOST',
    sessionToken: session.token,
    onEvent(event) {
      console.log(event.type);
    },
  });

  viewer.mount(document.querySelector('#protected-document'));
  viewer.loadDocument({
    documentId: 'brief-1042',
    label: 'Your workspace · confidential',
    title: 'Quarterly strategy',
    content: documentText,
  });

  // Use before an in-app capture or export operation.
  viewer.clearDisplay();
</script>`;

const webpageCode = `<script src="https://YOUR-PROTECTED-HOST/sdk/pscb-viewer.js"></script>
<div id="protected-page"></div>
<script>
  const viewer = new PscbViewer({
    baseUrl: 'https://YOUR-PROTECTED-HOST',
    sessionToken: session.token
  });
  viewer.mount(document.querySelector('#protected-page'));
  viewer.loadPage({
    pageId: 'dashboard-1',
    label: 'Private workspace',
    title: 'Operations dashboard',
    subtitle: 'Sensitive application summary',
    navigation: ['Overview', 'Accounts', 'Reports'],
    blocks: [
      { id: 'kpis', type: 'metrics', items: metricData },
      { id: 'pipeline', type: 'table', title: 'Pipeline',
        columns: ['Account', 'Owner', 'Value', 'Status'], rows: accountRows }
    ]
  });
</script>`;

const secureViewerCode = `<script src="https://YOUR-PLATFORM/sdk/pscb-secure.js"></script>
<button id="open-protected">Open protected workspace</button>
<script>
  document.querySelector('#open-protected').onclick = () => {
    PscbSecure.open({
      url: 'https://customer.example/private/dashboard',
      session: shortLivedViewerSession
    });
  };
</script>`;

export function DocsPage() {
  return (
    <main className="site-shell docs-shell">
      <nav className="site-nav"><a className="brand" href="/">PSCB <span>Platform v1</span></a><div><a href="/secure-viewer">Secure Viewer</a><a href="/capture-research">References</a><a className="nav-button" href="/protection-demo">Embed demo</a></div></nav>
      <header className="docs-heading"><span className="step-label">Integration</span><h1>Create a session, then load one SDK.</h1><p>The customer server keeps the API key. The browser receives only a short-lived viewer token.</p></header>
      <section className="docs-grid">
        <aside><a href="#session">Session API</a><a href="#public-demo">Public demo key</a><a href="#viewer">Embed SDK</a><a href="#secure-client">Secure Viewer</a><a href="#webpage">Page schema</a><a href="#hosting">Hosting</a></aside>
        <div className="docs-content">
          <article id="session"><h2>1. Create a viewer session</h2><p>Call the API from the customer server. Keep <code>PSCB_API_KEY</code> outside browser code.</p><CodeBlock code={sessionCode} /></article>
          <article id="public-demo"><h2>Public evaluation key</h2><p>For an access-approved boss demo only. It creates two-minute sessions, requires a <code>demo-</code> document identifier, and binds browser calls to their exact origin. Never use it for production authorization.</p><CodeBlock code={publicDemoCode} /></article>
          <article id="viewer"><h2>2. Embed the viewer</h2><p>Pass the returned token to <code>PscbViewer</code>. The iframe checks expiry, document identifier, and exact parent origin.</p><CodeBlock code={viewerCode} /></article>
          <article id="secure-client"><h2>3. Windows Secure Viewer</h2><p>Use the native viewer when supported Windows capture exclusion is required. Cameras and compromised endpoints remain outside the boundary.</p><CodeBlock code={secureViewerCode} /></article>
          <article id="webpage"><h2>4. Structured page schema</h2><p><code>loadPage()</code> accepts navigation, metrics, charts, lists, tables, callouts, and protected media placeholders. Raw HTML is rejected.</p><CodeBlock code={webpageCode} /></article>
          <article id="hosting"><h2>5. Hosting</h2><p>Vercel hosts the API, SDK, and iframe. Enable Vercel Authentication when a deployment should be limited to approved team members.</p></article>
        </div>
      </section>
    </main>
  );
}

function CodeBlock({ code }: { code: string }) {
  return <pre><code>{code}</code></pre>;
}
