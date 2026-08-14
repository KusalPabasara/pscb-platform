import { useEffect, useRef, useState } from 'react';

export function DemoPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [lastEvent, setLastEvent] = useState('Waiting for viewer…');

  useEffect(() => {
    const PscbStudy = window.PscbStudy;
    if (!PscbStudy || !hostRef.current) return;
    const viewer = new PscbStudy({
      baseUrl: window.location.origin,
      participantCode: 'DEMO01',
      tracker: 'pointer',
      onEvent: (event) => setLastEvent(event.type),
    });
    viewer.mount(hostRef.current);
    return () => viewer.destroy();
  }, []);

  return (
    <main className="site-shell">
      <nav className="site-nav"><a className="brand" href="/">PSCB <span>Research MVP</span></a><div><a href="/docs">Integration</a><a href="/study">Full page</a></div></nav>
      <section className="demo-heading"><span className="step-label">Same-origin embed demo</span><h1>Study harness inside a host application</h1><p>The demo defaults to pointer mode so it can be reviewed without camera permission. Select a camera tracker in the embedded setup to test the on-device pipeline.</p></section>
      <div className="event-pill">Latest SDK event: <strong>{lastEvent}</strong></div>
      <div ref={hostRef} className="demo-frame-host" />
    </main>
  );
}

declare global {
  interface Window {
    PscbStudy?: new (options: {
      baseUrl: string;
      participantCode?: string;
      tracker?: 'webgazer' | 'mediapipe' | 'pointer';
      accessible?: boolean;
      onEvent?: (event: { type: string; payload: unknown }) => void;
    }) => { mount(target: HTMLElement): void; destroy(): void };
  }
}
