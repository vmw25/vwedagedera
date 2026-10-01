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
// Billing assertions live in the version-aware pricing checker. A release
// must not pin this page to retired prices when the approved rollout is live.
const { checkPricing } = await import('./check-nika-pricing.mjs');
checkPricing(html);
assert.ok(html.includes('notar'), 'Beta notarisation warning must remain');
const windowsBeta = /^windows_beta: true$/m.test(config);
const windows = [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => attrs(tag))
  .filter(a => a['data-download-platform'] === 'windows');
assert.equal(windows.length, 7, 'All seven Windows entry points must be present');
for (const a of windows) {
  assert.equal(a.href, windowsBeta ? setting('windows_url') : '#download-windows');
  assert.equal(a['data-download-state'], windowsBeta ? 'beta' : 'pending');
}
if (windowsBeta) {
  assert.match(setting('windows_url'), /^https:\/\/github\.com\/vmw25\/vwedagedera\/releases\/download\/nika-v[^\s]+\.exe$/);
  assert.match(setting('windows_sha256'), /^[a-f0-9]{64}$/);
  assert.ok(html.includes(setting('windows_release_notes_url')));
  assert.match(html, /windows-beta-warning/);
} else {
  assert.equal(setting('windows_url'), '', 'Do not pre-populate an untested Windows installer');
}
console.log(`Verified ${mac.length} Mac and ${windows.length} Windows links, checksums, pricing and release limits.`);
