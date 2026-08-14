import { describe, expect, it } from 'vitest';
import { aggregateSessions, percentile, pixelErrorToDegrees, summarizeE1, wordsPerMinute } from './metrics';
import type { StudySession } from '../types';

describe('measurement gates', () => {
  it('uses nearest-rank percentiles', () => {
    expect(percentile([5, 1, 4, 2, 3], 0.5)).toBe(3);
    expect(percentile([5, 1, 4, 2, 3], 0.95)).toBe(5);
    expect(percentile([], 0.95)).toBeNull();
  });

  it('converts physical geometry to visual angle', () => {
    const degrees = pixelErrorToDegrees(100, 1000, 50, 50);
    expect(degrees).toBeCloseTo(5.7106, 3);
  });

  it('applies E1 pass, continuation, and stop thresholds', () => {
    expect(summarizeE1(samples(2.4)).gate).toBe('pass');
    expect(summarizeE1(samples(4)).gate).toBe('continue');
    expect(summarizeE1(samples(5.1)).gate).toBe('stop');
    expect(summarizeE1(samples(1), false).gate).toBe('insufficient-data');
  });

  it('calculates reading rate from elapsed time', () => {
    expect(wordsPerMinute(300, 120_000)).toBe(150);
  });

  it('applies paired cohort gates', () => {
    const session = fixtureSession(200, 192, 1, 1, 'no');
    const summary = aggregateSessions([session]);
    expect(summary.meanSpeedLossPercent).toBeCloseTo(4);
    expect(summary.noticeRate).toBe(0);
    expect(summary.e2Gate).toBe('pass');
  });
});

function samples(errorDegrees: number) {
  return Array.from({ length: 20 }, (_, targetOrdinal) => ({ errorDegrees, latencyMs: 500, targetOrdinal }));
}

function fixtureSession(controlWpm: number, substitutionWpm: number, controlQuiz: number, substitutionQuiz: number, noticed: 'yes' | 'no' | 'unsure'): StudySession {
  return {
    schemaVersion: 1,
    sessionId: 'test-session',
    startedAt: '2026-08-11T00:00:00.000Z',
    completedAt: '2026-08-11T00:10:00.000Z',
    consentVersion: 'test',
    setup: { participantCode: 'P01', tracker: 'mediapipe', lighting: 'indoor', eyewear: 'none', viewingDistanceCm: 60, displayWidthCm: 50, accessibilityMode: false },
    e1: summarizeE1(samples(2)),
    e2: [
      { passageId: 'a', condition: 'control', elapsedMs: 60_000, wordCount: controlWpm, wordsPerMinute: controlWpm, quizAnswers: [], quizScore: controlQuiz, noticed: 'no' },
      { passageId: 'b', condition: 'substitution', elapsedMs: 60_000, wordCount: substitutionWpm, wordsPerMinute: substitutionWpm, quizAnswers: [], quizScore: substitutionQuiz, noticed },
    ],
  };
}
