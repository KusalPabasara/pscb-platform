import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { fitAffine, predictAffine, type AffineModel, type CalibrationPair } from '../lib/affine';
import type { GazeTracker, Point } from '../types';

interface IrisFeature {
  x: number;
  y: number;
}

export class MediaPipeTracker implements GazeTracker {
  readonly kind = 'mediapipe' as const;
  readonly label = 'MediaPipe iris affine regression';
  private listeners = new Set<(point: Point) => void>();
  private landmarker: FaceLandmarker | null = null;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private frame = 0;
  private lastVideoTime = -1;
  private latestFeature: IrisFeature | null = null;
  private calibrations: CalibrationPair[] = [];
  private model: AffineModel | null = null;

  async start(video?: HTMLVideoElement): Promise<void> {
    if (!video) throw new Error('MediaPipe requires a video element.');
    const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    const options = {
      baseOptions: { modelAssetPath: '/mediapipe/models/face_landmarker.task', delegate: 'GPU' as const },
      runningMode: 'VIDEO' as const,
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };
    try {
      this.landmarker = await FaceLandmarker.createFromOptions(vision, options);
    } catch {
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { modelAssetPath: '/mediapipe/models/face_landmarker.task', delegate: 'CPU' },
      });
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      audio: false,
    });
    this.video = video;
    video.srcObject = this.stream;
    await video.play();
    this.frame = requestAnimationFrame(this.processFrame);
  }

  async stop(): Promise<void> {
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    this.video = null;
    this.landmarker?.close();
    this.landmarker = null;
  }

  subscribe(listener: (point: Point) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  calibrate(point: Omit<Point, 'at'>): void {
    if (!this.latestFeature) return;
    this.calibrations.push({
      featureX: this.latestFeature.x,
      featureY: this.latestFeature.y,
      screenX: point.x,
      screenY: point.y,
    });
    this.model = fitAffine(this.calibrations);
  }

  private processFrame = () => {
    if (!this.video || !this.landmarker) return;
    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.landmarker.detectForVideo(this.video, performance.now());
      const landmarks = result.faceLandmarks[0];
      if (landmarks?.length >= 478) {
        this.latestFeature = extractIrisFeature(landmarks);
        if (this.model) {
          const prediction = predictAffine(this.model, this.latestFeature.x, this.latestFeature.y);
          const point = { ...prediction, at: performance.now() };
          this.listeners.forEach((listener) => listener(point));
        }
      }
    }
    this.frame = requestAnimationFrame(this.processFrame);
  };
}

function extractIrisFeature(landmarks: Array<{ x: number; y: number }>): IrisFeature {
  const leftIris = center(landmarks.slice(468, 473));
  const rightIris = center(landmarks.slice(473, 478));
  const leftEyeCenter = midpoint(landmarks[33], landmarks[133]);
  const rightEyeCenter = midpoint(landmarks[362], landmarks[263]);
  const eyeDistance = Math.max(1e-5, Math.hypot(leftEyeCenter.x - rightEyeCenter.x, leftEyeCenter.y - rightEyeCenter.y));
  const irisCenter = midpoint(leftIris, rightIris);
  const eyesCenter = midpoint(leftEyeCenter, rightEyeCenter);
  return {
    x: (irisCenter.x - eyesCenter.x) / eyeDistance,
    y: (irisCenter.y - eyesCenter.y) / eyeDistance,
  };
}

function center(points: Array<{ x: number; y: number }>) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
