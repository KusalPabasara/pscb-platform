import type { GazeTracker, TrackerKind } from '../types';
import { MediaPipeTracker } from './MediaPipeTracker';
import { PointerTracker } from './PointerTracker';
import { WebGazerTracker } from './WebGazerTracker';

export function createTracker(kind: TrackerKind): GazeTracker {
  if (kind === 'webgazer') return new WebGazerTracker();
  if (kind === 'mediapipe') return new MediaPipeTracker();
  return new PointerTracker();
}
