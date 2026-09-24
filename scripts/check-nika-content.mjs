import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const home = readFileSync('public/apps/nika/index.html', 'utf8');
const apps = readFileSync('public/apps/index.html', 'utf8');
for (const phrase of ['A clearer way to create', 'See it. Hide it. Recall it.', 'New pricing', 'Your data, your choice', 'One app, your whole card-making workflow', 'nika is an independent product, not affiliated with Anki, PassMedicine, Apple or Stripe.']) {
  assert.ok(!home.includes(phrase), `Removed decorative copy returned: ${phrase}`);
}
const footer = home.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)?.[0] || '';
for (const label of ['Privacy', 'Terms', 'Contact', 'Vidun’s website']) {
  assert.ok(footer.includes(label), `Footer link must remain: ${label}`);
}
for (const amount of ['8.99', '79', '19.99']) assert.ok(home.includes(amount));
assert.ok(apps.includes('simple-project-card--compact'));
assert.ok(!home.includes('media/nika/onboarding.png'));
assert.ok(!/localhost|127\.0\.0\.1|example\.com/.test(home));
assert.ok(home.includes('https://app.vidunwedagedera.com/signin'));
assert.ok(home.includes('7680') && home.includes('4320'));
for (const name of ['create', 'passmedicine', 'insights', 'onboarding']) {
  assert.ok(home.includes(`media/nika/${name}-v1514.webp`), `Current UI capture missing: ${name}`);
  const bytes = readFileSync(`public/media/nika/${name}-v1514.webp`);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  // Qt's opaque lossy WebP contains a VP8 keyframe; verify the actual pixels,
  // not only the HTML attributes. Fail closed on an unexpected codec/layout.
  let offset = 12;
  let found = false;
  while (offset + 8 <= bytes.length) {
    const size = bytes.readUInt32LE(offset + 4);
    if (bytes.toString('ascii', offset, offset + 4) === 'VP8 ') {
      assert.equal(bytes.readUInt16LE(offset + 14) & 0x3fff, 7680);
      assert.equal(bytes.readUInt16LE(offset + 16) & 0x3fff, 4320);
      found = true;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  assert.ok(found, `Expected rendered WebP frame missing: ${name}`);
}
const requestedHeadline = 'Upload anything. Get cards indistinguishable from your own.';
const requestedDescription = 'Paste text, add screenshots or upload full PDFs. Nika creates any type of Anki card and automatically chooses the best type for each part. All as if you made them yourself :)';
assert.ok(home.includes(requestedHeadline), 'Requested hero headline must be published verbatim');
assert.ok(home.includes(requestedDescription), 'Requested hero description must be published verbatim');
assert.ok(!home.includes('One goal: Anki cards indistinguishable from your own.'));
assert.ok(!home.includes('See how it works'));
assert.match(home, /<a[^>]+href=(?:"#technology"|#technology)[^>]*>See the tech behind Nika/);
const sectionIds = [...home.matchAll(/<section\b[^>]*\bid=(?:"([^"]+)"|([^\s>]+))/g)].map(m => m[1] || m[2]);
assert.equal(sectionIds.filter(id => id === 'technology').length, 1, 'Technology section must not be duplicated');
assert.equal(sectionIds[sectionIds.indexOf('technology') + 1], 'workflow', 'How it works must immediately precede Create, review, add to Anki');
assert.match(home, /<h2\b[^>]*\bid=(?:"technology-title"|technology-title)>How it works<\/h2>/);
assert.equal([...home.matchAll(/<a[^>]+href=(?:"#technology"|#technology)[^>]*>How it works<\/a>/g)].length, 2, 'Both desktop and mobile navigation must point to the technology section');
console.log('Verified hero copy, section order, canonical sign-in, compact listing and actual 8K screenshots.');
