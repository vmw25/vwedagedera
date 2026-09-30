import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../.github/workflows/nika-windows-candidate.yml', import.meta.url), 'utf8');

test('Windows candidate build requires owner dispatch and read-only source access', () => {
  assert.match(source, /workflow_dispatch:/);
  assert.doesNotMatch(source, /^  (push|pull_request|pull_request_target|schedule):/m);
  assert.match(source, /github\.actor == 'vmw25'/);
  assert.match(source, /contents: read/);
  assert.doesNotMatch(source, /(?:contents|id-token|pages): write/);
  assert.match(source, /persist-credentials: false/);
  assert.match(source, /NIKA_WINDOWS_SOURCE_READ_KEY/);
  assert.match(source, /sparse-checkout-cone-mode: false/);
  assert.match(source, /Source commit mismatch/);
  for (const action of source.matchAll(/uses: ([^\n]+)/g)) {
    assert.match(action[1], /^[^@]+@[a-f0-9]{40}(?:\s|$)/);
  }
});

test('Only native installer and unsigned Store candidates are uploaded, never source, keys or logs', () => {
  assert.match(source, /runs-on: windows-2025/);
  assert.match(source, /scripts\/accept_tauri_windows\.py/);
  assert.match(source, /--sign-windows-update-locally/);
  assert.doesNotMatch(source, /TAURI_SIGNING_PRIVATE_KEY/);
  assert.match(source, /retention-days: 3/);
  // End each allow-list at its indentation boundary, not at end-of-file.
  const paths = [...source.matchAll(/^          path: \|\n((?:            [^\n]+\n)+)/gm)]
    .map(match => match[1].trim().split('\n').map(s => s.trim()));
  assert.deepEqual(paths, [
    ['dist/tauri/*.exe', 'dist/tauri/*.exe.json', 'dist/tauri/*.exe.sha256',
      'dist/tauri/windows-acceptance.json', 'dist/tauri/windows-provenance.json'],
    ['dist/store/*.msix', 'dist/store/verification.json', 'dist/store/AppxManifest.xml'],
  ]);
  const singlePaths = [...source.matchAll(/^          path: (?!\|)([^\n]+)$/gm)].map(match => match[1]);
  assert.deepEqual(singlePaths, ['dist/store/native-acceptance.json']);
  assert.match(source, /scripts\.package_windows_store/);
  assert.match(source, /scripts\.accept_windows_store/);
  assert.match(source, /desktop\/store-identity\.json/);
  assert.doesNotMatch(source, /if: (?:always|failure)\(\)/);
  assert.doesNotMatch(source, /gh release|deploy-pages|upload-pages-artifact/);
});
