import type { GazeTracker, Point } from '../types';

export class PointerTracker implements GazeTracker {
  readonly kind = 'pointer' as const;
  readonly label = 'Pointer fallback';
  private listeners = new Set<(point: Point) => void>();
  private handler = (event: PointerEvent) => {
    const point = { x: event.clientX, y: event.clientY, at: performance.now() };
    this.listeners.forEach((listener) => listener(point));
  };

  async start(): Promise<void> {
    window.addEventListener('pointermove', this.handler, { passive: true });
  }

  async stop(): Promise<void> {
    window.removeEventListener('pointermove', this.handler);
  }

  subscribe(listener: (point: Point) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  calibrate(): void {}
}
