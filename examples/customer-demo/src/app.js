import './style.css';

const PLATFORM_URL = String(import.meta.env.VITE_PSCB_PLATFORM_URL || '').replace(/\/$/, '');

const protectedPage = {
  pageId: 'northstar-dashboard-v1',
  label: 'Northstar private workspace',
  title: 'Launch readiness dashboard',
  subtitle: 'Commercial planning, partner readiness, and operating risks for the September release.',
  navigation: ['Overview', 'Partners', 'Finance', 'Risks'],
  blocks: [
    {
      id: 'metrics',
      type: 'metrics',
      items: [
        { label: 'Launch readiness', value: '84%', detail: 'Six checks remaining' },
        { label: 'Invited partners', value: '18', detail: 'Four awaiting approval' },
        { label: 'Forecast value', value: '$1.8M', detail: 'Private planning estimate' },
        { label: 'Open risks', value: '7', detail: 'Two require review' },
      ],
    },
    {
      id: 'trend',
      type: 'chart',
      title: 'Readiness trend',
      summary: 'Weekly completion across product, operations, legal, and support.',
      labels: ['Product', 'Operations', 'Legal', 'Support'],
    },
    {
      id: 'owners',
      type: 'list',
      title: 'Next decisions',
      items: [
        { title: 'Approve partner cohort', detail: 'Owner: Commercial team' },
        { title: 'Close support runbook', detail: 'Owner: Operations lead' },
        { title: 'Confirm launch pricing', detail: 'Owner: Finance lead' },
      ],
    },
    {
      id: 'pipeline',
      type: 'table',
      title: 'Partner pipeline',
      columns: ['Partner', 'Owner', 'Value', 'Status'],
      rows: [
        ['Harbor Media', 'M. Silva', '$420K', 'Review'],
        ['Atlas Learning', 'A. Perera', '$310K', 'Approved'],
        ['Bright Labs', 'R. Fernando', '$265K', 'Legal'],
      ],
    },
  ],
};

const serverCode = [
  'POST /api/v1/sessions',
  'Authorization: Bearer PSCB_API_KEY',
  '',
  '{',
  '  "documentId": "northstar-dashboard-v1",',
  '  "allowedOrigin": "https://customer.example",',
  '  "expiresIn": 300',
  '}',
].join('\n');

const browserCode = [
  'const viewer = new PscbViewer({',
  '  baseUrl: PLATFORM_URL,',
  '  sessionToken: session.token',
  '});',
  '',
  'viewer.mount("#viewer");',
  'viewer.loadPage(protectedPage);',
].join('\n');

document.querySelector('#app').innerHTML =
  '<main>' +
    '<nav class="nav">' +
      '<a class="brand" href="/">Northstar</a>' +
      '<div class="nav-links"><span>Customer portal</span><a id="platform-link" target="_blank" rel="noreferrer">Platform</a></div>' +
    '</nav>' +
    '<header class="hero">' +
      '<div><span class="label">Customer integration proof</span><h1>Protected content in a customer app.</h1><p>The server creates a short-lived session. The browser loads the platform SDK and embeds the authorized page.</p></div>' +
      '<button id="start" class="primary">Generate viewer session</button>' +
    '</header>' +
    '<section class="flow" aria-label="Integration status">' +
      '<article data-step="session"><span>1</span><div><small>Platform API</small><strong>Waiting</strong></div></article>' +
      '<article data-step="sdk"><span>2</span><div><small>Embed SDK</small><strong>Waiting</strong></div></article>' +
      '<article data-step="viewer"><span>3</span><div><small>Protected viewer</small><strong>Waiting</strong></div></article>' +
    '</section>' +
    '<section class="session-panel" hidden>' +
      '<div><small>Session</small><strong id="session-id">—</strong></div>' +
      '<div><small>Allowed origin</small><strong id="allowed-origin">—</strong></div>' +
      '<div><small>Expires</small><strong id="expires-at">—</strong></div>' +
      '<div class="session-actions"><button id="clear" class="secondary">Clear displayed source</button><button id="accessible" class="secondary">Accessible full page</button></div>' +
    '</section>' +
    '<section class="viewer-card">' +
      '<div id="empty-state"><strong>No session yet</strong><span>Generate a session to load the platform viewer.</span></div>' +
      '<div id="viewer"></div>' +
    '</section>' +
    '<section class="integration">' +
      '<div><span class="label">Customer server</span><pre><code id="server-code"></code></pre></div>' +
      '<div><span class="label">Customer browser</span><pre><code id="browser-code"></code></pre></div>' +
    '</section>' +
    '<footer><span>Private Vercel preview</span><span id="last-event">Ready</span></footer>' +
  '</main>';

document.querySelector('#platform-link').href = PLATFORM_URL || '#';
document.querySelector('#server-code').textContent = serverCode;
document.querySelector('#browser-code').textContent = browserCode;

const startButton = document.querySelector('#start');
const clearButton = document.querySelector('#clear');
const accessibleButton = document.querySelector('#accessible');
const emptyState = document.querySelector('#empty-state');
const viewerTarget = document.querySelector('#viewer');
const sessionPanel = document.querySelector('.session-panel');
let viewer = null;
let accessible = false;

startButton.addEventListener('click', startDemo);
clearButton.addEventListener('click', () => viewer?.clearDisplay());
accessibleButton.addEventListener('click', () => {
  accessible = !accessible;
  viewer?.setAccessible(accessible);
  accessibleButton.textContent = accessible ? 'Return to protected view' : 'Accessible full page';
});

async function startDemo() {
  startButton.disabled = true;
  startButton.textContent = 'Creating session…';
  resetSteps();
  viewer?.destroy();
  viewer = null;
  viewerTarget.replaceChildren();
  emptyState.hidden = false;
  sessionPanel.hidden = true;

  try {
    if (!PLATFORM_URL) throw new Error('VITE_PSCB_PLATFORM_URL is not configured.');
    const response = await fetch('/api/session', { method: 'POST' });
    const session = await response.json();
    if (!response.ok) throw new Error(session.error || 'Session request failed.');
    setStep('session', 'Session created', true);
    showSession(session);

    await loadScript(session.delivery.sdkUrl);
    if (!window.PscbViewer) throw new Error('Viewer SDK did not register.');
    setStep('sdk', 'SDK loaded', true);

    viewer = new window.PscbViewer({
      baseUrl: PLATFORM_URL,
      sessionToken: session.token,
      minHeight: '720px',
      title: 'Northstar protected dashboard',
      onEvent(event) {
        document.querySelector('#last-event').textContent = event.type;
        if (event.type === 'viewer.page-loaded') setStep('viewer', 'Page authorized', true);
        if (event.type === 'viewer.error') setStep('viewer', event.payload?.message || 'Viewer error', false);
      },
    });
    viewer.mount(viewerTarget);
    viewer.loadPage(protectedPage);
    emptyState.hidden = true;
    sessionPanel.hidden = false;
    setStep('viewer', 'Authorizing', false);
    startButton.textContent = 'Generate new session';
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Integration failed.';
    setStep('viewer', detail, false);
    document.querySelector('#last-event').textContent = detail;
    startButton.textContent = 'Try again';
  } finally {
    startButton.disabled = false;
  }
}

function showSession(session) {
  document.querySelector('#session-id').textContent = shortId(session.sessionId);
  document.querySelector('#allowed-origin').textContent = session.allowedOrigin;
  document.querySelector('#expires-at').textContent = new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function loadScript(source) {
  const existing = document.querySelector('script[data-pscb-sdk="' + CSS.escape(source) + '"]');
  if (existing) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.dataset.pscbSdk = source;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Unable to load the platform SDK. Open the protected platform URL once, then retry.'));
    document.head.append(script);
  });
}

function setStep(name, text, complete) {
  const element = document.querySelector('[data-step="' + name + '"]');
  element.classList.toggle('complete', complete);
  element.classList.toggle('active', !complete);
  element.querySelector('strong').textContent = text;
}

function resetSteps() {
  document.querySelectorAll('.flow article').forEach((element) => {
    element.className = '';
    element.querySelector('strong').textContent = 'Waiting';
  });
}

function shortId(value) {
  return typeof value === 'string' ? value.slice(0, 8) + '…' + value.slice(-4) : '—';
}
