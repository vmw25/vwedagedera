import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const output = resolve(process.argv[2] || 'public');
const page = join(output, 'sidequests/nika/index.html');
const html = readFileSync(page, 'utf8');
const ids = new Set([...html.matchAll(/\bid=(?:["']([^"']+)["']|([^\s>]+))/g)].map(m => m[1] || m[2]));
assert.match(html, /https:\/\/vidunwedagedera\.com\/sidequests\/nika\//);
assert.match(html, /Your cards\. Your style\./);
assert.match(html, /The goal: Anki cards indistinguishable from your own/);
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
assert.match(html, /public signup and purchases are not open yet/);
assert.match(html, /nika-customer-v1\.5\.0-build37-arm64\.dmg/);
assert.match(html, /Release notes and checksum/);
assert.ok(ids.has('download-macos') && ids.has('download-windows'), 'Each platform needs a real status destination');
assert.equal(ids.size, [...html.matchAll(/\bid=(?:["']([^"']+)["']|([^\s>]+))/g)].length, 'IDs must be unique');
assert.equal((html.match(/data-download-platform=(?:"macos"|macos)/g) || []).length, 7);
assert.equal((html.match(/data-download-platform=(?:"windows"|windows)/g) || []).length, 7);
assert.doesNotMatch(html, /data-download-state=(?:"ready"|ready)|data-installer=(?:"windows"|windows)/, 'Only the labelled Mac beta is published');
assert.equal((html.match(/data-download-state=(?:"beta"|beta)/g) || []).length, 7);
assert.match(html, /data-installer=(?:"macos"|macos)/);
assert.match(html, /Only if you opt in/);
assert.match(html, /not automatic retraining of the underlying language or vision models/);
assert.match(html, /Exact style matching is not guaranteed/);
assert.match(html, /convolutional neural network \(CNN\)/);
assert.match(html, /large language model \(LLM\)/);
assert.match(html, /machine-learning ranker/);
assert.match(html, /class=(?:"feature-map"|feature-map)|shell feature-map/);
assert.doesNotMatch(html, /technical-detail/, 'The technical explanation must be visible, not hidden in disclosures');
assert.ok(ids.has('technology'));
assert.doesNotMatch(html, /\/signup/, 'Installation, not website signup, is the primary new-user path');
assert.match(html, /\/signin/);
assert.match(html, /<table[^>]*comparison/);
assert.match(html, /Recommended/);
assert.match(html, /12 times the monthly AI credits/);
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
for (const file of ['index.html', 'sidequests/index.html', 'sidequests/cs50/index.html']) {
  const other = readFileSync(join(output, file), 'utf8');
  assert.doesNotMatch(other, /css\/nika\./, 'Nika stylesheet leaked into ' + file);
  assert.doesNotMatch(other, /nika-showcase\./, 'Nika script leaked into ' + file);
}
assert.match(readFileSync(join(output, 'nika/index.html'), 'utf8'), /url=\/sidequests\/nika\//);
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
