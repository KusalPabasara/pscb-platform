import { useEffect, useMemo, useRef, useState } from 'react';
import { buildWordTokens, revealedWordIds, type WordToken } from '../lib/filler';
import { WebPageSurface, type ProtectedPageBlock, type ProtectedWebPage } from '../components/WebPageSurface';

const FONT = '20px Georgia, Cambria, serif';
const MAX_CONTENT_LENGTH = 150_000;

interface ViewerDocument {
  documentId: string;
  label: string;
  title: string;
  content: string;
}

interface SessionAuthorization {
  documentId: string | null;
  sessionId: string;
}

export function ViewerPage() {
  const [document, setDocument] = useState<ViewerDocument | null>(null);
  const [webPage, setWebPage] = useState<ProtectedWebPage | null>(null);
  const [fixationCharacter, setFixationCharacter] = useState<number | null>(null);
  const [accessible, setAccessible] = useState(false);
  const [clearSignal, setClearSignal] = useState(0);
  const [pageSpanActive, setPageSpanActive] = useState(false);
  const [authorizationState, setAuthorizationState] = useState<'waiting' | 'checking' | 'authorized' | 'denied'>('waiting');
  const [authorizationError, setAuthorizationError] = useState('');
  const readerRef = useRef<HTMLElement>(null);
  const parentOrigin = useMemo(resolveParentOrigin, []);
  const tokens = useMemo(
    () => document ? buildWordTokens(document.content, `viewer:${document.documentId}`) : [],
    [document],
  );
  const metrics = useMemo(() => measureTokens(tokens), [tokens]);
  const revealed = useMemo(
    () => accessible
      ? new Set(tokens.map((token) => token.id))
      : fixationCharacter === null ? new Set<number>() : revealedWordIds(tokens, fixationCharacter),
    [accessible, fixationCharacter, tokens],
  );

  useEffect(() => {
    if (!parentOrigin || window.parent === window) return;
    let active = true;
    let authorization: SessionAuthorization | null = null;
    const send = (type: string, payload: unknown = {}) => {
      window.parent.postMessage({ source: 'pscb-protected-viewer', version: 1, type, payload }, parentOrigin);
    };
    send('viewer.ready');
    const receive = async (event: MessageEvent) => {
      if (event.origin !== parentOrigin || event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.source !== 'pscb-viewer-host' || message.version !== 1) return;
      if (message.type === 'viewer.authorize') {
        setAuthorizationState('checking');
        setAuthorizationError('');
        const token = typeof message.payload?.token === 'string' ? message.payload.token : '';
        if (!token && parentOrigin === window.location.origin) {
          authorization = { documentId: null, sessionId: 'same-origin-demo' };
          setAuthorizationState('authorized');
          send('viewer.authorized', authorization);
          return;
        }
        try {
          const response = await fetch('/api/v1/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, parentOrigin }),
          });
          const result = await response.json();
          if (!response.ok || !result.authorized) throw new Error(result.error || 'Session was denied.');
          if (!active) return;
          authorization = { documentId: String(result.documentId), sessionId: String(result.sessionId) };
          setAuthorizationState('authorized');
          send('viewer.authorized', { sessionId: authorization.sessionId, documentId: authorization.documentId, expiresAt: result.expiresAt });
        } catch (error) {
          if (!active) return;
          authorization = null;
          const detail = error instanceof Error ? error.message : 'Session was denied.';
          setAuthorizationState('denied');
          setAuthorizationError(detail);
          send('viewer.error', { code: 'SESSION_DENIED', message: detail });
        }
        return;
      }
      if (!authorization) {
        send('viewer.error', { code: 'SESSION_REQUIRED', message: 'Authorize the viewer before loading content.' });
        return;
      }
      if (message.type === 'viewer.load') {
        const next = validateDocument(message.payload);
        if (!next) return;
        if (authorization.documentId && authorization.documentId !== next.documentId) {
          send('viewer.error', { code: 'DOCUMENT_DENIED', message: 'The session is not valid for this document.' });
          return;
        }
        setDocument(next);
        setWebPage(null);
        setFixationCharacter(null);
        emit('viewer.loaded', { documentId: next.documentId });
      }
      if (message.type === 'viewer.load-page') {
        const next = validateWebPage(message.payload);
        if (!next) return;
        if (authorization.documentId && authorization.documentId !== next.pageId) {
          send('viewer.error', { code: 'DOCUMENT_DENIED', message: 'The session is not valid for this page.' });
          return;
        }
        setWebPage(next);
        setDocument(null);
        setFixationCharacter(null);
        setClearSignal((value) => value + 1);
        emit('viewer.page-loaded', { pageId: next.pageId });
      }
      if (message.type === 'viewer.clear') {
        setFixationCharacter(null);
        setClearSignal((value) => value + 1);
        emit('viewer.display-cleared', {});
      }
      if (message.type === 'viewer.accessibility') {
        const enabled = Boolean(message.payload?.enabled);
        setAccessible(enabled);
        setFixationCharacter(null);
        emit('viewer.accessibility-changed', { enabled });
      }
    };
    window.addEventListener('message', receive);
    return () => {
      active = false;
      window.removeEventListener('message', receive);
    };
  }, [parentOrigin]);

  function emit(type: string, payload: unknown) {
    if (!parentOrigin || window.parent === window) return;
    window.parent.postMessage({ source: 'pscb-protected-viewer', version: 1, type, payload }, parentOrigin);
  }

  function movePointer(event: React.PointerEvent<HTMLElement>) {
    if (accessible) return;
    const token = tokenAtPoint(event.clientX, event.clientY, readerRef.current, tokens);
    if (!token) return;
    setFixationCharacter(Math.round((token.start + token.end) / 2));
  }

  if (!document) {
    if (webPage) {
      return (
        <main className="viewer-shell viewer-shell--webpage">
          <header className="viewer-topbar">
            <div><span className="viewer-mark">P</span><strong>Protected webpage surface</strong></div>
            <div className="viewer-state" aria-live="polite"><span className={accessible || pageSpanActive ? 'status-dot status-dot--active' : 'status-dot'} />{accessible ? 'Accessible full page' : pageSpanActive ? 'Local span visible' : 'Source cleared'}</div>
          </header>
          <WebPageSurface page={webPage} accessible={accessible} clearSignal={clearSignal} onActiveChange={setPageSpanActive} />
          <footer className="viewer-footer viewer-footer--webpage"><span>Structured page mode</span><span>Source coordinates stay inside this frame</span></footer>
        </main>
      );
    }
    return (
      <main className="viewer-shell viewer-shell--waiting">
        {authorizationState !== 'denied' && <div className="spinner" aria-hidden="true" />}
        <strong>{authorizationState === 'denied' ? 'Session denied' : authorizationState === 'checking' ? 'Checking viewer session…' : authorizationState === 'authorized' ? 'Waiting for protected content…' : 'Waiting for authorization…'}</strong>
        <span>{authorizationState === 'denied' ? authorizationError : authorizationState === 'authorized' ? 'The host application has not loaded content.' : 'The host application must provide a short-lived viewer session.'}</span>
      </main>
    );
  }

  return (
    <main className="viewer-shell">
      <header className="viewer-topbar">
        <div><span className="viewer-mark">P</span><strong>{document.label}</strong></div>
        <div className="viewer-state" aria-live="polite"><span className={accessible || fixationCharacter !== null ? 'status-dot status-dot--active' : 'status-dot'} />{accessible ? 'Accessible full text' : fixationCharacter === null ? 'Source cleared' : 'Local span visible'}</div>
      </header>
      <article
        ref={readerRef}
        className="viewer-paper"
        onPointerMove={movePointer}
        onPointerLeave={() => setFixationCharacter(null)}
        aria-label={accessible ? `${document.title}, full readable text` : 'Protected visual document. Use the host accessibility control for full text.'}
      >
        <div className="viewer-document-heading"><span>Protected document</span><h1>{accessible ? document.title : 'Reading view'}</h1></div>
        <div className="prose viewer-prose" aria-hidden={!accessible}>
          {tokens.map((token, index) => {
            const previousEnd = index === 0 ? 0 : tokens[index - 1].end;
            const gap = document.content.slice(previousEnd, token.start);
            const paragraphBreak = /\n\s*\n/.test(gap);
            const showSource = accessible || revealed.has(token.id);
            const metric = metrics[token.id];
            return (
              <span key={token.id}>
                {paragraphBreak ? <><br /><br /></> : index > 0 ? ' ' : null}
                <span
                  className={`word viewer-word ${showSource ? 'viewer-word--source' : ''}`}
                  data-word-id={token.id}
                  style={{ width: `${metric.width}px`, letterSpacing: `${showSource ? 0 : metric.fillerSpacing}px` }}
                >{showSource ? token.source : token.filler}</span>
              </span>
            );
          })}
        </div>
      </article>
      <footer className="viewer-footer"><span>No camera in this demo</span><span>Pointer coordinates stay inside this frame</span></footer>
    </main>
  );
}

function resolveParentOrigin(): string | null {
  const candidate = new URLSearchParams(window.location.search).get('parentOrigin') || document.referrer;
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

function validateDocument(value: unknown): ViewerDocument | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ViewerDocument>;
  if (typeof candidate.content !== 'string' || candidate.content.length === 0 || candidate.content.length > MAX_CONTENT_LENGTH) return null;
  return {
    documentId: String(candidate.documentId || 'document').slice(0, 120),
    label: String(candidate.label || 'Protected document').slice(0, 80),
    title: String(candidate.title || 'Untitled document').slice(0, 180),
    content: candidate.content,
  };
}

function validateWebPage(value: unknown): ProtectedWebPage | null {
  if (!value || typeof value !== 'object') return null;
  try {
    if (JSON.stringify(value).length > MAX_CONTENT_LENGTH) return null;
  } catch {
    return null;
  }
  const candidate = value as Partial<ProtectedWebPage>;
  if (!Array.isArray(candidate.blocks) || candidate.blocks.length === 0 || candidate.blocks.length > 30) return null;
  const blocks = candidate.blocks.map(validatePageBlock);
  if (blocks.some((block) => block === null)) return null;
  return {
    pageId: cleanString(candidate.pageId, 'page', 120),
    label: cleanString(candidate.label, 'Protected workspace', 100),
    title: cleanString(candidate.title, 'Protected page', 200),
    subtitle: cleanString(candidate.subtitle, '', 600),
    navigation: Array.isArray(candidate.navigation) ? candidate.navigation.slice(0, 8).map((item) => cleanString(item, '', 80)) : [],
    blocks: blocks as ProtectedPageBlock[],
  };
}

function validatePageBlock(value: unknown): ProtectedPageBlock | null {
  if (!value || typeof value !== 'object') return null;
  const block = value as Record<string, unknown>;
  const id = cleanString(block.id, crypto.randomUUID(), 80);
  if (block.type === 'metrics' && Array.isArray(block.items)) {
    return { id, type: 'metrics', items: block.items.slice(0, 6).map((item) => {
      const entry = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return { label: cleanString(entry.label, '', 100), value: cleanString(entry.value, '', 100), detail: cleanString(entry.detail, '', 160) };
    }) };
  }
  if (block.type === 'chart') {
    return { id, type: 'chart', title: cleanString(block.title, '', 160), summary: cleanString(block.summary, '', 400), labels: Array.isArray(block.labels) ? block.labels.slice(0, 8).map((label) => cleanString(label, '', 60)) : [] };
  }
  if (block.type === 'list' && Array.isArray(block.items)) {
    return { id, type: 'list', title: cleanString(block.title, '', 160), items: block.items.slice(0, 8).map((item) => {
      const entry = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return { title: cleanString(entry.title, '', 180), detail: cleanString(entry.detail, '', 300) };
    }) };
  }
  if (block.type === 'table' && Array.isArray(block.columns) && Array.isArray(block.rows)) {
    const columns = block.columns.slice(0, 6).map((column) => cleanString(column, '', 100));
    return { id, type: 'table', title: cleanString(block.title, '', 160), columns, rows: block.rows.slice(0, 10).map((row) => Array.isArray(row) ? row.slice(0, columns.length).map((cell) => cleanString(cell, '', 160)) : []) };
  }
  if (block.type === 'callout') {
    return { id, type: 'callout', eyebrow: cleanString(block.eyebrow, '', 100), title: cleanString(block.title, '', 180), body: cleanString(block.body, '', 600) };
  }
  if (block.type === 'media') {
    return { id, type: 'media', title: cleanString(block.title, '', 180), description: cleanString(block.description, '', 500) };
  }
  return null;
}

function cleanString(value: unknown, fallback: string, maximum: number): string {
  return typeof value === 'string' ? value.slice(0, maximum) : fallback;
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
  return null;
}
