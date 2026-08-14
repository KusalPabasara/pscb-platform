import { describe, expect, it } from 'vitest';
import { buildWordTokens, revealedWordIds, shapeMatchedFiller } from './filler';

describe('session-keyed filler', () => {
  it('is deterministic for a session key', () => {
    expect(shapeMatchedFiller('Harbor,', 'session:1')).toBe(shapeMatchedFiller('Harbor,', 'session:1'));
    expect(shapeMatchedFiller('Harbor,', 'session:1')).not.toBe(shapeMatchedFiller('Harbor,', 'session:2'));
  });

  it('preserves length, punctuation, and initial capitalization', () => {
    const filler = shapeMatchedFiller('Harbor,', 'key');
    expect(filler).toHaveLength('Harbor,'.length);
    expect(filler.endsWith(',')).toBe(true);
    expect(filler[0]).toMatch(/[A-Z]/);
  });

  it('reveals only tokens intersecting the configured character window', () => {
    const tokens = buildWordTokens('one two three four five six', 'key');
    const ids = revealedWordIds(tokens, 10, 2, 3);
    expect([...ids]).toEqual([2]);
  });
});
