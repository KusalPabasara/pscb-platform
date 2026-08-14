import { cp, mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wasmSource = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const wasmTarget = resolve(root, 'public/mediapipe/wasm');
const modelTarget = resolve(root, 'public/mediapipe/models/face_landmarker.task');
const legacyFaceMeshSource = resolve(root, 'node_modules/@mediapipe/face_mesh');
const legacyFaceMeshTarget = resolve(root, 'public/mediapipe/face_mesh');
const webgazerSource = resolve(root, 'node_modules/webgazer/dist/webgazer.js');
const webgazerTarget = resolve(root, 'public/vendor/webgazer.js');
const modelUrl = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

await mkdir(wasmTarget, { recursive: true });
await cp(wasmSource, wasmTarget, { recursive: true });
await cp(legacyFaceMeshSource, legacyFaceMeshTarget, { recursive: true });
await mkdir(dirname(webgazerTarget), { recursive: true });
await cp(webgazerSource, webgazerTarget);

try {
  await stat(modelTarget);
} catch {
  const response = await fetch(modelUrl);
  if (!response.ok) throw new Error(`Model download failed with status ${response.status}`);
  await mkdir(dirname(modelTarget), { recursive: true });
  await writeFile(modelTarget, new Uint8Array(await response.arrayBuffer()));
}

process.stdout.write('Local MediaPipe runtime assets are ready.\n');
