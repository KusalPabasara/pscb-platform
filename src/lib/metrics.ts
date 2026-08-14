import type { E1Sample, GateResult, StudySession } from '../types';

export function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(fraction * sorted.length) - 1);
  return sorted[index];
}

export function pixelErrorToDegrees(
  errorPx: number,
  viewportWidthPx: number,
  displayWidthCm: number,
  viewingDistanceCm: number,
): number {
  if (viewportWidthPx <= 0 || displayWidthCm <= 0 || viewingDistanceCm <= 0) {
    throw new Error('Display geometry must be positive.');
  }
  const errorCm = errorPx * (displayWidthCm / viewportWidthPx);
  return (Math.atan2(errorCm, viewingDistanceCm) * 180) / Math.PI;
}

export function summarizeE1(samples: E1Sample[], eligible = true) {
  if (!eligible || samples.length === 0) {
    return { eligible, samples, p50Degrees: null, p95Degrees: null, gate: 'insufficient-data' as GateResult };
  }
  const values = samples.map((sample) => sample.errorDegrees);
  const p95Degrees = percentile(values, 0.95);
  let gate: GateResult = 'continue';
  if (p95Degrees !== null && p95Degrees <= 2.5) gate = 'pass';
  if (p95Degrees !== null && p95Degrees > 5) gate = 'stop';
  return {
    eligible,
    samples,
    p50Degrees: percentile(values, 0.5),
    p95Degrees,
    gate,
  };
}

export function wordsPerMinute(wordCount: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return wordCount / (elapsedMs / 60_000);
}

export interface CohortSummary {
  sessions: number;
  eligibleE1Sessions: number;
  e1P95Degrees: number | null;
  e1Gate: GateResult;
  pairedE2Sessions: number;
  meanSpeedLossPercent: number | null;
  meanQuizDelta: number | null;
  noticeRate: number | null;
  e2Gate: GateResult;
}

export function aggregateSessions(sessions: StudySession[]): CohortSummary {
  const e1Sessions = sessions.filter((session) => session.e1?.eligible);
  const e1Errors = e1Sessions.flatMap((session) => session.e1?.samples.map((sample) => sample.errorDegrees) ?? []);
  const e1P95Degrees = percentile(e1Errors, 0.95);
  let e1Gate: GateResult = 'insufficient-data';
  if (e1P95Degrees !== null) e1Gate = e1P95Degrees <= 2.5 ? 'pass' : e1P95Degrees > 5 ? 'stop' : 'continue';

  const pairs = sessions.flatMap((session) => {
    const control = session.e2.find((trial) => trial.condition === 'control');
    const substitution = session.e2.find((trial) => trial.condition === 'substitution');
    return control && substitution ? [{ control, substitution }] : [];
  });
  const speedLosses = pairs.map(({ control, substitution }) =>
    control.wordsPerMinute > 0 ? ((control.wordsPerMinute - substitution.wordsPerMinute) / control.wordsPerMinute) * 100 : 0,
  );
  const quizDeltas = pairs.map(({ control, substitution }) => substitution.quizScore - control.quizScore);
  const noticeRate = pairs.length
    ? pairs.filter(({ substitution }) => substitution.noticed === 'yes').length / pairs.length
    : null;
  const meanSpeedLossPercent = mean(speedLosses);
  const meanQuizDelta = mean(quizDeltas);

  let e2Gate: GateResult = 'insufficient-data';
  if (meanSpeedLossPercent !== null && meanQuizDelta !== null && noticeRate !== null) {
    if (meanSpeedLossPercent > 15) e2Gate = 'stop';
    else if (meanSpeedLossPercent < 5 && meanQuizDelta >= 0 && noticeRate < 0.2) e2Gate = 'pass';
    else e2Gate = 'continue';
  }

  return {
    sessions: sessions.length,
    eligibleE1Sessions: e1Sessions.length,
    e1P95Degrees,
    e1Gate,
    pairedE2Sessions: pairs.length,
    meanSpeedLossPercent,
    meanQuizDelta,
    noticeRate,
    e2Gate,
  };
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function euclideanError(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
