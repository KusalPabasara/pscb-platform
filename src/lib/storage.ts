import type { StudySession } from '../types';

const KEY = 'pscb-study-session-v1';

export function saveSession(session: StudySession): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): StudySession | null {
  const value = localStorage.getItem(KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as StudySession;
  } catch {
    return null;
  }
}

export function deleteSession(): void {
  localStorage.removeItem(KEY);
}

export function downloadSession(session: StudySession): void {
  const blob = new Blob([`${JSON.stringify(session, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `study-${safeSegment(session.setup.participantCode)}-${session.sessionId.slice(0, 8)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeSegment(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, '-').slice(0, 32) || 'anonymous';
}
