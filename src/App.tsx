import { useEffect, useMemo, useRef, useState } from 'react';
import { passages, countWords, type Passage } from './data/passages';
import { createTracker } from './gaze/createTracker';
import { hashSeed } from './lib/random';
import { deleteSession, downloadSession, saveSession } from './lib/storage';
import { wordsPerMinute } from './lib/metrics';
import type { E1Result, E2TrialResult, GazeTracker, ParticipantSetup, StudyCondition, StudySession } from './types';
import { AccuracyStage } from './components/AccuracyStage';
import { CalibrationStage } from './components/CalibrationStage';
import { ConsentStage } from './components/ConsentStage';
import { QuizStage } from './components/QuizStage';
import { ReadingStage } from './components/ReadingStage';
import { ResultsStage } from './components/ResultsStage';
import { SetupStage } from './components/SetupStage';

type Phase = 'consent' | 'setup' | 'starting' | 'calibration' | 'accuracy' | 'trial-intro' | 'reading' | 'quiz' | 'results';

interface TrialPlan {
  passage: Passage;
  condition: StudyCondition;
}

const CONSENT_VERSION = '2026-08-11-v1';

export interface AppProps {
  embedded?: boolean;
  initialSetup?: Partial<Pick<ParticipantSetup, 'participantCode' | 'tracker' | 'accessibilityMode'>>;
}

export function App({ embedded = false, initialSetup }: AppProps) {
  const [phase, setPhase] = useState<Phase>('consent');
  const [session, setSession] = useState<StudySession | null>(null);
  const [tracker, setTracker] = useState<GazeTracker | null>(null);
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [readingStartedAt, setReadingStartedAt] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const trialPlan = useMemo<TrialPlan[]>(() => {
    if (!session) return [];
    const variant = hashSeed(session.setup.participantCode) % 2;
    return variant === 0
      ? [{ passage: passages[0], condition: 'control' }, { passage: passages[1], condition: 'substitution' }]
      : [{ passage: passages[1], condition: 'substitution' }, { passage: passages[0], condition: 'control' }];
  }, [session]);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  useEffect(() => {
    emitEmbedEvent(embedded, 'study.phase', { phase });
  }, [embedded, phase]);

  useEffect(() => () => {
    void tracker?.stop();
  }, [tracker]);

  function acceptConsent() {
    setPhase('setup');
  }

  async function begin(setup: ParticipantSetup) {
    const nextSession: StudySession = {
      schemaVersion: 1,
      sessionId: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      consentVersion: CONSENT_VERSION,
      setup,
      e1: null,
      e2: [],
    };
    setSession(nextSession);
    setPhase('starting');
    setTrackerError(null);
    const nextTracker = createTracker(setup.tracker);
    try {
      await nextTracker.start(videoRef.current ?? undefined);
      setTracker(nextTracker);
      setPhase(setup.tracker === 'pointer' ? 'accuracy' : 'calibration');
    } catch (error) {
      await nextTracker.stop();
      setTrackerError(error instanceof Error ? error.message : 'Tracker startup failed.');
      setPhase('setup');
    }
  }

  function finishE1(result: E1Result) {
    setSession((current) => current ? { ...current, e1: result } : current);
    emitEmbedEvent(embedded, 'study.e1-complete', { eligible: result.eligible, p95Degrees: result.p95Degrees, gate: result.gate });
    setPhase('trial-intro');
  }

  function startReading() {
    setReadingStartedAt(performance.now());
    setPhase('reading');
  }

  function finishReading() {
    setPhase('quiz');
  }

  function finishQuiz(quizAnswers: E2TrialResult['quizAnswers'], noticed: E2TrialResult['noticed']) {
    const plan = trialPlan[trialIndex];
    const elapsedMs = performance.now() - readingStartedAt;
    const wordCount = countWords(plan.passage.text);
    const trial: E2TrialResult = {
      passageId: plan.passage.id,
      condition: plan.condition,
      elapsedMs,
      wordCount,
      wordsPerMinute: wordsPerMinute(wordCount, elapsedMs),
      quizAnswers,
      quizScore: quizAnswers.filter((answer) => answer.correct).length / quizAnswers.length,
      noticed,
    };
    setSession((current) => current ? { ...current, e2: [...current.e2, trial] } : current);
    if (trialIndex + 1 < trialPlan.length) {
      setTrialIndex((value) => value + 1);
      setPhase('trial-intro');
    } else {
      setSession((current) => {
        if (!current) return current;
        const complete = { ...current, completedAt: new Date().toISOString() };
        emitEmbedEvent(embedded, 'study.complete', publicCompletionSummary(complete));
        return complete;
      });
      void tracker?.stop();
      setPhase('results');
    }
  }

  function restart() {
    void tracker?.stop();
    setTracker(null);
    setSession(null);
    setTrialIndex(0);
    setTrackerError(null);
    deleteSession();
    setPhase('consent');
  }

  const currentPlan = trialPlan[trialIndex];

  return (
    <main className={`${phase === 'reading' ? 'app app--reading' : 'app'}${embedded ? ' app--embedded' : ''}`}>
      <header className="topbar">
        <div>
          <span className="eyebrow">Private research harness</span>
          <strong>Reading &amp; gaze study</strong>
        </div>
        <div className="privacy-indicator" aria-live="polite">
          <span className={tracker && tracker.kind !== 'pointer' ? 'status-dot status-dot--active' : 'status-dot'} />
          {tracker && tracker.kind !== 'pointer' ? 'Camera active · on-device' : 'No camera stream'}
        </div>
      </header>

      <video ref={videoRef} className={tracker?.kind === 'mediapipe' ? 'camera-preview' : 'camera-preview camera-preview--hidden'} muted playsInline aria-label="Your local camera preview" />

      {phase === 'consent' && <ConsentStage embedded={embedded} onAccept={acceptConsent} />}
      {phase === 'setup' && <SetupStage error={trackerError} initial={initialSetup} onBegin={begin} />}
      {phase === 'starting' && <CenteredStatus title="Starting local tracker…" detail="No camera frames or gaze data are being uploaded." />}
      {phase === 'calibration' && tracker && <CalibrationStage tracker={tracker} onComplete={() => setPhase('accuracy')} />}
      {phase === 'accuracy' && tracker && session && <AccuracyStage tracker={tracker} setup={session.setup} onComplete={finishE1} />}
      {phase === 'trial-intro' && currentPlan && (
        <section className="panel compact-panel">
          <span className="step-label">Reading trial {trialIndex + 1} of {trialPlan.length}</span>
          <h1>Read at your normal pace</h1>
          <p>You will answer three short questions when you finish. Keep your usual posture and avoid using the pointer unless pointer mode is active.</p>
          <button className="primary-button" onClick={startReading}>Start reading</button>
        </section>
      )}
      {phase === 'reading' && currentPlan && tracker && session && (
        <ReadingStage
          passage={currentPlan.passage}
          condition={currentPlan.condition}
          tracker={tracker}
          sessionKey={session.sessionId}
          accessible={session.setup.accessibilityMode}
          onComplete={finishReading}
        />
      )}
      {phase === 'quiz' && currentPlan && <QuizStage passage={currentPlan.passage} onComplete={finishQuiz} />}
      {phase === 'results' && session && (
        <ResultsStage
          session={session}
          onExport={() => downloadSession(session)}
          onDelete={() => { deleteSession(); alert('Local study data deleted. Exported files are not affected.'); }}
          onRestart={restart}
        />
      )}
    </main>
  );
}

function emitEmbedEvent(embedded: boolean, type: string, payload: unknown) {
  if (!embedded || window.parent === window) return;
  const targetOrigin = resolveParentOrigin();
  if (!targetOrigin) return;
  window.parent.postMessage({ source: 'pscb-study-mvp', version: 1, type, payload }, targetOrigin);
}

function resolveParentOrigin(): string | null {
  const configured = new URLSearchParams(window.location.search).get('parentOrigin');
  const candidate = configured || document.referrer;
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

function publicCompletionSummary(session: StudySession) {
  return {
    sessionId: session.sessionId,
    participantCode: session.setup.participantCode,
    completedAt: session.completedAt,
    tracker: session.setup.tracker,
    e1: session.e1 ? { eligible: session.e1.eligible, p95Degrees: session.e1.p95Degrees, gate: session.e1.gate } : null,
    e2: session.e2.map((trial) => ({
      passageId: trial.passageId,
      condition: trial.condition,
      wordsPerMinute: trial.wordsPerMinute,
      quizScore: trial.quizScore,
      noticed: trial.noticed,
    })),
  };
}

function CenteredStatus({ title, detail }: { title: string; detail: string }) {
  return <section className="panel compact-panel"><div className="spinner" aria-hidden="true" /><h1>{title}</h1><p>{detail}</p></section>;
}
