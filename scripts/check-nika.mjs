import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const output = resolve(process.argv[2] || 'public');
const page = join(output, 'apps/nika/index.html');
const html = readFileSync(page, 'utf8');
const ids = new Set([...html.matchAll(/\bid=(?:["']([^"']+)["']|([^\s>]+))/g)].map(m => m[1] || m[2]));
assert.match(html, /https:\/\/vidunwedagedera\.com\/apps\/nika\//);
assert.match(html, /Your cards\. Your style\./);
assert.match(html, /Upload anything\. Get cards indistinguishable from your own\./);
const heading = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/)?.[0];
assert.match(heading, /id=(?:"showcase-phrase"|showcase-phrase)[ >]/, 'Rotating phrase must stay in the opening headline');
assert.match(heading, /aria-hidden=(?:"true"|true)/);
assert.match(heading, /sr-only/);
assert.equal((heading.match(/class=(?:"hero-phrase-sizer"|hero-phrase-sizer)/g) || []).length, 6, 'Reserve space for every phrase without layout jumps');
assert.match(html, /example numbers/);
assert.equal((html.match(/<details[ >]/g) || []).length, 8);
assert.equal((html.match(/<button[^>]*disabled/g) || []).length, 0, 'Release status must not be an inert button');
assert.match(html, /Early-access beta/);
assert.match(html, /Not notarised by Apple/);
assert.match(html, /Full customer account and payment testing is still in progress/);
assert.match(html, /Release notes, upgrade instructions and checksum/);
assert.ok(ids.has('download-macos') && ids.has('download-windows'), 'Each platform needs a real status destination');
assert.equal(ids.size, [...html.matchAll(/\bid=(?:["']([^"']+)["']|([^\s>]+))/g)].length, 'IDs must be unique');
assert.equal((html.match(/data-download-platform=(?:"macos"|macos)/g) || []).length, 7);
assert.equal((html.match(/data-download-platform=(?:"windows"|windows)/g) || []).length, 7);
// Release availability and versions come from current configuration, not an
// obsolete Mac-only release. This also checks all seven links per platform.
await import('./check-nika-release.mjs');
assert.match(html, /Only if you opt in/);
assert.match(html, /not automatic retraining of the underlying language or vision models/);
assert.match(html, /Exact style matching is not guaranteed/);
assert.match(html, /convolutional neural network \(CNN\)/);
assert.match(html, /large language model \(LLM\)/);
assert.match(html, /machine-learning ranker/);
assert.match(html, /class=(?:"intelligence-grid"|intelligence-grid)/);
assert.doesNotMatch(html, /technical-detail/, 'The technical explanation must be visible, not hidden in disclosures');
assert.ok(ids.has('technology'));
assert.doesNotMatch(html, /\/signup/, 'Installation, not website signup, is the primary new-user path');
assert.match(html, /\/signin/);
assert.match(html, /<table[^>]*comparison/);
assert.match(html, /Recommended/);
const { checkPricing } = await import('./check-nika-pricing.mjs');
checkPricing(html);
assert.doesNotMatch(html, /<figcaption[ >]|[—–]|&#(?:8211|8212);|&(?:mdash|ndash);/);
assert.doesNotMatch(html, /<video[ >]/, 'Demo must not appear until the owner supplies a real video');
assert.match(html, /data-nika-showcase/);
assert.equal((html.match(/data-showcase-panel[\s>]/g) || []).length, 6);
assert.equal((html.match(/data-showcase-choice=/g) || []).length, 6);
assert.match(html, /Pause showcase/);
assert.match(html, /aria-roledescription=(?:"carousel"|carousel)/);
assert.match(html, /nika-showcase\./);
assert.doesNotMatch(html, /data-nika-demo|Watch the demo/, 'No empty video player or dead Watch control without footage');
assert.doesNotMatch(html, /example\.com|localhost|127\.0\.0\.1|sk_live_|sk_test_|re_[A-Za-z0-9]{20}/);
const localRefs = [...html.matchAll(/\b(?:href|src)=(?:["']([^"']+)["']|([^\s>]+))/g)].map(m => m[1] || m[2]);
assert.ok(localRefs.length > 20, 'Expected all rendered navigation, screenshot and account links');
for (const ref of localRefs) {
  if (ref.startsWith('#')) {
    assert.ok(ids.has(ref.slice(1)), 'Missing anchor: ' + ref);
  } else if (ref.startsWith('/') && !ref.startsWith('//')) {
    const path = ref.split(/[?#]/)[0];
    const target = join(output, path, path.endsWith('/') ? 'index.html' : '');
    assert.ok(existsSync(target), 'Missing internal link/asset: ' + ref);
  }
}
for (const file of ['index.html', 'apps/index.html', 'projects/cs50/index.html']) {
  const other = readFileSync(join(output, file), 'utf8');
  assert.doesNotMatch(other, /css\/nika\./, 'Nika stylesheet leaked into ' + file);
  assert.doesNotMatch(other, /nika-showcase\./, 'Nika script leaked into ' + file);
}
for (const path of ['nika/index.html', 'sidequests/nika/index.html']) {
  const redirect = readFileSync(join(output, path), 'utf8');
  assert.match(redirect, /https:\/\/vidunwedagedera\.com\/apps\/nika\//);
  assert.match(redirect, /url=\/apps\/nika\//);
  assert.match(redirect, /location\.search\+location\.hash/);
}
const pages = [];
function visit(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) visit(path);
    else if (path.endsWith('.html')) pages.push(path);
  }
}
visit(output);
for (const file of pages) {
  const text = readFileSync(file, 'utf8');
  assert.doesNotMatch(text, /example\.com|localhost|127\.0\.0\.1|Lorem ipsum|John Doe/, file);
}
console.log('Nika checks passed:', localRefs.length, 'links/assets,', pages.length, 'HTML pages, 7 paired download entry points, no dead release buttons, isolated assets and honest release gates.');
