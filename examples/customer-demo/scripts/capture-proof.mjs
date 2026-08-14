import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const PLATFORM_PORT = Number(process.env.PLATFORM_PORT || 3100);
const CUSTOMER_PORT = Number(process.env.CUSTOMER_PORT || 3101);
const DEBUG_PORT = Number(process.env.PROOF_DEBUG_PORT || 9231);
const hosted = Boolean(process.env.HOSTED_PLATFORM_URL && process.env.HOSTED_CUSTOMER_URL);
const platformDir = resolve('../study-harness');
const customerDir = resolve('.');
const outputPath = resolve(process.env.PROOF_OUTPUT || 'docs/screenshots/customer-demo-session.png');
const pageUrl = hosted ? new URL(process.env.HOSTED_CUSTOMER_URL).origin : 'http://127.0.0.1:' + CUSTOMER_PORT;
const platformUrl = hosted ? new URL(process.env.HOSTED_PLATFORM_URL).origin : 'http://127.0.0.1:' + PLATFORM_PORT;
const temporary = await mkdtemp(join(tmpdir(), 'pscb-customer-proof-'));
const apiKey = 'local-' + randomBytes(24).toString('hex');
const signingSecret = 'local-' + randomBytes(32).toString('hex');
const processes = [];

try {
  await mkdir(dirname(outputPath), { recursive: true });
  if (!hosted && process.env.USE_EXISTING !== '1') {
    launch('npx', ['vercel', 'dev', '--listen', String(PLATFORM_PORT), '--yes'], {
      cwd: platformDir,
      env: { ...process.env, PSCB_API_KEY: apiKey, PSCB_SESSION_SECRET: signingSecret },
    });
    await waitForHttp(platformUrl + '/api/health', 30_000);
    launch('npx', ['vercel', 'dev', '--listen', String(CUSTOMER_PORT), '--yes'], {
      cwd: customerDir,
      env: {
        ...process.env,
        VITE_PSCB_PLATFORM_URL: platformUrl,
        PSCB_PLATFORM_URL: platformUrl,
        PSCB_API_KEY: apiKey,
      },
    });
    await waitForHttp(pageUrl, 30_000);
  }

  const initialUrl = hosted ? 'about:blank' : pageUrl;
  launch('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--test-type',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--hide-scrollbars',
    '--no-first-run',
    '--force-device-scale-factor=1',
    '--window-size=1600,1400',
    '--remote-debugging-port=' + DEBUG_PORT,
    '--user-data-dir=' + join(temporary, 'chrome-profile'),
    initialUrl,
  ]);

  const target = await waitForPageTarget(DEBUG_PORT, initialUrl, 20_000);
  const cdp = await connectCdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.bringToFront');
  if (hosted) {
    const platformAccessUrl = protectedAccessUrl(platformUrl, process.env.PLATFORM_BYPASS);
    const customerAccessUrl = protectedAccessUrl(pageUrl, process.env.CUSTOMER_BYPASS);
    await cdp.send('Page.navigate', { url: platformAccessUrl });
    await waitForExpression(cdp, 'location.origin === ' + JSON.stringify(platformUrl), 20_000);
    await cdp.send('Page.navigate', { url: customerAccessUrl });
  }
  await waitForExpression(cdp, "document.querySelector('#start') !== null", 10_000);
  await clickElement(cdp, '#start');
  await waitForExpression(cdp, "document.querySelector('[data-step=\"viewer\"]').classList.contains('complete')", 20_000);

  const state = await cdp.evaluate("(() => ({ session: document.querySelector('[data-step=\"session\"] strong').textContent, sdk: document.querySelector('[data-step=\"sdk\"] strong').textContent, viewer: document.querySelector('[data-step=\"viewer\"] strong').textContent, event: document.querySelector('#last-event').textContent, iframe: Boolean(document.querySelector('#viewer iframe')), allowedOrigin: document.querySelector('#allowed-origin').textContent }))()");
  if (state.session !== 'Session created' || state.sdk !== 'SDK loaded' || state.viewer !== 'Page authorized' || !state.iframe) {
    throw new Error('Integration did not reach the authorized viewer state: ' + JSON.stringify(state));
  }
  if (state.allowedOrigin !== pageUrl) throw new Error('Session origin mismatch: ' + state.allowedOrigin);

  await clickElement(cdp, '#clear');
  await waitForExpression(cdp, "document.querySelector('#last-event').textContent === 'viewer.display-cleared'", 10_000);
  await cdp.evaluate('window.scrollTo(0, 365)');
  await sleep(500);
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'));
  cdp.close();

  console.log('session_api=' + state.session);
  console.log('sdk=' + state.sdk);
  console.log('viewer=' + state.viewer);
  console.log('origin=' + state.allowedOrigin);
  console.log('clear_event=viewer.display-cleared');
  console.log('screenshot=' + outputPath);
} finally {
  for (const child of processes.reverse()) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  await sleep(400);
  await rm(temporary, { recursive: true, force: true });
}

function launch(command, args, options = {}) {
  const child = spawn(command, args, { stdio: 'ignore', ...options });
  processes.push(child);
  child.on('error', (error) => console.error(command + ' failed to start: ' + error.message));
  return child;
}

function protectedAccessUrl(origin, secret) {
  if (!secret) throw new Error('Hosted proof requires both Vercel bypass secrets.');
  const url = new URL(origin);
  url.searchParams.set('x-vercel-protection-bypass', secret);
  url.searchParams.set('x-vercel-set-bypass-cookie', 'samesitenone');
  return url.toString();
}

async function clickElement(cdp, selector) {
  const point = await cdp.evaluate("(() => { const element = document.querySelector('" + selector + "'); if (!element) return null; const rect = element.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()");
  if (!point) throw new Error('Missing element: ' + selector);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
}

async function waitForExpression(cdp, expression, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate('Boolean(' + expression + ')')) return;
    await sleep(150);
  }
  throw new Error('Timed out waiting for browser state: ' + expression);
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Local server startup races the first requests.
    }
    await sleep(250);
  }
  throw new Error('Timed out waiting for ' + url);
}

async function waitForPageTarget(port, url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      const page = targets.find((candidate) => candidate.type === 'page' && candidate.url.startsWith(url));
      if (page) return page;
    } catch {
      // Chrome may not have opened its debugging socket yet.
    }
    await sleep(200);
  }
  throw new Error('Timed out waiting for Chrome.');
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolveSocket, reject) => {
    socket.onopen = resolveSocket;
    socket.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const callbacks = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callbacks.reject(new Error(message.error.message));
    else callbacks.resolve(message.result);
  };
  return {
    send(method, params = {}) {
      return new Promise((resolveRequest, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve: resolveRequest, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    async evaluate(expression) {
      const response = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Browser evaluation failed.');
      return response.result.value;
    },
    close() {
      socket.close();
    },
  };
}

function sleep(milliseconds) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));
}
