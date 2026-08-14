'use strict';

const { app, BrowserWindow, Menu, session, shell } = require('electron');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { isAllowedNavigation, isBlockedAccelerator, requestedSession } = require('./policy.cjs');

const config = JSON.parse(readFileSync(join(__dirname, 'viewer.config.json'), 'utf8'));
let backingWindow = null;
let contentWindow = null;
let activeSession = null;

if (!app.requestSingleInstanceLock()) app.quit();

app.on('second-instance', (_event, argv) => {
  try {
    openSession(requestedSession(argv, config));
  } catch (error) {
    showFailure(error.message);
  }
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  if (!app.isReady()) return;
  try {
    openSession(requestedSession([url], config));
  } catch (error) {
    showFailure(error.message);
  }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  if (process.defaultApp && process.argv[1]) app.setAsDefaultProtocolClient('pscb-secure', process.execPath, [process.argv[1]]);
  else app.setAsDefaultProtocolClient('pscb-secure');
  installSessionPolicy();
  try {
    openSession(requestedSession(process.argv, config));
  } catch (error) {
    createWindows();
    showFailure(error.message);
  }
});

app.on('window-all-closed', () => app.quit());

function installSessionPolicy() {
  const viewerSession = session.fromPartition('persist:pscb-secure');
  viewerSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  viewerSession.on('will-download', (event) => event.preventDefault());
  viewerSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    if (isAllowedNavigation(details.url, config)) {
      headers['X-PSCB-Secure-Viewer'] = '1';
      if (activeSession) headers['X-PSCB-Session'] = activeSession;
    }
    callback({ requestHeaders: headers });
  });
}

function createWindows() {
  if (contentWindow && !contentWindow.isDestroyed()) return;
  const bounds = { width: 1440, height: 900 };
  backingWindow = new BrowserWindow({
    ...bounds,
    show: false,
    backgroundColor: '#000000',
    frame: false,
    focusable: false,
    skipTaskbar: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  backingWindow.loadURL('data:text/html,<body style="margin:0;background:%23000"></body>');

  contentWindow = new BrowserWindow({
    ...bounds,
    show: false,
    parent: backingWindow,
    title: 'PSCB Secure Viewer',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      partition: 'persist:pscb-secure',
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
    },
  });

  // Windows maps this to WDA_EXCLUDEFROMCAPTURE. The ordinary black parent
  // remains in the compositor so supported capture paths receive a black area.
  contentWindow.setContentProtection(true);
  contentWindow.webContents.setUserAgent(`${contentWindow.webContents.getUserAgent()} PSCB-Secure-Viewer/0.1`);
  contentWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url, config)) contentWindow.loadURL(url);
    return { action: 'deny' };
  });
  contentWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url, config)) event.preventDefault();
  });
  contentWindow.webContents.on('before-input-event', (event, input) => {
    if (isBlockedAccelerator(input)) event.preventDefault();
  });
  contentWindow.webContents.on('will-prevent-unload', (event) => event.preventDefault());
  contentWindow.on('move', synchronizeBackingWindow);
  contentWindow.on('resize', synchronizeBackingWindow);
  contentWindow.on('minimize', () => backingWindow?.minimize());
  contentWindow.on('restore', () => backingWindow?.restore());
  contentWindow.on('closed', () => {
    contentWindow = null;
    backingWindow?.close();
    backingWindow = null;
  });
  contentWindow.once('ready-to-show', () => {
    synchronizeBackingWindow();
    backingWindow.showInactive();
    contentWindow.show();
    contentWindow.focus();
  });
}

function synchronizeBackingWindow() {
  if (!contentWindow || !backingWindow || contentWindow.isDestroyed() || backingWindow.isDestroyed()) return;
  backingWindow.setBounds(contentWindow.getBounds());
}

function openSession(next) {
  activeSession = next.session;
  createWindows();
  contentWindow.loadURL(next.url).catch((error) => showFailure(error.message));
  if (contentWindow.isMinimized()) contentWindow.restore();
  contentWindow.show();
  contentWindow.focus();
}

function showFailure(message) {
  createWindows();
  const safe = String(message).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  contentWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<style>body{margin:0;display:grid;min-height:100vh;place-content:center;background:#08130d;color:#e8f1ea;font:16px system-ui;text-align:center}main{max-width:620px;padding:40px}h1{font:38px Georgia}p{color:#abc0b0;line-height:1.6}</style><main><h1>Secure session unavailable</h1><p>${safe}</p></main>`)}`);
}

process.on('uncaughtException', (error) => {
  showFailure(error.message);
  shell.beep();
});
