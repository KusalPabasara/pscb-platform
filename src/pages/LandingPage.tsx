const customerDemoUrl = import.meta.env.VITE_CUSTOMER_DEMO_URL || '/protection-demo';

export function LandingPage() {
  return (
    <main className="site-shell">
      <nav className="site-nav">
        <a className="brand" href="/">PSCB <span>Platform v1</span></a>
        <div><a href="/docs">Integration</a><a href="/capture-research">References</a><a className="nav-button" href={customerDemoUrl}>Customer demo</a></div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <span className="step-label">Open MVP</span>
          <h1>Issue a session. Embed protected content.</h1>
          <p>A server API creates a short-lived viewer token. The customer app loads one SDK and renders the authorized page in an isolated iframe.</p>
          <div className="hero-actions"><a className="primary-link" href={customerDemoUrl}>Open customer demo</a><a className="secondary-link" href="/docs">Read integration</a></div>
        </div>
        <aside className="hero-card">
          <span>Version 1</span>
          <strong>API and iframe delivery</strong>
          <div className="boundary-line"><i />Five-minute signed sessions</div>
          <div className="boundary-line"><i />Exact parent-origin validation</div>
          <div className="boundary-line"><i />Windows Secure Viewer option</div>
        </aside>
      </section>
      <section className="feature-strip">
        <article><span>01</span><h2>Create session</h2><p>The customer server calls <code>POST /api/v1/sessions</code> with its private API key.</p></article>
        <article><span>02</span><h2>Load SDK</h2><p>The browser receives only a short-lived session token and loads <code>PscbViewer</code>.</p></article>
        <article><span>03</span><h2>Render page</h2><p>The iframe validates the token, document identifier, expiry, and parent origin.</p></article>
      </section>
      <section className="honesty-panel">
        <div><span className="step-label">Delivery boundary</span><h2>Web delivery degrades captured content.</h2></div>
        <p>Browser code cannot disable operating-system capture. The Windows Secure Viewer adds the stronger supported native capture boundary.</p>
      </section>
    </main>
  );
}
