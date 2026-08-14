import { useEffect, useRef, useState } from 'react';
import type { ProtectedWebPage } from '../components/WebPageSurface';

const DEMO_PAGE: ProtectedWebPage = {
  pageId: 'northstar-operations-v1',
  label: 'Northstar private workspace',
  title: 'Operations command center',
  subtitle: 'A structured application screen with sensitive metrics, project activity, customer records, and internal planning content.',
  navigation: ['Overview', 'Projects', 'Customers', 'Reports'],
  blocks: [
    {
      id: 'metrics',
      type: 'metrics',
      items: [
        { label: 'Active accounts', value: '2,418', detail: 'Up 12.4 percent this month' },
        { label: 'Monthly revenue', value: '$184,920', detail: 'Ahead of the private forecast' },
        { label: 'Open incidents', value: '7 critical', detail: 'Two require executive review' },
        { label: 'Renewal exposure', value: '$36,500', detail: 'Five accounts need follow-up' },
      ],
    },
    {
      id: 'growth',
      type: 'chart',
      title: 'Confidential growth trend',
      summary: 'Partner activation increased after the revised enterprise onboarding sequence launched.',
      labels: ['May', 'June', 'July', 'August'],
    },
    {
      id: 'activity',
      type: 'list',
      title: 'Private activity',
      items: [
        { title: 'Helios contract approved', detail: 'Legal review completed today' },
        { title: 'Meridian launch delayed', detail: 'New date pending leadership sign-off' },
        { title: 'Atlas security review', detail: 'Three findings remain open' },
        { title: 'Orchid renewal at risk', detail: 'Owner meeting scheduled tomorrow' },
      ],
    },
    {
      id: 'accounts',
      type: 'table',
      title: 'Strategic account pipeline',
      columns: ['Account', 'Owner', 'Commercial value', 'Private status'],
      rows: [
        ['Helios Systems', 'Maya Chen', '$84,000', 'Final approval'],
        ['Meridian Labs', 'Jon Bell', '$62,500', 'Security review'],
        ['Orchid Health', 'Priya Raman', '$41,200', 'Renewal at risk'],
        ['Atlas Energy', 'Sam Wilson', '$109,000', 'Executive review'],
      ],
    },
    {
      id: 'briefing',
      type: 'callout',
      eyebrow: 'Leadership briefing',
      title: 'Do not distribute the autumn operating plan',
      body: 'The proposed acquisition timeline and revised staffing targets remain confidential until the board review is complete.',
    },
    {
      id: 'media',
      type: 'media',
      title: 'Protected product preview',
      description: 'Sensitive images and rich media use a non-source placeholder in this MVP surface.',
    },
  ],
};

const pageEmbedCode = `<script src="https://YOUR-PROTECTED-HOST/sdk/pscb-viewer.js"></script>
<div id="protected-page"></div>
<script>
  const viewer = new PscbViewer({
    baseUrl: 'https://YOUR-PROTECTED-HOST'
  });

  viewer.mount(document.querySelector('#protected-page'));
  viewer.loadPage({
    pageId: 'operations-1',
    label: 'Private workspace',
    title: 'Operations command center',
    subtitle: 'Sensitive application summary',
    navigation: ['Overview', 'Projects', 'Reports'],
    blocks: [
      { type: 'metrics', id: 'kpis', items: metricData },
      { type: 'table', id: 'accounts', title: 'Accounts',
        columns: ['Account', 'Owner', 'Value', 'Status'], rows: accountRows }
    ]
  });

  // Call before an in-app export or capture flow.
  viewer.clearDisplay();
</script>`;

export function WebPageDemoPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InstanceType<NonNullable<Window['PscbViewer']>> | null>(null);
  const [lastEvent, setLastEvent] = useState('Connecting viewer…');
  const [accessible, setAccessible] = useState(false);

  useEffect(() => {
    const PscbViewer = window.PscbViewer;
    if (!PscbViewer || !hostRef.current) return;
    const viewer = new PscbViewer({
      baseUrl: window.location.origin,
      minHeight: '1180px',
      onEvent: (event) => setLastEvent(event.type),
    });
    viewer.mount(hostRef.current);
    viewer.loadPage(DEMO_PAGE);
    viewerRef.current = viewer;
    return () => viewer.destroy();
  }, []);

  function toggleAccessible() {
    const next = !accessible;
    setAccessible(next);
    viewerRef.current?.setAccessible(next);
  }

  return (
    <main className="protection-demo-shell webpage-demo-shell">
      <nav className="site-nav">
        <a className="brand" href="/">PSCB <span>Whole-page integration</span></a>
        <div><a href="/docs">API guide</a><a href="/protection-demo">Document demo</a><a className="nav-button" href="/study">Research study</a></div>
      </nav>
      <header className="protection-heading">
        <span className="step-label">Your web app · structured protected surface</span>
        <h1>Protect the content of an entire application screen.</h1>
        <p>The embedded surface preserves a familiar dashboard layout while source text appears only in a small pointer-local span. Move outside the viewer and the whole screen returns to transformed filler.</p>
        <div className="boundary-banner"><strong>Honest boundary</strong><span>This does not disable operating-system screenshots. Only content supplied to this protected surface is transformed; ordinary host-page DOM remains capturable.</span></div>
      </header>

      <section className="host-app-card">
        <header><div><span className="host-logo">W</span><span><strong>Customer application shell</strong><small>Structured whole-page content delivery</small></span></div><span className="host-secure">Protected page connected</span></header>
        <div className="host-toolbar">
          <div><span>SDK event</span><strong>{lastEvent}</strong></div>
          <div className="host-actions">
            <button className="secondary-button" onClick={() => viewerRef.current?.clearDisplay()}>Clear entire page</button>
            <button className="secondary-button" onClick={toggleAccessible}>{accessible ? 'Return to protected page' : 'Accessible full page'}</button>
          </div>
        </div>
        <div ref={hostRef} className="protected-viewer-host" />
      </section>

      <section className="integration-proof-grid">
        <article className="integration-code-card">
          <span className="step-label">Delivery method</span>
          <h2>Embed one protected page surface.</h2>
          <p>Your app sends validated JSON blocks through <code>loadPage()</code>. Raw HTML is intentionally unsupported, so scripts and arbitrary markup are never injected into the viewer.</p>
          <pre><code>{pageEmbedCode}</code></pre>
        </article>
        <article className="screenshot-proof-card">
          <span className="step-label">Actual Chromium screenshot</span>
          <h2>Layout remains. Source content does not.</h2>
          <p>This proof is generated after the pointer leaves the whole-page surface. Automated checks count source-rendered words before saving the image.</p>
          <img src="/proof/pscb-webpage-capture-proof.png" alt="Captured protected web application layout containing transformed filler instead of source text" />
          <small>While the pointer is inside, a capture may contain the current small readable span. Images and video use protected placeholders in this MVP.</small>
        </article>
      </section>
    </main>
  );
}
