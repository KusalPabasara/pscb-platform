# Third-party notices

This MVP bundles runtime files from these direct dependencies:

- MediaPipe Tasks Vision and MediaPipe Face Mesh, Apache-2.0. Runtime WASM and support files are copied into `public/mediapipe` by `npm run prepare:assets`. The Face Landmarker model is committed at a pinned SHA-256 value and verified during the build.
- WebGazer, GPL-3.0-or-later. Its built browser file is copied into `public/vendor` solely as an E1 research comparator.
- React and Vite ecosystem packages under their respective package licences.
- Electron 43.4.0, MIT, is used only by the Windows Secure Viewer research client. Electron Packager 20.3.0, BSD-2-Clause, creates the local Windows directory.
- The files under `public/audio` were generated with the ElevenLabs text-to-speech service from fixed generic instruction scripts. ElevenLabs code and credentials are not bundled.

`package-lock.json` pins the complete dependency graph. Review all licences and WebGazer's product-use terms before moving any tracker code into a commercial component.
