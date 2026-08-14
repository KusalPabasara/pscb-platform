import { useState } from 'react';
import { CaptureGuard } from '../components/CaptureGuard';

const secureClientCode = `<script src="https://YOUR-PLATFORM/sdk/pscb-secure.js"></script>
<button id="secure-open">Open protected workspace</button>
<script>
  document.querySelector('#secure-open').onclick = () => {
    PscbSecure.open({
      url: 'https://customer.example/private/dashboard',
      session: shortLivedSessionToken
    });
  };
</script>`;

export function SecureViewerPage() {
  const secureClient = /PSCB-Secure-Viewer\//.test(navigator.userAgent);
  const [guardActive, setGuardActive] = useState(true);

  return (
    <main className="secure-platform-shell">
      <nav className="site-nav">
        <a className="brand" href="/">PSCB <span>Secure Viewer lab</span></a>
        <div><a href="/capture-research">Research</a><a href="/webpage-demo">Browser fallback</a><a className="nav-button" href="/docs">Integration</a></div>
      </nav>
      <header className="secure-platform-heading">
        <div>
          <span className="step-label">Real webpage · native capture boundary</span>
          <h1>Meaningful on screen. Black in supported capture.</h1>
          <p>The Windows viewer places this real application window above a synchronized black backing window, then asks Windows to exclude the content window from capture.</p>
        </div>
        <aside className={secureClient ? 'secure-runtime-status secure-runtime-status--active' : 'secure-runtime-status'}>
          <span className={secureClient ? 'status-dot status-dot--active' : 'status-dot'} />
          <strong>{secureClient ? 'Native protection active' : 'Ordinary browser mode'}</strong>
          <small>{secureClient ? 'Windows compositor boundary requested' : 'Only the heuristic web guard is available'}</small>
        </aside>
      </header>

      <CaptureGuard active={guardActive}>
        <section className="meaningful-app">
          <header>
            <div><i>N</i><span><strong>Northstar Operations</strong><small>Confidential company workspace</small></span></div>
            <nav><span>Overview</span><span>Accounts</span><span>Projects</span><span>Reports</span></nav>
            <b>MC</b>
          </header>
          <div className="meaningful-app-body">
            <div className="meaningful-title"><div><span>Wednesday, August 12</span><h2>Good morning, Maya.</h2><p>Here is the private operating picture for your leadership review.</p></div><button>Prepare briefing</button></div>
            <section className="meaningful-metrics">
              <article><span>Monthly revenue</span><strong>$184,920</strong><small>12.4% above forecast</small></article>
              <article><span>Active accounts</span><strong>2,418</strong><small>37 added this week</small></article>
              <article><span>Renewal exposure</span><strong>$36,500</strong><small>Five accounts at risk</small></article>
              <article><span>Open incidents</span><strong>7 critical</strong><small>Two need executive review</small></article>
            </section>
            <div className="meaningful-grid">
              <article className="meaningful-chart"><h3>Confidential growth trend</h3><p>Activation increased after the revised onboarding sequence.</p><div>{[45, 61, 54, 73, 64, 86, 72, 91, 78, 96].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></article>
              <article className="meaningful-activity"><h3>Private activity</h3><ul><li><b>Helios contract approved</b><span>Legal review completed today</span></li><li><b>Meridian launch delayed</b><span>Leadership decision required</span></li><li><b>Orchid renewal at risk</b><span>Owner meeting tomorrow</span></li></ul></article>
            </div>
            <article className="meaningful-table"><h3>Strategic account pipeline</h3><div className="meaningful-row meaningful-row--head"><span>Account</span><span>Owner</span><span>Value</span><span>Status</span></div><div className="meaningful-row"><span>Helios Systems</span><span>Maya Chen</span><span>$84,000</span><span>Final approval</span></div><div className="meaningful-row"><span>Meridian Labs</span><span>Jon Bell</span><span>$62,500</span><span>Security review</span></div><div className="meaningful-row"><span>Orchid Health</span><span>Priya Raman</span><span>$41,200</span><span>Renewal at risk</span></div></article>
          </div>
        </section>
      </CaptureGuard>

      <section className="secure-platform-controls">
        <article>
          <span className="step-label">Try the browser signal</span>
          <h2>Capture-aware web guard</h2>
          <p>This leaves the real page readable. Print, PrintScreen-like keyboard signals, lost focus, and host policy can cover it. It is intentionally labeled heuristic because the OS may capture first.</p>
          <div><button className="secondary-button" onClick={() => window.dispatchEvent(new Event('pscb:cover-sensitive-content'))}>Simulate capture signal</button><button className="secondary-button" onClick={() => setGuardActive((value) => !value)}>{guardActive ? 'Disable web guard' : 'Enable web guard'}</button></div>
        </article>
        <article>
          <span className="step-label">Enforceable delivery</span>
          <h2>Open through our secure client</h2>
          <p>The customer app requests a short-lived session, then invokes the protocol handler. Ordinary URLs remain normal; protected URLs are authorized only inside the client.</p>
          <button className="primary-button" onClick={() => window.PscbSecure?.open({ url: `${window.location.origin}/secure-viewer`, session: 'demo-session' })}>Open this page securely</button>
        </article>
      </section>

      <section className="secure-integration-card">
        <div><span className="step-label">Host integration</span><h2>One launch call; unchanged customer UI.</h2><p>The protected page stays ordinary semantic HTML. Production authorization must reject direct-browser access and accept only short-lived viewer sessions.</p></div>
        <pre><code>{secureClientCode}</code></pre>
      </section>
    </main>
  );
}

declare global {
  interface Window {
    PscbSecure?: { open(options: { url: string; session?: string }): void; isSecureViewer(): boolean };
  }
}
