import { createRoot } from 'react-dom/client';
import { App } from './App';
import { DemoPage } from './pages/DemoPage';
import { DocsPage } from './pages/DocsPage';
import { CursorDemoPage } from './pages/CursorDemoPage';
import { LandingPage } from './pages/LandingPage';
import { ProtectionDemoPage } from './pages/ProtectionDemoPage';
import { ViewerPage } from './pages/ViewerPage';
import { WebPageDemoPage } from './pages/WebPageDemoPage';
import { SecureViewerPage } from './pages/SecureViewerPage';
import { CaptureResearchPage } from './pages/CaptureResearchPage';
import type { ParticipantSetup, TrackerKind } from './types';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element is missing.');

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const query = new URLSearchParams(window.location.search);
const tracker = query.get('tracker');
const initialTracker: TrackerKind | undefined = tracker === 'webgazer' || tracker === 'mediapipe' || tracker === 'pointer' ? tracker : undefined;
const initialSetup: Partial<Pick<ParticipantSetup, 'participantCode' | 'tracker' | 'accessibilityMode'>> = {
  participantCode: query.get('participant') ?? undefined,
  tracker: initialTracker,
  accessibilityMode: query.get('accessible') === '1',
};

const page = path === '/study'
  ? <App initialSetup={initialSetup} />
  : path === '/embed'
    ? <App embedded initialSetup={initialSetup} />
    : path === '/demo'
      ? <DemoPage />
      : path === '/cursor-demo'
        ? <CursorDemoPage />
      : path === '/protection-demo'
        ? <ProtectionDemoPage />
      : path === '/webpage-demo'
        ? <WebPageDemoPage />
      : path === '/secure-viewer'
        ? <SecureViewerPage />
      : path === '/capture-research'
        ? <CaptureResearchPage />
      : path === '/viewer'
        ? <ViewerPage />
      : path === '/docs'
        ? <DocsPage />
        : <LandingPage />;

createRoot(root).render(page);
