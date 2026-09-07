import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Render the actual Hugo template in an isolated fixture, not the served preview.
// Synthetic installer URLs are never fetched or written into production site data.
const source = resolve(import.meta.dirname, '..');
const mac = 'https://downloads.invalid/nika-arm64.dmg';
const windows = 'https://downloads.invalid/nika-x64.exe';
function render(config) {
  const fixture = mkdtempSync(join(tmpdir(), 'nika-download-test-'));
  try {
    for (const dir of ['layouts/nika', 'layouts/partials/nika', 'assets/css', 'assets/js', 'content/sidequests/nika', 'data']) mkdirSync(join(fixture, dir), { recursive: true });
    for (const file of ['layouts/nika/single.html', 'assets/css/nika.css', 'assets/js/nika-showcase.mjs']) cpSync(join(source, file), join(fixture, file));
    cpSync(join(source, 'layouts/partials/nika'), join(fixture, 'layouts/partials/nika'), { recursive: true });
    cpSync(join(source, 'content/sidequests/nika/index.md'), join(fixture, 'content/sidequests/nika/index.md'));
    writeFileSync(join(fixture, 'hugo.toml'), 'baseURL = "https://site.invalid/"\n');
    writeFileSync(join(fixture, 'data/nika.json'), JSON.stringify({
      account_url: 'https://account.invalid', showcase: [], demo_video_url: '', ...config,
    }));
    const result = spawnSync(process.env.HUGO_BIN || 'hugo', ['--source', fixture, '--logLevel', 'warn'], { encoding: 'utf8' });
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr,
      html: result.status === 0 ? readFileSync(join(fixture, 'public/sidequests/nika/index.html'), 'utf8') : '' };
  } finally { rmSync(fixture, { recursive: true, force: true }); }
}
function links(html, platform) {
  return [...html.matchAll(new RegExp(`<a[^>]+data-download-platform="${platform}"[^>]*>`, 'g'))].map(m => m[0]);
}
test('pending release gives seven real status links per platform, with no dead buttons', () => {
  const { status, html, output } = render({ launch_ready: false, macos_url: '', windows_url: '' });
  assert.equal(status, 0, output);
  for (const platform of ['macos', 'windows']) {
    const actions = links(html, platform);
    assert.equal(actions.length, 7);
    actions.forEach(a => { assert.match(a, new RegExp(`href="#download-${platform}"`)); assert.match(a, /data-download-state="pending"/); assert.match(a, /aria-label="(?:macOS|Windows) downloads, not available yet"/); });
    assert.ok(html.includes(`id="download-${platform}"`));
  }
  assert.doesNotMatch(html, /<button[^>]*disabled|data-installer=/);
  assert.doesNotMatch(html, /href="[^"#]*\/signup"/);
});
test('launch gate prevents populated URLs leaking as active downloads', () => {
  const { status, html, output } = render({ launch_ready: false, macos_url: mac, windows_url: windows });
  assert.equal(status, 0, output);
  assert.doesNotMatch(html, /href="https:\/\/downloads\.invalid|data-installer=/);
});
test('one verified platform can be available without making the other appear released', () => {
  const { status, html, output } = render({ launch_ready: true, macos_url: mac, windows_url: '' });
  assert.equal(status, 0, output);
  links(html, 'macos').forEach(a => assert.ok(a.includes(`href="${mac}"`)));
  links(html, 'windows').forEach(a => assert.match(a, /href="#download-windows"/));
  assert.match(html, /data-installer="macos"/);
  assert.doesNotMatch(html, /data-installer="windows"/);
});
test('both released platforms have consistent one-click installer links and useful setup text', () => {
  const { status, html, output } = render({ launch_ready: true, macos_url: mac, windows_url: windows, version: 'fixture' });
  assert.equal(status, 0, output);
  for (const [platform, url] of [['macos', mac], ['windows', windows]]) {
    assert.equal(links(html, platform).length, 7);
    links(html, platform).forEach(a => { assert.ok(a.includes(`href="${url}"`)); assert.match(a, /data-download-state="ready"/); });
  }
  assert.match(html, /AnkiConnect/);
  assert.match(html, /Create your account/);
  assert.match(html, /data-installer="windows"/);
  assert.match(html, /Open the \.dmg and drag nika into Applications/);
  assert.match(html, /Open the \.exe installer/);
});
for (const [platform, url] of [
  ['macos', 'http://downloads.invalid/nika.pkg'],
  ['macos', 'javascript:alert(1)'],
  ['macos', 'https://downloads.invalid/nika.exe'],
  ['macos', 'https://downloads.invalid/nika.pkg'],
  ['windows', 'https://downloads.invalid/nika.dmg'],
  ['windows', 'https://downloads.invalid/nika.zip'],
  ['windows', 'https://downloads.invalid/login'],
]) test(`invalid ${platform} installer URL fails the build: ${url}`, () => {
  const result = render({ launch_ready: true, [`${platform}_url`]: url });
  assert.notEqual(result.status, 0);
  assert.match(result.output, /requires a verified public HTTPS installer URL/);
});
