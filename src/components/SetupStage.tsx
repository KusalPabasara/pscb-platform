import { useState, type FormEvent } from 'react';
import type { ParticipantSetup, TrackerKind } from '../types';

export function SetupStage({ error, initial, onBegin }: { error: string | null; initial?: Partial<Pick<ParticipantSetup, 'participantCode' | 'tracker' | 'accessibilityMode'>>; onBegin: (setup: ParticipantSetup) => void }) {
  const [code, setCode] = useState(initial?.participantCode ?? '');
  const [tracker, setTracker] = useState<TrackerKind>(initial?.tracker ?? 'mediapipe');
  const [lighting, setLighting] = useState<ParticipantSetup['lighting']>('indoor');
  const [eyewear, setEyewear] = useState<ParticipantSetup['eyewear']>('none');
  const [distance, setDistance] = useState(60);
  const [displayWidth, setDisplayWidth] = useState(52);
  const [accessible, setAccessible] = useState(initial?.accessibilityMode ?? false);

  function submit(event: FormEvent) {
    event.preventDefault();
    onBegin({
      participantCode: code.trim(),
      tracker,
      lighting,
      eyewear,
      viewingDistanceCm: distance,
      displayWidthCm: displayWidth,
      accessibilityMode: accessible,
    });
  }

  return (
    <section className="panel setup-panel">
      <span className="step-label">Session setup</span>
      <h1>Record the viewing conditions</h1>
      <p className="lead">Use an anonymous code. Maximize the browser at 100% zoom; physical measurements convert pixel error into degrees of visual angle.</p>
      {error && <div className="error-banner" role="alert"><strong>Tracker did not start.</strong> {error} You may retry or choose pointer fallback.</div>}
      <form onSubmit={submit} className="form-grid">
        <label className="field field--wide">Anonymous participant code
          <input required pattern="[A-Za-z0-9_-]{2,32}" value={code} onChange={(event) => setCode(event.target.value)} placeholder="e.g. P014" autoComplete="off" />
        </label>
        <label className="field field--wide">Tracking method
          <select value={tracker} onChange={(event) => setTracker(event.target.value as TrackerKind)}>
            <option value="mediapipe">MediaPipe iris regression</option>
            <option value="webgazer">WebGazer ridge regression</option>
            <option value="pointer">No camera · pointer fallback</option>
          </select>
          <small>Pointer sessions verify usability but are excluded from E1.</small>
        </label>
        <label className="field">Lighting
          <select value={lighting} onChange={(event) => setLighting(event.target.value as ParticipantSetup['lighting'])}>
            <option value="dim">Dim</option><option value="indoor">Indoor</option><option value="daylight">Daylight</option>
          </select>
        </label>
        <label className="field">Eyewear
          <select value={eyewear} onChange={(event) => setEyewear(event.target.value as ParticipantSetup['eyewear'])}>
            <option value="none">None</option><option value="glasses">Glasses</option><option value="contacts">Contact lenses</option>
          </select>
        </label>
        <label className="field">Eye-to-display distance (cm)
          <input type="number" min="30" max="150" step="1" value={distance} onChange={(event) => setDistance(event.target.valueAsNumber)} required />
        </label>
        <label className="field">Visible display width (cm)
          <input type="number" min="20" max="200" step="0.1" value={displayWidth} onChange={(event) => setDisplayWidth(event.target.valueAsNumber)} required />
        </label>
        <label className="toggle-field field--wide">
          <input type="checkbox" checked={accessible} onChange={(event) => setAccessible(event.target.checked)} />
          <span><strong>Accessible full-text reading route</strong><small>Use for screen readers, severe low vision, or when gaze-responsive text is unsuitable.</small></span>
        </label>
        <button className="primary-button field--wide" type="submit">Start local session</button>
      </form>
    </section>
  );
}
