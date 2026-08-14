import type { GazeTracker, Point } from '../types';

interface WebGazerApi {
  setRegression(name: string): WebGazerApi;
  setTracker(name: string): WebGazerApi;
  showVideo(value: boolean): WebGazerApi;
  showPredictionPoints(value: boolean): WebGazerApi;
  saveDataAcrossSessions(value: boolean): WebGazerApi;
  setGazeListener(listener: (data: { x: number; y: number } | null, elapsed: number) => void): WebGazerApi;
  begin(): Promise<void>;
  end(): void;
  stopVideo(): WebGazerApi;
  recordScreenPosition(x: number, y: number, eventType: string): void;
}

export class WebGazerTracker implements GazeTracker {
  readonly kind = 'webgazer' as const;
  readonly label = 'WebGazer ridge regression';
  private listeners = new Set<(point: Point) => void>();
  private api: WebGazerApi | null = null;

  async start(): Promise<void> {
    await loadWebGazer();
    const api = window.webgazer;
    if (!api) throw new Error('The local WebGazer bundle did not initialize.');
    this.api = api;
    api
      .saveDataAcrossSessions(false)
      .setRegression('ridge')
      .setTracker('TFFacemesh')
      .showVideo(true)
      .showPredictionPoints(false)
      .setGazeListener((data) => {
        if (!data) return;
        const point = { x: data.x, y: data.y, at: performance.now() };
        this.listeners.forEach((listener) => listener(point));
      });
    await api.begin();
  }

  async stop(): Promise<void> {
    if (this.api) {
      try { this.api.stopVideo(); } catch { /* Camera may already be stopped. */ }
      this.api.end();
    }
    this.api = null;
  }

  subscribe(listener: (point: Point) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  calibrate(point: Omit<Point, 'at'>): void {
    this.api?.recordScreenPosition(point.x, point.y, 'click');
  }
}

declare global {
  interface Window {
    webgazer?: WebGazerApi;
  }
}

let loader: Promise<void> | null = null;

function loadWebGazer(): Promise<void> {
  if (window.webgazer) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/vendor/webgazer.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the local WebGazer bundle.'));
    document.head.appendChild(script);
  });
  return loader;
}
