import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const metadata = JSON.parse(readFileSync('data/nika_walkthrough_images.json', 'utf8'));
const html = readFileSync('public/apps/nika/index.html', 'utf8');
const source = readFileSync('assets/js/nika-walkthrough.mjs', 'utf8');
const data = readFileSync('data/nika_walkthrough.yaml', 'utf8');
assert.equal((html.match(/data-guide-panel=/g) ?? []).length, 3);
assert.equal((html.match(/data-path-panel=/g) ?? []).length, 4);
assert.equal((html.match(/data-step[ >]/g) ?? []).length, 14);
assert.equal((html.match(/data-enlarge[ >]/g) ?? []).length, 14);
assert(!/setInterval|setTimeout|requestAnimationFrame/.test(source), 'Walkthrough must never autoplay');
assert(!/<img[^>]+src=[^>]*-full\.webp/.test(html), '8K assets must not be initial image sources');
assert(html.includes('Windows screenshots will follow Windows testing.'));
assert(data.includes('2055492159'));
for (const text of ['Open the Mac menu-bar controls', 'File → Open Question Bank panel', 'The × only closes the panel.', 'Cancel session discards that session’s queued mistakes.']) {
  assert(data.includes(text), `Missing Mac menu-bar instruction: ${text}`);
}

function dimensions(file) {
  const b = readFileSync(file);
  assert.equal(b.toString('ascii', 0, 4), 'RIFF');
  assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  const type = b.toString('ascii', 12, 16);
  if (type === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  if (type === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (type === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  throw new Error(`Unsupported WebP ${type}: ${file}`);
}
let fullBytes = 0, regularBytes = 0;
for (const [name, item] of Object.entries(metadata)) {
  const prefix = `static/media/nika/walkthrough/${name}`;
  assert.deepEqual(dimensions(`${prefix}-full.webp`), [item.width, item.height]);
  if (item.kind === 'native-app-render') assert.equal(item.width, 7680);
  for (const size of [768, 1440, 2304]) {
    const [width] = dimensions(`${prefix}-${size}.webp`);
    assert.equal(width, item[`w${size}`]);
    assert(width <= item.width, 'Never upscale a capture');
    assert(statSync(`${prefix}-${size}.webp`).size < 500_000, 'Oversized responsive image');
  }
  fullBytes += statSync(`${prefix}-full.webp`).size;
  regularBytes += statSync(`${prefix}-1440.webp`).size;
  assert(html.includes(`/${prefix.replace('static/', '')}-1440.webp`), `Unused or missing image ${name}`);
}
assert.equal(Object.keys(metadata).length, 14);
console.log(`Walkthrough: 3 guides, 4 paths, 14 steps, 14 native images. All 56 assets verified. Normal 1440px set: ${Math.round(regularBytes / 1024)} KiB; on-demand originals: ${Math.round(fullBytes / 1024)} KiB.`);
