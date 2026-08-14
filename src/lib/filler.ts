import { hashSeed, seededRandom } from './random';

const fragments = ['al', 'be', 'cor', 'den', 'el', 'fin', 'gar', 'hal', 'in', 'jor', 'kel', 'lin', 'mor', 'nor', 'or', 'pra', 'quil', 'ren', 'sol', 'ter', 'ul', 'ven', 'wel', 'xer', 'yor', 'zen'];

export interface WordToken {
  id: number;
  source: string;
  filler: string;
  start: number;
  end: number;
}

export function buildWordTokens(text: string, sessionKey: string): WordToken[] {
  const matches = [...text.matchAll(/\S+/g)];
  return matches.map((match, id) => {
    const source = match[0];
    const start = match.index ?? 0;
    return {
      id,
      source,
      filler: shapeMatchedFiller(source, `${sessionKey}:${id}`),
      start,
      end: start + source.length,
    };
  });
}

export function shapeMatchedFiller(source: string, key: string): string {
  const prefix = source.match(/^\W*/)?.[0] ?? '';
  const suffix = source.match(/\W*$/)?.[0] ?? '';
  const core = source.slice(prefix.length, source.length - suffix.length || undefined);
  if (!core) return source;
  const random = seededRandom(hashSeed(key));
  let generated = '';
  while (generated.length < core.length) {
    generated += fragments[Math.floor(random() * fragments.length)];
  }
  generated = generated.slice(0, core.length).toLowerCase();
  if (/^[A-Z]/.test(core)) generated = generated[0].toUpperCase() + generated.slice(1);
  if (/^[A-Z]+$/.test(core)) generated = generated.toUpperCase();
  return `${prefix}${generated}${suffix}`;
}

export function revealedWordIds(tokens: WordToken[], fixationCharacter: number, left = 4, right = 15): Set<number> {
  const lower = fixationCharacter - left;
  const upper = fixationCharacter + right;
  return new Set(tokens.filter((token) => token.end >= lower && token.start <= upper).map((token) => token.id));
}
