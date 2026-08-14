# PSCB Secure Viewer — Windows research client

This client loads a customer's real, meaningful HTTPS application inside a hardened Electron window. It does not replace UI text. On Windows it calls Electron's `setContentProtection(true)`, which maps to the operating-system window capture exclusion facility.

The client uses two synchronized windows:

1. An ordinary black backing window remains capturable.
2. The real web application is displayed in a protected window directly above it.
3. Supported Windows capture paths exclude the upper window and therefore record the black backing rectangle.

This is a research MVP, not DRM. It does not stop physical cameras, manual copying, compromised/rooted endpoints, kernel-level tools, or every third-party capture implementation.

## Run locally

```bash
npm install
npm test
npm start -- --url=http://127.0.0.1:4173/secure-viewer
```

Start the parent Vite application on port 4173 first. Add every permitted customer origin to `viewer.config.json`; arbitrary navigation is rejected.

## Package Windows x64

```bash
npm run package:windows
```

The unpacked application is written outside this directory under `../deliverables/secure-viewer/`. Package signing and an installer are required before external distribution.

## Verify on Windows

```powershell
.\scripts\verify-black-capture.ps1 `
  -Executable "..\deliverables\secure-viewer\PSCB Secure Viewer-win32-x64\PSCB Secure Viewer.exe" `
  -Url "https://YOUR-PROTECTED-HOST/secure-viewer"
```

The verifier uses a normal Windows screen-copy path, crops the viewer bounds, saves the result, and requires at least 95% near-black sampled pixels. Run additional tests with Snipping Tool, Windows Graphics Capture, Teams, Zoom, and the customer's supported endpoint matrix.
