import { useEffect, useMemo, useRef, useState } from 'react';
import { buildWordTokens, revealedWordIds, type WordToken } from '../lib/filler';

export interface ProtectedWebPage {
  pageId: string;
  label: string;
  title: string;
  subtitle: string;
  navigation: string[];
  blocks: ProtectedPageBlock[];
}

export type ProtectedPageBlock =
  | { id: string; type: 'metrics'; items: Array<{ label: string; value: string; detail: string }> }
  | { id: string; type: 'chart'; title: string; summary: string; labels: string[] }
  | { id: string; type: 'list'; title: string; items: Array<{ title: string; detail: string }> }
  | { id: string; type: 'table'; title: string; columns: string[]; rows: string[][] }
  | { id: string; type: 'callout'; eyebrow: string; title: string; body: string }
  | { id: string; type: 'media'; title: string; description: string };

type TextTone = 'display' | 'heading' | 'metric' | 'body' | 'label';

interface Segment {
  id: string;
  text: string;
  tone: TextTone;
  tokens: WordToken[];
  metrics: Array<{ width: number; fillerSpacing: number }>;
}

export function WebPageSurface({ page, accessible, clearSignal, onActiveChange }: {
  page: ProtectedWebPage;
  accessible: boolean;
  clearSignal: number;
  onActiveChange?: (active: boolean) => void;
}) {
  const surfaceRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<{ segmentId: string; character: number } | null>(null);
  const segments = useMemo(() => buildSegments(page), [page]);
  const segmentMap = useMemo(() => new Map(segments.map((segment) => [segment.id, segment])), [segments]);

  useEffect(() => setActive(null), [accessible, clearSignal, page]);
  useEffect(() => onActiveChange?.(active !== null), [active, onActiveChange]);

  function movePointer(event: React.PointerEvent<HTMLElement>) {
    if (accessible) return;
    const direct = document.elementsFromPoint(event.clientX, event.clientY).find(
      (element) => element instanceof HTMLElement && element.dataset.segmentId && element.dataset.wordId,
    ) as HTMLElement | undefined;
    if (!direct) return;
    const segment = segmentMap.get(direct.dataset.segmentId ?? '');
    const token = segment?.tokens[Number(direct.dataset.wordId)];
    if (segment && token) setActive({ segmentId: segment.id, character: Math.round((token.start + token.end) / 2) });
  }

  function secureText(segmentId: string, className = '') {
    const segment = segmentMap.get(segmentId);
    if (!segment) return null;
    const revealed = accessible
      ? new Set(segment.tokens.map((token) => token.id))
      : active?.segmentId === segment.id ? revealedWordIds(segment.tokens, active.character) : new Set<number>();
    return (
      <span className={`web-secure-text ${className}`} data-text-tone={segment.tone}>
        {segment.tokens.map((token, index) => {
          const showSource = revealed.has(token.id);
          const metric = segment.metrics[token.id];
          return (
            <span key={token.id}>
              {index > 0 ? ' ' : null}
              <span
                className={`word viewer-word web-secure-word ${showSource ? 'viewer-word--source' : ''}`}
                data-segment-id={segment.id}
                data-word-id={token.id}
                style={{ width: `${metric.width}px`, letterSpacing: `${showSource ? 0 : metric.fillerSpacing}px` }}
              >{showSource ? token.source : token.filler}</span>
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <article
      ref={surfaceRef}
      className="webpage-surface"
      onPointerMove={movePointer}
      onPointerLeave={() => setActive(null)}
      aria-label={accessible ? `${page.title}, full accessible webpage` : 'Protected visual webpage. Use the host accessibility control for full text.'}
    >
      <header className="webpage-appbar">
        <div className="webpage-app-brand"><i aria-hidden="true">N</i>{secureText('page:label', 'webpage-brand-text')}</div>
        <nav aria-label="Protected page navigation" aria-hidden={!accessible}>
          {page.navigation.map((_, index) => <span key={index}>{secureText(`page:nav:${index}`, 'webpage-nav-text')}</span>)}
        </nav>
        <span className="webpage-avatar" aria-hidden="true" />
      </header>

      <div className="webpage-content" aria-hidden={!accessible}>
        <section className="webpage-hero">
          <div><span className="webpage-kicker">Protected workspace</span><h1>{secureText('page:title')}</h1><p>{secureText('page:subtitle')}</p></div>
          <button type="button" tabIndex={-1}>Protected action</button>
        </section>

        {page.blocks.map((block) => {
          if (block.type === 'metrics') {
            return <section key={block.id} className="webpage-metrics">{block.items.map((_, index) => (
              <article key={index}><span>{secureText(`${block.id}:item:${index}:label`)}</span><strong>{secureText(`${block.id}:item:${index}:value`)}</strong><small>{secureText(`${block.id}:item:${index}:detail`)}</small></article>
            ))}</section>;
          }
          if (block.type === 'chart') {
            return (
              <section key={block.id} className="webpage-chart-card">
                <header><div><h2>{secureText(`${block.id}:title`)}</h2><p>{secureText(`${block.id}:summary`)}</p></div><span>Last 30 days</span></header>
                <div className="webpage-chart" aria-label="Protected chart placeholder">
                  {[54, 70, 48, 83, 64, 76, 59, 88, 72, 91, 79, 94].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
                </div>
                <div className="webpage-chart-labels">{block.labels.map((_, index) => <span key={index}>{secureText(`${block.id}:label:${index}`)}</span>)}</div>
              </section>
            );
          }
          if (block.type === 'list') {
            return <section key={block.id} className="webpage-list-card"><h2>{secureText(`${block.id}:title`)}</h2>{block.items.map((_, index) => <div className="webpage-list-row" key={index}><i /><span><strong>{secureText(`${block.id}:item:${index}:title`)}</strong><small>{secureText(`${block.id}:item:${index}:detail`)}</small></span><b>→</b></div>)}</section>;
          }
          if (block.type === 'table') {
            return <section key={block.id} className="webpage-table-card"><h2>{secureText(`${block.id}:title`)}</h2><div className="webpage-table" role="table"><div className="webpage-table-row webpage-table-head" role="row">{block.columns.map((_, index) => <span key={index}>{secureText(`${block.id}:column:${index}`)}</span>)}</div>{block.rows.map((row, rowIndex) => <div className="webpage-table-row" role="row" key={rowIndex}>{row.map((_, columnIndex) => <span key={columnIndex}>{secureText(`${block.id}:row:${rowIndex}:${columnIndex}`)}</span>)}</div>)}</div></section>;
          }
          if (block.type === 'callout') {
            return <section key={block.id} className="webpage-callout"><span>{secureText(`${block.id}:eyebrow`)}</span><h2>{secureText(`${block.id}:title`)}</h2><p>{secureText(`${block.id}:body`)}</p></section>;
          }
          return <section key={block.id} className="webpage-media-card"><div><i /><span>Protected media placeholder</span></div><h2>{secureText(`${block.id}:title`)}</h2><p>{secureText(`${block.id}:description`)}</p></section>;
        })}
      </div>
    </article>
  );
}

function buildSegments(page: ProtectedWebPage): Segment[] {
  const values: Array<{ id: string; text: string; tone: TextTone }> = [
    { id: 'page:label', text: page.label, tone: 'label' },
    { id: 'page:title', text: page.title, tone: 'display' },
    { id: 'page:subtitle', text: page.subtitle, tone: 'body' },
    ...page.navigation.map((text, index) => ({ id: `page:nav:${index}`, text, tone: 'label' as const })),
  ];
  for (const block of page.blocks) {
    if (block.type === 'metrics') block.items.forEach((item, index) => values.push(
      { id: `${block.id}:item:${index}:label`, text: item.label, tone: 'label' },
      { id: `${block.id}:item:${index}:value`, text: item.value, tone: 'metric' },
      { id: `${block.id}:item:${index}:detail`, text: item.detail, tone: 'label' },
    ));
    if (block.type === 'chart') {
      values.push({ id: `${block.id}:title`, text: block.title, tone: 'heading' }, { id: `${block.id}:summary`, text: block.summary, tone: 'body' });
      block.labels.forEach((text, index) => values.push({ id: `${block.id}:label:${index}`, text, tone: 'label' }));
    }
    if (block.type === 'list') {
      values.push({ id: `${block.id}:title`, text: block.title, tone: 'heading' });
      block.items.forEach((item, index) => values.push(
        { id: `${block.id}:item:${index}:title`, text: item.title, tone: 'body' },
        { id: `${block.id}:item:${index}:detail`, text: item.detail, tone: 'label' },
      ));
    }
    if (block.type === 'table') {
      values.push({ id: `${block.id}:title`, text: block.title, tone: 'heading' });
      block.columns.forEach((text, index) => values.push({ id: `${block.id}:column:${index}`, text, tone: 'label' }));
      block.rows.forEach((row, rowIndex) => row.forEach((text, columnIndex) => values.push({ id: `${block.id}:row:${rowIndex}:${columnIndex}`, text, tone: 'body' })));
    }
    if (block.type === 'callout') values.push(
      { id: `${block.id}:eyebrow`, text: block.eyebrow, tone: 'label' },
      { id: `${block.id}:title`, text: block.title, tone: 'heading' },
      { id: `${block.id}:body`, text: block.body, tone: 'body' },
    );
    if (block.type === 'media') values.push(
      { id: `${block.id}:title`, text: block.title, tone: 'heading' },
      { id: `${block.id}:description`, text: block.description, tone: 'body' },
    );
  }
  return values.map(({ id, text, tone }) => {
    const tokens = buildWordTokens(text, `webpage:${page.pageId}:${id}`);
    return { id, text, tone, tokens, metrics: measureTokens(tokens, tone) };
  });
}

function measureTokens(tokens: WordToken[], tone: TextTone): Array<{ width: number; fillerSpacing: number }> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return tokens.map((token) => ({ width: token.source.length * 8, fillerSpacing: 0 }));
  context.font = toneFont(tone);
  return tokens.map((token) => {
    const width = context.measureText(token.source).width;
    const fillerWidth = context.measureText(token.filler).width;
    return { width, fillerSpacing: (width - fillerWidth) / Math.max(1, token.filler.length - 1) };
  });
}

function toneFont(tone: TextTone): string {
  if (tone === 'display') return '44px Georgia, serif';
  if (tone === 'heading') return '24px Georgia, serif';
  if (tone === 'metric') return '28px Inter, system-ui, sans-serif';
  if (tone === 'label') return '12px Inter, system-ui, sans-serif';
  return '15px Inter, system-ui, sans-serif';
}
