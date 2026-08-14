import { useEffect, useMemo, useRef, useState } from 'react';
import type { Passage } from '../data/passages';
import { buildWordTokens, revealedWordIds, type WordToken } from '../lib/filler';
import type { GazeTracker, Point, StudyCondition } from '../types';

const FONT = '21px Georgia, Cambria, serif';

export function ReadingStage({ passage, condition, tracker, sessionKey, accessible, onComplete }: {
  passage: Passage;
  condition: StudyCondition;
  tracker: GazeTracker;
  sessionKey: string;
  accessible: boolean;
  onComplete: () => void;
}) {
  const tokens = useMemo(() => buildWordTokens(passage.text, `${sessionKey}:${passage.id}`), [passage.id, passage.text, sessionKey]);
  const metrics = useMemo(() => measureTokens(tokens), [tokens]);
  const [fixationCharacter, setFixationCharacter] = useState(tokens[0]?.start ?? 0);
  const readerRef = useRef<HTMLElement>(null);
  const revealed = useMemo(
    () => condition === 'control' || accessible ? new Set(tokens.map((token) => token.id)) : revealedWordIds(tokens, fixationCharacter),
    [accessible, condition, fixationCharacter, tokens],
  );

  useEffect(() => tracker.subscribe((point: Point) => {
    if (condition === 'control' || accessible) return;
    const token = tokenAtPoint(point, readerRef.current, tokens);
    if (token) setFixationCharacter(Math.round((token.start + token.end) / 2));
  }), [accessible, condition, tokens, tracker]);

  return (
    <section className="reading-shell">
      <div className="reading-meta"><span>Reading trial</span><span>{accessible ? 'Accessible full text' : tracker.label}</span></div>
      <article ref={readerRef} className="reading-page" aria-label={`${passage.title}, reading passage`}>
        <h1>{passage.title}</h1>
        <div className="prose" aria-live="off">
          {tokens.map((token, index) => {
            const previousEnd = index === 0 ? 0 : tokens[index - 1].end;
            const gap = passage.text.slice(previousEnd, token.start);
            const paragraphBreak = /\n\s*\n/.test(gap);
            const showSource = revealed.has(token.id);
            const display = showSource ? token.source : token.filler;
            const tokenMetric = metrics[token.id];
            return (
              <span key={token.id}>
                {paragraphBreak ? <><br /><br /></> : index > 0 ? ' ' : null}
                <span
                  className="word"
                  data-word-id={token.id}
                  style={{ width: `${tokenMetric.width}px`, letterSpacing: `${showSource ? 0 : tokenMetric.fillerSpacing}px` }}
                  aria-hidden={!showSource && condition === 'substitution'}
                >{display}</span>
              </span>
            );
          })}
        </div>
      </article>
      <div className="reading-actions">
        <button className="primary-button" onClick={onComplete}>I have finished reading</button>
        <span>Continue only after reaching the end.</span>
      </div>
    </section>
  );
}

function measureTokens(tokens: WordToken[]): Array<{ width: number; fillerSpacing: number }> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return tokens.map((token) => ({ width: token.source.length * 11, fillerSpacing: 0 }));
  context.font = FONT;
  return tokens.map((token) => {
    const width = context.measureText(token.source).width;
    const fillerWidth = context.measureText(token.filler).width;
    const adjustable = Math.max(1, token.filler.length - 1);
    return { width, fillerSpacing: (width - fillerWidth) / adjustable };
  });
}

function tokenAtPoint(point: Point, reader: HTMLElement | null, tokens: WordToken[]): WordToken | null {
  if (!reader) return null;
  const direct = document.elementsFromPoint(point.x, point.y).find((element) => element instanceof HTMLElement && element.dataset.wordId !== undefined) as HTMLElement | undefined;
  if (direct) return tokens[Number(direct.dataset.wordId)] ?? null;

  let nearestToken: WordToken | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const element of reader.querySelectorAll<HTMLElement>('[data-word-id]')) {
    const rect = element.getBoundingClientRect();
    const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
    const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
    const distance = Math.hypot(dx, dy);
    const token = tokens[Number(element.dataset.wordId)];
    if (token && distance < nearestDistance) {
      nearestToken = token;
      nearestDistance = distance;
    }
  }
  return nearestToken;
}
