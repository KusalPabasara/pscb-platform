import { useState } from 'react';

const baseItems = [
  'I have read the study summary and understand participation is voluntary.',
  'I understand that I may stop at any time without giving a reason.',
  'I understand that camera use is optional and camera processing stays on this device.',
  'I understand that derived results are stored in this browser until export or deletion, and research exports should be deleted after 30 days.',
  'I confirm that I do not have a history of photosensitive epilepsy or migraine triggered by screens.',
  'I consent to take part using an anonymous participant code.',
];

export function ConsentStage({ embedded, onAccept }: { embedded?: boolean; onAccept: () => void }) {
  const items = embedded
    ? [...baseItems, 'I understand that this embedded session sends its derived completion summary to the host page.']
    : baseItems;
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
  const complete = checked.every(Boolean);
  return (
    <section className="panel consent-panel">
      <span className="step-label">Consent &amp; safety</span>
      <h1>Before this session begins</h1>
      <p className="lead">This study measures webcam gaze-estimation error and whether a gaze-responsive reading view changes reading speed, comprehension, or visual experience.</p>
      <div className="notice-card">
        <h2>What stays on this device</h2>
        <p>Camera frames, face landmarks, gaze estimates, and gaze traces are processed transiently in this tab. They are not saved or sent. The export contains environmental labels, angular-error measurements, reading time, quiz scores, and your notice response.</p>
      </div>
      {embedded && <div className="notice-card"><h2>Host-page disclosure</h2><p>After an embedded session, the host page receives participant code, tracker label, E1 summary, and E2 speed, quiz, and notice summaries. It does not receive camera data, landmarks, coordinates, or gaze traces. Ask the study lead how the host stores this summary.</p></div>}
      <div className="notice-card notice-card--warm">
        <h2>Comfort and withdrawal</h2>
        <p>The harness does not flash or modulate brightness. Stop immediately if you feel eye strain, headache, dizziness, nausea, or discomfort. Closing the tab stops the camera.</p>
      </div>
      <fieldset className="check-list">
        <legend>Confirm each item</legend>
        {items.map((item, index) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={checked[index]}
              onChange={(event) => setChecked((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.checked : value))}
            />
            <span>{item}</span>
          </label>
        ))}
      </fieldset>
      <button className="primary-button" disabled={!complete} onClick={onAccept}>I consent · continue</button>
      <p className="fine-print">If the health-screening statement is not true, do not begin this protocol. Ask the study lead about a suitable non-study demonstration.</p>
    </section>
  );
}
