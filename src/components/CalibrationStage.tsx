import { useMemo, useState } from 'react';
import { hashSeed, shuffled } from '../lib/random';
import type { GazeTracker } from '../types';

const grid = [0.12, 0.5, 0.88].flatMap((y) => [0.12, 0.5, 0.88].map((x) => ({ x, y })));

export function CalibrationStage({ tracker, onComplete }: { tracker: GazeTracker; onComplete: () => void }) {
  const targets = useMemo(() => shuffled([...grid, ...grid, ...grid], hashSeed(`${Date.now()}`)), []);
  const [index, setIndex] = useState(0);
  const target = targets[index];

  function record(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    tracker.calibrate({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    if (index + 1 === targets.length) onComplete();
    else setIndex((value) => value + 1);
  }

  return (
    <section className="target-stage" aria-label="Gaze calibration">
      <div className="target-instruction"><strong>Calibration {index + 1}/{targets.length}</strong><span>Look at the dot, then click it without moving your head.</span></div>
      <button
        className="gaze-target"
        style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }}
        onClick={record}
        aria-label={`Calibration target ${index + 1}`}
      ><span /></button>
    </section>
  );
}
