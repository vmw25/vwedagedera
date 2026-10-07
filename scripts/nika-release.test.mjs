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
    for (const file of ['layouts/nika/single.html', 'assets/css/nika.css', 'assets/js/nika-showcase.mjs',
      'assets/css/nika-walkthrough.css', 'assets/js/nika-walkthrough.mjs',
      'data/nika_walkthrough.yaml', 'data/nika_walkthrough_images.json']) cpSync(join(source, file), join(fixture, file));
    cpSync(join(source, 'layouts/partials/nika'), join(fixture, 'layouts/partials/nika'), { recursive: true });
    cpSync(join(source, 'content/sidequests/nika/index.md'), join(fixture, 'content/sidequests/nika/index.md'));
    writeFileSync(join(fixture, 'hugo.toml'), 'baseURL = "https://site.invalid/"\n');
    writeFileSync(join(fixture, 'data/nika.json'), JSON.stringify({
      account_url: 'https://account.invalid', showcase: [], demo_video_url: '', ...config,
    }));
    const result = spawnSync(process.env.HUGO_BIN || 'hugo', ['--source', fixture, '--logLevel', 'warn'], { encoding: 'utf8' });
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr,
      html: result.status === 0 ? readFileSync(join(fixture, 'public/apps/nika/index.html'), 'utf8') : '' };
  } finally { rmSync(fixture, { recursive: true, force: true }); }
}
function links(html, platform) {
  return [...html.matchAll(new RegExp(`<a[^>]+data-download-platform="${platform}"[^>]*>`, 'g'))].map(m => m[0]);
}
test('web workspace stays hidden until explicitly released', () => {
  const { status, html, output } = render({ web_beta_ready: false, web_beta_url: 'https://app.vidunwedagedera.com/workspace' });
  assert.equal(status, 0, output);
  assert.doesNotMatch(html, /data-web-beta|https:\/\/app\.vidunwedagedera\.com\/workspace/);
});
test('released web workspace has two direct account entry points', () => {
  const { status, html, output } = render({ web_beta_ready: true, web_beta_url: 'https://app.vidunwedagedera.com/workspace' });
  assert.equal(status, 0, output);
  assert.equal((html.match(/data-web-beta/g) || []).length, 2);
  assert.equal((html.match(/href="https:\/\/app\.vidunwedagedera\.com\/workspace"/g) || []).length, 2);
});
test('web release fails closed if its destination is missing or unverified', () => {
  for (const url of ['', 'https://unverified.invalid/workspace', 'javascript:alert(1)']) {
    const { status, output } = render({ web_beta_ready: true, web_beta_url: url });
    assert.notEqual(status, 0);
    assert.match(output, /verified account workspace URL/);
  }
});
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
const beta = { launch_ready: false, macos_beta: true, macos_url: mac, windows_url: '',
  version: '1.5.0 beta', macos_sha256: 'a'.repeat(64), macos_release_notes_url: 'https://downloads.invalid/release' };
test('explicit Mac beta is downloadable with current account availability and notarisation warnings', () => {
  const { status, html, output } = render(beta);
  assert.equal(status, 0, output);
  assert.equal(links(html, 'macos').length, 7);
  links(html, 'macos').forEach(a => {
    assert.ok(a.includes(`href="${mac}"`));
    assert.match(a, /data-download-state="beta"/);
    assert.match(a, /aria-describedby="macos-beta-warning"/);
  });
  links(html, 'windows').forEach(a => assert.match(a, /data-download-state="pending"/));
  assert.match(html, /Not notarised by Apple/);
  assert.match(html, /Account-linked plans and UK paid checkout are available/);
  assert.match(html, /macOS 14/);
  assert.match(html, /Do not replace a personal\/founder/);
  assert.match(html, /Release notes, upgrade instructions and checksum/);
  assert.match(html, /noindex,follow/);
  assert.doesNotMatch(html, /data-installer="windows"|Public installers are not available yet|Ready to download/);
});
for (const field of ['macos_url', 'version', 'macos_sha256', 'macos_release_notes_url']) {
  test(`Mac beta fails closed without ${field}`, () => {
    const result = render({ ...beta, [field]: '' });
    assert.notEqual(result.status, 0);
    assert.match(result.output, /Mac beta requires/);
  });
}
test('Windows cannot inherit Mac beta availability', () => {
  const { status, html, output } = render({ ...beta, windows_url: windows });
  assert.equal(status, 0, output);
  assert.doesNotMatch(html, /href="https:\/\/downloads.invalid\/nika-x64.exe"/);
});
const windowsBeta = { launch_ready: false, windows_beta: true, windows_url: windows,
  version: '1.5.15 beta', windows_sha256: 'b'.repeat(64), windows_release_notes_url: 'https://downloads.invalid/windows-release' };
test('different native release versions are labelled separately', () => {
  const { status, html, output } = render({ ...beta, ...windowsBeta,
    macos_version: '1.5.16, build 54', windows_version: '1.5.15, build 53' });
  assert.equal(status, 0, output);
  const macSection = html.split('id="download-macos"')[1].split('</article>')[0];
  const windowsSection = html.split('id="download-windows"')[1].split('</article>')[0];
  assert.match(macSection, /1\.5\.16, build 54/);
  assert.doesNotMatch(macSection, /1\.5\.15, build 53/);
  assert.match(windowsSection, /1\.5\.15, build 53/);
  assert.doesNotMatch(windowsSection, /1\.5\.16, build 54/);
});
test('Windows beta is independent and all seven links use the verified installer', () => {
  const { status, html, output } = render(windowsBeta);
  assert.equal(status, 0, output);
  assert.equal(links(html, 'windows').length, 7);
  links(html, 'windows').forEach(a => {
    assert.ok(a.includes(`href="${windows}"`));
    assert.match(a, /data-download-state="beta"/);
    assert.match(a, /aria-describedby="windows-beta-warning"/);
  });
  links(html, 'macos').forEach(a => assert.match(a, /data-download-state="pending"/));
  assert.match(html, /Download Windows beta/);
  assert.match(html, /publisher verification is not yet available/);
  assert.match(html, /not Windows on ARM/);
  assert.doesNotMatch(html, /macos-beta-warning|Public installers are not available yet/);
});
for (const field of ['windows_url', 'version', 'windows_sha256', 'windows_release_notes_url']) {
  test(`Windows beta fails closed without ${field}`, () => {
    const result = render({ ...windowsBeta, [field]: '' });
    assert.notEqual(result.status, 0);
    assert.match(result.output, /Windows beta requires/);
  });
}
test('Mac and Windows betas retain distinct installation warnings', () => {
  const { status, html, output } = render({ ...beta, ...windowsBeta });
  assert.equal(status, 0, output);
  for (const platform of ['macos', 'windows']) {
    links(html, platform).forEach(a => assert.match(a, new RegExp(`aria-describedby="${platform}-beta-warning"`)));
  }
  assert.match(html, /Not notarised by Apple/);
  assert.match(html, /publisher verification is not yet available/);
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
