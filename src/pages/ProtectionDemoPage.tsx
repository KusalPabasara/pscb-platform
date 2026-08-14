import { useEffect, useRef, useState } from 'react';

const DEMO_DOCUMENT = {
  documentId: 'meridian-brief-v1',
  label: 'Acme workspace · confidential',
  title: 'Project Meridian Brief',
  content: `The Meridian planning group met on Thursday to review the autumn launch. The team agreed that the first release would remain limited to invited partners while performance measurements were collected. A revised onboarding flow will be tested with three internal departments before the wider rollout begins.

The operations lead will prepare the readiness checklist and confirm ownership for support, incident response, and customer communication. Finance will review the proposed usage bands, while the product team will deliver the final accessibility audit. The next decision meeting is scheduled after every owner has attached evidence to the shared review packet.`,
};

const embedCode = `<script src="https://YOUR-PROTECTED-HOST/sdk/pscb-viewer.js"></script>
<div id="protected-document"></div>
<script>
  const viewer = new PscbViewer({
    baseUrl: 'https://YOUR-PROTECTED-HOST',
    onEvent: event => console.log(event.type)
  });

  viewer.mount(document.querySelector('#protected-document'));
  viewer.loadDocument({
    documentId: 'brief-1042',
    label: 'Your workspace · confidential',
    title: 'Quarterly strategy',
    content: documentText
  });

  // Clears the currently readable span before an in-app capture/export.
  viewer.clearDisplay();
</script>`;

export function ProtectionDemoPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PscbViewerInstance | null>(null);
  const [lastEvent, setLastEvent] = useState('Connecting viewer…');
  const [accessible, setAccessible] = useState(false);

  useEffect(() => {
    const PscbViewer = window.PscbViewer;
    if (!PscbViewer || !hostRef.current) return;
    const viewer = new PscbViewer({
      baseUrl: window.location.origin,
      minHeight: '650px',
      onEvent: (event) => setLastEvent(event.type),
    });
    viewer.mount(hostRef.current);
    viewer.loadDocument(DEMO_DOCUMENT);
    viewerRef.current = viewer;
    return () => viewer.destroy();
  }, []);

  function clearDisplay() {
    viewerRef.current?.clearDisplay();
  }

  function toggleAccessible() {
    const next = !accessible;
    setAccessible(next);
    viewerRef.current?.setAccessible(next);
  }

  return (
    <main className="protection-demo-shell">
      <nav className="site-nav">
        <a className="brand" href="/">PSCB <span>Integration proof</span></a>
        <div><a href="/docs">API guide</a><a href="/cursor-demo">Cursor demo</a><a className="nav-button" href="/study">Research study</a></div>
      </nav>
      <header className="protection-heading">
        <span className="step-label">Your web app · embedded viewer</span>
        <h1>Change what the captured frame contains.</h1>
        <p>This is a real same-origin SDK integration. Move across the embedded page, then move outside it: the source span is removed while the document shape stays stable.</p>
        <div className="boundary-banner"><strong>Honest boundary</strong><span>Browsers cannot disable operating-system screenshots. This viewer avoids painting the complete source at once.</span></div>
      </header>

      <section className="host-app-card">
        <header><div><span className="host-logo">A</span><span><strong>Acme review portal</strong><small>Private document workspace</small></span></div><span className="host-secure">Protected viewer connected</span></header>
        <div className="host-toolbar">
          <div><span>SDK event</span><strong>{lastEvent}</strong></div>
          <div className="host-actions">
            <button className="secondary-button" onClick={clearDisplay}>Clear displayed source</button>
            <button className="secondary-button" onClick={toggleAccessible}>{accessible ? 'Return to protected view' : 'Accessible full text'}</button>
          </div>
        </div>
        <div ref={hostRef} className="protected-viewer-host" />
      </section>

      <section className="integration-proof-grid">
        <article className="integration-code-card">
          <span className="step-label">Delivery method</span>
          <h2>One script. One isolated frame. A small host API.</h2>
          <p>Your authenticated app supplies the source after the viewer signals readiness. The frame validates the parent origin and emits state events without exporting pointer coordinates.</p>
          <pre><code>{embedCode}</code></pre>
        </article>
        <article className="screenshot-proof-card">
          <span className="step-label">Actual browser screenshot</span>
          <h2>Captured with the source cleared</h2>
          <p>The image below is generated from Chromium after the pointer leaves the document. It contains filler layout—not the source passage.</p>
          <img src="/proof/pscb-capture-proof.png" alt="Browser screenshot showing the embedded document with transformed filler and no source passage visible" />
          <small>When the pointer remains over the document, a screenshot can contain the small current readable span, but not the complete passage.</small>
        </article>
      </section>
    </main>
  );
}

interface PscbViewerInstance {
  mount(target: HTMLElement): void;
  loadDocument(document: typeof DEMO_DOCUMENT): void;
  loadPage(page: import('../components/WebPageSurface').ProtectedWebPage): void;
  clearDisplay(): void;
  setAccessible(enabled: boolean): void;
  destroy(): void;
}

declare global {
  interface Window {
    PscbViewer?: new (options: {
      baseUrl: string;
      sessionToken?: string;
      minHeight?: string;
      accessible?: boolean;
      onEvent?: (event: { type: string; payload: unknown }) => void;
    }) => PscbViewerInstance;
  }
}
