export function CaptureResearchPage() {
  return (
    <main className="site-shell docs-shell">
      <nav className="site-nav"><a className="brand" href="/">PSCB <span>Capture research</span></a><div><a href="/secure-viewer">Secure Viewer</a><a href="/webpage-demo">Browser fallback</a><a className="nav-button" href="/docs">Delivery guide</a></div></nav>
      <header className="docs-heading"><span className="step-label">Research conclusion</span><h1>The layer must sit above the browser content boundary.</h1><p>DOM overlays are useful for friction and future browser hints. A blank capture requires a native window, managed browser, mobile secure surface, or DRM-protected media path.</p></header>
      <section className="capture-research-grid">
        <article><span>Rejected</span><h2>CSS, canvas or WebGL overlay</h2><p>The viewer and screenshot receive the same composed pixels. There is no reliable browser event before an OS screenshot.</p></article>
        <article><span>Deterrence</span><h2>Capture-signal web guard</h2><p>Cover on keyboard, focus, visibility and print signals. Useful against accidents, but removable and subject to timing races.</p></article>
        <article className="capture-research-selected"><span>Selected</span><h2>Protected native content window</h2><p>Show real HTML in a capture-excluded window with a synchronized black backing surface beneath it.</p></article>
        <article><span>Enterprise</span><h2>Managed Chrome or Edge</h2><p>Organizations can enforce capture policy at the managed browser/device layer for selected URLs.</p></article>
        <article><span>Second line</span><h2>Session watermarking</h2><p>Visible or resilient identity marks provide attribution for cameras and unsupported capture paths.</p></article>
        <article><span>Not suitable</span><h2>Temporal visual persistence</h2><p>Modulated shares create health/accessibility risk and recordings can reconstruct the source. This project does not use flicker.</p></article>
      </section>
      <section className="research-source-note"><h2>Source review</h2><p>The detailed review covers ResearchGate papers, W3C work, official operating-system APIs, GitHub implementations, Medium experiments, and adversarial Reddit discussions.</p><a className="primary-link" href="https://www.w3.org/2024/Talks/TPAC/breakouts/capture-prevention.pdf" target="_blank" rel="noreferrer">Open W3C proposal</a><a className="secondary-link" href="/docs">Read implementation guide</a></section>
    </main>
  );
}
