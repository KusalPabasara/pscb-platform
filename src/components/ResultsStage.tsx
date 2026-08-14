import { aggregateSessions } from '../lib/metrics';
import type { GateResult, StudySession } from '../types';

export function ResultsStage({ session, onExport, onDelete, onRestart }: {
  session: StudySession;
  onExport: () => void;
  onDelete: () => void;
  onRestart: () => void;
}) {
  const summary = aggregateSessions([session]);
  return (
    <section className="panel results-panel">
      <span className="step-label">Session complete</span>
      <h1>Derived results are ready</h1>
      <p className="lead">This single session is descriptive. Apply the gates to the planned cohort, not one participant.</p>
      <div className="result-grid">
        <ResultCard label="E1 p95 error" value={format(session.e1?.p95Degrees, '°')} gate={session.e1?.gate ?? 'insufficient-data'} detail={session.e1?.eligible ? `${session.e1.samples.length} derived samples` : 'Pointer session · excluded'} />
        <ResultCard label="E2 speed loss" value={format(summary.meanSpeedLossPercent, '%')} gate={summary.e2Gate} detail="Substitution relative to control" />
        <ResultCard label="Quiz delta" value={format(summary.meanQuizDelta, '')} gate="insufficient-data" detail="Substitution minus control" />
        <ResultCard label="Notice" value={summary.noticeRate === null ? '—' : summary.noticeRate ? 'Yes' : 'No'} gate="insufficient-data" detail="Substitution trial response" />
      </div>
      <table className="trial-table">
        <thead><tr><th>Condition</th><th>Passage</th><th>WPM</th><th>Quiz</th><th>Noticed</th></tr></thead>
        <tbody>{session.e2.map((trial) => <tr key={trial.condition}><td>{trial.condition}</td><td>{trial.passageId}</td><td>{trial.wordsPerMinute.toFixed(1)}</td><td>{Math.round(trial.quizScore * 100)}%</td><td>{trial.noticed}</td></tr>)}</tbody>
      </table>
      <div className="result-actions">
        <button className="primary-button" onClick={onExport}>Export anonymous JSON</button>
        <button className="secondary-button" onClick={onDelete}>Delete local data</button>
        <button className="text-button" onClick={onRestart}>Start another session</button>
      </div>
      <div className="notice-card"><strong>Export contents:</strong> derived angular errors, condition metadata, reading times, and answers. No images, landmarks, or gaze coordinates.</div>
    </section>
  );
}

function ResultCard({ label, value, gate, detail }: { label: string; value: string; gate: GateResult; detail: string }) {
  return <div className="result-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small><GateBadge gate={gate} /></div>;
}

function GateBadge({ gate }: { gate: GateResult }) {
  return <span className={`gate gate--${gate}`}>{gate.replace('-', ' ')}</span>;
}

function format(value: number | null | undefined, suffix: string) {
  return value === null || value === undefined ? '—' : `${value.toFixed(2)}${suffix}`;
}
