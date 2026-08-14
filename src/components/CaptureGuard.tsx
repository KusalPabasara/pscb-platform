import { useEffect, useState, type ReactNode } from 'react';

type GuardReason = 'host-policy' | 'print' | 'print-screen' | 'visibility' | 'window-blur';

export function CaptureGuard({ children, active = true }: { children: ReactNode; active?: boolean }) {
  const [reason, setReason] = useState<GuardReason | null>(null);

  useEffect(() => {
    if (!active) {
      setReason(null);
      return;
    }
    const cover = (nextReason: GuardReason) => {
      setReason(nextReason);
      window.dispatchEvent(new CustomEvent('pscb:capture-guard', { detail: { reason: nextReason } }));
    };
    const keydown = (event: KeyboardEvent) => {
      const screenshotChord = event.key === 'PrintScreen'
        || ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 's');
      if (!screenshotChord) return;
      event.preventDefault();
      cover('print-screen');
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') cover('visibility');
    };
    const blur = () => cover('window-blur');
    const beforePrint = () => cover('print');
    const hostPolicy = () => cover('host-policy');
    window.addEventListener('keydown', keydown, true);
    window.addEventListener('blur', blur);
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('pscb:cover-sensitive-content', hostPolicy);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('keydown', keydown, true);
      window.removeEventListener('blur', blur);
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('pscb:cover-sensitive-content', hostPolicy);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [active]);

  return (
    <section className="capture-guard" data-pscb-sensitive="true">
      {children}
      {reason ? (
        <div className="capture-guard-cover" role="alert" aria-live="assertive">
          <span>PSCB protected surface</span>
          <strong>Sensitive content covered</strong>
          <p>The browser observed a capture-related signal. This web guard is a deterrence layer; supported blank capture is enforced by the Windows Secure Viewer.</p>
          <button type="button" onClick={() => setReason(null)}>Return to content</button>
        </div>
      ) : null}
    </section>
  );
}
