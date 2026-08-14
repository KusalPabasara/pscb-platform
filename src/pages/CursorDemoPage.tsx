import { useMemo, useRef, useState } from 'react';
import { buildWordTokens, revealedWordIds, type WordToken } from '../lib/filler';

const FONT = '20px Georgia, Cambria, serif';
const DEMO_TEXT = `Before sunrise, the station keeper crossed the empty platform and checked the brass clock above the ticket window. The minute hand was running late, though every smaller clock in the office kept perfect time. She opened the wooden case and listened for the faint scrape that appeared whenever the pendulum reached its left edge.

Outside, the first train sounded beyond the hill. The keeper found a paper timetable resting against the case, moved it aside, and heard the mechanism settle into a steady rhythm. By the time passengers reached the platform, the large clock agreed with all the others.`;

export function CursorDemoPage() {
  const tokens = useMemo(() => buildWordTokens(DEMO_TEXT, 'cursor-demo-v1'), []);
  const metrics = useMemo(() => measureTokens(tokens), [tokens]);
  const readerRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [fixationCharacter, setFixationCharacter] = useState(tokens[7]?.start ?? 0);
  const [pointer, setPointer] = useState({ x: 36, y: 24, active: false });
  const [started, setStarted] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [audioState, setAudioState] = useState<'ready' | 'playing' | 'paused' | 'ended'>('ready');
  const revealed = useMemo(
    () => accessible ? new Set(tokens.map((token) => token.id)) : revealedWordIds(tokens, fixationCharacter),
    [accessible, fixationCharacter, tokens],
  );

  function movePointer(event: React.PointerEvent<HTMLElement>) {
    if (!started || accessible) return;
    const token = tokenAtPoint(event.clientX, event.clientY, readerRef.current, tokens);
    if (token) setFixationCharacter(Math.round((token.start + token.end) / 2));
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top, active: true });
  }

  async function startDemo() {
    setStarted(true);
    setAccessible(false);
    try {
      await audioRef.current?.play();
    } catch {
      setAudioState('paused');
    }
  }

  function restart() {
    setStarted(false);
    setAccessible(false);
    setFixationCharacter(tokens[7]?.start ?? 0);
    setPointer({ x: 36, y: 24, active: false });
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioState('ready');
  }

  function toggleNarration() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) void audioRef.current.play();
    else audioRef.current.pause();
  }

  return (
    <main className="cursor-demo-shell">
      <nav className="site-nav cursor-demo-nav">
        <a className="brand" href="/">PSCB <span>Interactive demo</span></a>
        <div><a href="/docs">Delivery</a><a href="/demo">Embed demo</a><a className="nav-button" href="/study">Run study</a></div>
      </nav>

      <header className="cursor-demo-heading">
        <div>
          <span className="step-label">Pointer simulation · no camera</span>
          <h1>Move the cursor. See the displayed page respond.</h1>
          <p>This guided preview uses your pointer as a stand-in for gaze. Pointer positions are transient and are not stored or sent anywhere.</p>
        </div>
        <div className="demo-status" aria-live="polite">
          <span className={`status-dot ${started ? 'status-dot--active' : ''}`} />
          {accessible ? 'Accessible full-text view' : started ? 'Interactive simulation active' : 'Ready to begin'}
        </div>
      </header>

      <section className="cursor-demo-layout">
        <aside className="demo-guide" aria-label="Demo instructions">
          <span className="step-label">How to try it</span>
          <ol>
            <li className={started ? 'complete' : 'current'}><strong>Start the demo</strong><span>Turns on pointer interaction and narration.</span></li>
            <li className={started && !accessible ? 'current' : ''}><strong>Trace each line</strong><span>Move slowly across the prose as if you were reading.</span></li>
            <li className={accessible ? 'current' : ''}><strong>Try the accessible view</strong><span>Reveal stable full text with one control.</span></li>
          </ol>

          {!started ? (
            <button className="primary-button demo-start-button" onClick={startDemo}>Start narrated demo</button>
          ) : (
            <div className="demo-controls">
              <button className="secondary-button" onClick={toggleNarration}>{audioState === 'playing' ? 'Pause voice' : 'Play voice'}</button>
              <button className="secondary-button" onClick={() => setAccessible((value) => !value)}>{accessible ? 'Return to simulation' : 'Show full readable text'}</button>
              <button className="text-button" onClick={restart}>Restart</button>
            </div>
          )}

          <div className="voice-card">
            <span aria-hidden="true">◖))</span>
            <div><strong>Natural voice guide</strong><small>Pre-generated with ElevenLabs · Alice</small></div>
          </div>
          <audio
            ref={audioRef}
            src="/audio/cursor-demo-intro.mp3"
            preload="metadata"
            onPlay={() => setAudioState('playing')}
            onPause={() => setAudioState((state) => state === 'ended' ? state : 'paused')}
            onEnded={() => setAudioState('ended')}
          />
          <details className="voice-transcript">
            <summary>Voice transcript</summary>
            <p>Welcome to the cursor-driven reading demonstration. Select Start demo, then move your cursor slowly across the page and observe how the display responds. The pointer simulates local gaze input and does not use your camera. Select Show full readable text at any time for the accessible view. When you are finished, use Restart to return to the beginning.</p>
          </details>
        </aside>

        <div className="demo-reader-wrap">
          <div className="demo-reader-meta"><span>Demonstration document</span><span>{accessible ? 'Full text' : 'Local readable area'}</span></div>
          <article
            ref={readerRef}
            className={`demo-reader ${started ? 'demo-reader--started' : ''}`}
            onPointerMove={movePointer}
            onPointerLeave={() => setPointer((value) => ({ ...value, active: false }))}
            aria-label={accessible ? 'Demonstration passage, full readable text' : 'Interactive visual demonstration. Use the full readable text control for accessible prose.'}
          >
            {!accessible && <div className={`cursor-halo ${pointer.active ? 'cursor-halo--active' : ''}`} style={{ left: pointer.x, top: pointer.y }} aria-hidden="true"><i /></div>}
            <div className="demo-paper-heading"><span>Field note 07</span><h2>The Station Clock</h2></div>
            <div className="prose demo-prose" aria-hidden={!accessible}>
              {tokens.map((token, index) => {
                const previousEnd = index === 0 ? 0 : tokens[index - 1].end;
                const gap = DEMO_TEXT.slice(previousEnd, token.start);
                const paragraphBreak = /\n\s*\n/.test(gap);
                const showSource = accessible || revealed.has(token.id);
                const metric = metrics[token.id];
                return (
                  <span key={token.id}>
                    {paragraphBreak ? <><br /><br /></> : index > 0 ? ' ' : null}
                    <span
                      className={`word demo-word ${showSource ? 'demo-word--source' : ''}`}
                      data-word-id={token.id}
                      style={{ width: `${metric.width}px`, letterSpacing: `${showSource ? 0 : metric.fillerSpacing}px` }}
                    >{showSource ? token.source : token.filler}</span>
                  </span>
                );
              })}
            </div>
            {!started && <div className="demo-reader-cover"><span>Interactive preview</span><strong>Select “Start narrated demo” to activate the page.</strong></div>}
          </article>
          <div className="capture-note"><span aria-hidden="true">□</span><p><strong>What a screen capture receives:</strong> only the state currently painted in the document area—not a hidden complete visual underneath.</p></div>
        </div>
      </section>
    </main>
  );
}

function measureTokens(tokens: WordToken[]): Array<{ width: number; fillerSpacing: number }> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return tokens.map((token) => ({ width: token.source.length * 10, fillerSpacing: 0 }));
  context.font = FONT;
  return tokens.map((token) => {
    const width = context.measureText(token.source).width;
    const fillerWidth = context.measureText(token.filler).width;
    return { width, fillerSpacing: (width - fillerWidth) / Math.max(1, token.filler.length - 1) };
  });
}

function tokenAtPoint(x: number, y: number, reader: HTMLElement | null, tokens: WordToken[]): WordToken | null {
  if (!reader) return null;
  const direct = document.elementsFromPoint(x, y).find(
    (element) => element instanceof HTMLElement && element.dataset.wordId !== undefined,
  ) as HTMLElement | undefined;
  if (direct) return tokens[Number(direct.dataset.wordId)] ?? null;

  let nearest: WordToken | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const element of reader.querySelectorAll<HTMLElement>('[data-word-id]')) {
    const rect = element.getBoundingClientRect();
    const candidateDistance = Math.hypot(
      Math.max(rect.left - x, 0, x - rect.right),
      Math.max(rect.top - y, 0, y - rect.bottom),
    );
    if (candidateDistance < distance) {
      nearest = tokens[Number(element.dataset.wordId)] ?? nearest;
      distance = candidateDistance;
    }
  }
  return nearest;
}
