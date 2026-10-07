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
const { checkPricing } = await import('./check-nika-pricing.mjs');
checkPricing(home);
assert.ok(apps.includes('simple-project-card--compact'));
assert.ok(!home.includes('media/nika/onboarding.png'));
assert.ok(!/localhost|127\.0\.0\.1|example\.com/.test(home));
assert.ok(home.includes('https://app.vidunwedagedera.com/signin'));
assert.ok(home.includes('Instant, Medium and Advanced generation'));
assert.ok(!home.includes('Instant, Balanced and Advanced generation'));
assert.ok(home.includes('7680') && home.includes('4320'));
for (const name of ['create', 'passmedicine', 'insights', 'onboarding']) {
  assert.ok(home.includes(`media/nika/${name}-v1518.webp`), `Current UI capture missing: ${name}`);
  const bytes = readFileSync(`public/media/nika/${name}-v1518.webp`);
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
assert.ok(home.includes('Learning that grows with you.'), 'The nena direction must be clear in the hero');
assert.ok(home.includes('The goal: cards indistinguishable from your own.'), 'Keep the personal-card goal');
assert.ok(home.includes('Our vision is to learn who you are, what you know, how you think and who you’re becoming, and help you become the doctor you want to be.'));
assert.ok(home.includes('Available in the desktop beta') && home.includes('Our longer-term direction'), 'Separate current capabilities from the roadmap');
assert.ok(home.includes('media/nena/wordmark.svg'));
assert.ok(apps.includes('nena') && apps.includes('media/nena/icon.svg'));
const webBetaReady = /^web_beta_ready: true$/m.test(readFileSync('data/nika.yaml', 'utf8'));
assert.ok(home.includes(webBetaReady ? 'Web beta' : 'Being built'), 'Describe web availability accurately');
assert.equal(home.includes('data-web-beta'), webBetaReady, 'Web access must follow the actual release gate');
assert.equal(home.includes('https://app.vidunwedagedera.com/workspace'), webBetaReady, 'No incomplete workspace link should leak');
assert.ok(!home.includes('One goal: Anki cards indistinguishable from your own.'));
assert.ok(!home.includes('See how it works'));
assert.match(home, /<a[^>]+href=(?:"#technology"|#technology)[^>]*>See the tech behind nena/);
const sectionIds = [...home.matchAll(/<section\b[^>]*\bid=(?:"([^"]+)"|([^\s>]+))/g)].map(m => m[1] || m[2]);
assert.equal(sectionIds.filter(id => id === 'technology').length, 1, 'Technology section must not be duplicated');
assert.equal(sectionIds[sectionIds.indexOf('technology') + 1], 'workflow', 'How it works must immediately precede Create, review, add to Anki');
assert.match(home, /<h2\b[^>]*\bid=(?:"technology-title"|technology-title)>How it works<\/h2>/);
assert.equal([...home.matchAll(/<a[^>]+href=(?:"#technology"|#technology)[^>]*>How it works<\/a>/g)].length, 2, 'Both desktop and mobile navigation must point to the technology section');
console.log('Verified nena copy, web release gate, section order, canonical sign-in, compact listing and actual 8K desktop screenshots.');
