export type TrackerKind = 'webgazer' | 'mediapipe' | 'pointer';
export type StudyCondition = 'control' | 'substitution';
export type GateResult = 'pass' | 'continue' | 'stop' | 'insufficient-data';

export interface Point {
  x: number;
  y: number;
  at: number;
}

export interface ParticipantSetup {
  participantCode: string;
  tracker: TrackerKind;
  lighting: 'dim' | 'indoor' | 'daylight';
  eyewear: 'none' | 'glasses' | 'contacts';
  viewingDistanceCm: number;
  displayWidthCm: number;
  accessibilityMode: boolean;
}

export interface E1Sample {
  errorDegrees: number;
  latencyMs: number;
  targetOrdinal: number;
}

export interface E1Result {
  eligible: boolean;
  samples: E1Sample[];
  p50Degrees: number | null;
  p95Degrees: number | null;
  gate: GateResult;
}

export interface QuizAnswer {
  questionId: string;
  answer: number;
  correct: boolean;
}

export interface E2TrialResult {
  passageId: string;
  condition: StudyCondition;
  elapsedMs: number;
  wordCount: number;
  wordsPerMinute: number;
  quizAnswers: QuizAnswer[];
  quizScore: number;
  noticed: 'yes' | 'no' | 'unsure';
}

export interface StudySession {
  schemaVersion: 1;
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  consentVersion: string;
  setup: ParticipantSetup;
  e1: E1Result | null;
  e2: E2TrialResult[];
}

export interface GazeTracker {
  readonly kind: TrackerKind;
  readonly label: string;
  start(video?: HTMLVideoElement): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (point: Point) => void): () => void;
  calibrate(point: Omit<Point, 'at'>): void;
}
