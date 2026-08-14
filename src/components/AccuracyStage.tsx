import { useEffect, useMemo, useRef, useState } from 'react';
import { euclideanError, pixelErrorToDegrees, summarizeE1 } from '../lib/metrics';
import { hashSeed, shuffled } from '../lib/random';
import type { E1Result, E1Sample, GazeTracker, ParticipantSetup, Point } from '../types';

const baseTargets = [0.1, 0.3, 0.5, 0.7, 0.9].flatMap((y) => [0.1, 0.3, 0.5, 0.7, 0.9].map((x) => ({ x, y })));
const SETTLE_MS = 450;
const SAMPLE_MS = 750;

export function AccuracyStage({ tracker, setup, onComplete }: { tracker: GazeTracker; setup: ParticipantSetup; onComplete: (result: E1Result) => void }) {
  const targets = useMemo(() => shuffled(baseTargets, hashSeed(`${setup.participantCode}:e1`)), [setup.participantCode]);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [collecting, setCollecting] = useState(false);
  const samples = useRef<E1Sample[]>([]);
  const shownAt = useRef(0);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started) return;
    shownAt.current = performance.now();
    setCollecting(false);
    const settleTimer = window.setTimeout(() => setCollecting(true), SETTLE_MS);
    const advanceTimer = window.setTimeout(() => {
      setCollecting(false);
      if (index + 1 === targets.length) {
        onComplete(summarizeE1(samples.current, tracker.kind !== 'pointer'));
      } else setIndex((value) => value + 1);
    }, SETTLE_MS + SAMPLE_MS);
    return () => { clearTimeout(settleTimer); clearTimeout(advanceTimer); };
  }, [index, onComplete, started, targets.length, tracker.kind]);

  useEffect(() => tracker.subscribe((point: Point) => {
    if (!collecting || !targetRef.current) return;
    const rect = targetRef.current.getBoundingClientRect();
    const target = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const errorPx = euclideanError(point, target);
    samples.current.push({
      errorDegrees: pixelErrorToDegrees(errorPx, window.screen.width, setup.displayWidthCm, setup.viewingDistanceCm),
      latencyMs: point.at - shownAt.current,
      targetOrdinal: index,
    });
  }), [collecting, index, setup.displayWidthCm, setup.viewingDistanceCm, tracker]);

  if (!started) {
    return (
      <section className="panel compact-panel">
        <span className="step-label">E1 · accuracy</span>
        <h1>Look at each target</h1>
        <p>There are 25 targets. Keep your head naturally still and look at the center of each dot until it moves. Do not click during measurement.</p>
        {tracker.kind === 'pointer' && <div className="notice-card notice-card--warm">Pointer fallback will exercise the flow, but its measurements are marked ineligible for E1.</div>}
        <button className="primary-button" onClick={() => setStarted(true)}>Begin E1</button>
      </section>
    );
  }

  const target = targets[index];
  return (
    <section className="target-stage" aria-label="Gaze accuracy measurement">
      <div className="target-instruction"><strong>E1 target {index + 1}/{targets.length}</strong><span>{collecting ? 'Measuring' : 'Settle on the center'}</span></div>
      <div ref={targetRef} className={collecting ? 'gaze-target gaze-target--measuring' : 'gaze-target'} style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }}><span /></div>
    </section>
  );
}
