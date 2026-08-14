import { createHash } from 'node:crypto';
import { cp, mkdir, readFile } from 'node:fs/promises';
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
const modelSha256 = '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff';

await mkdir(wasmTarget, { recursive: true });
await cp(wasmSource, wasmTarget, { recursive: true });
await cp(legacyFaceMeshSource, legacyFaceMeshTarget, { recursive: true });
await mkdir(dirname(webgazerTarget), { recursive: true });
await cp(webgazerSource, webgazerTarget);

const model = await readFile(modelTarget);
const modelDigest = createHash('sha256').update(model).digest('hex');
if (modelDigest !== modelSha256) throw new Error('Committed MediaPipe model checksum does not match.');

process.stdout.write('Local MediaPipe runtime assets are ready.\n');
