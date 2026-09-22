// Release-only checks, driven by current config rather than an old hardcoded build.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const output = process.argv[2] || 'public';
const config = readFileSync('data/nika.yaml', 'utf8');
function setting(name) {
  return config.match(new RegExp(`^${name}: "([^"]*)"`, 'm'))?.[1];
}
const html = readFileSync(join(output, 'apps/nika/index.html'), 'utf8');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
  .map(([, name, double, single, bare]) => [name, double ?? single ?? bare]));
const mac = [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => attrs(tag))
  .filter(a => a['data-download-platform'] === 'macos');
assert.equal(mac.length, 7, 'All seven Mac download entry points must be present');
for (const a of mac) {
  assert.equal(a.href, setting('macos_url'));
  assert.equal(a['data-download-state'], 'beta');
}
assert.match(setting('macos_url'), /^https:\/\/github\.com\/vmw25\/vwedagedera\/releases\/download\/nika-v/);
assert.match(setting('macos_sha256'), /^[a-f0-9]{64}$/, 'Release config must include a package checksum');
assert.ok(html.includes(setting('macos_release_notes_url')), 'Page must link to release notes and checksums');
assert.ok(html.includes(setting('version')), 'Page must identify the released version');
assert.match(html, /8\.99/);
assert.match(html, /19\.99/);
assert.match(html, /79/);
assert.ok(html.includes('notar'), 'Beta notarisation warning must remain');
assert.equal(setting('windows_url'), '', 'This update must not enable an untested Windows installer');
console.log(`Verified ${mac.length} Mac beta links, checksum, version, pricing and release limits.`);
