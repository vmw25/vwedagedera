import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const home = readFileSync('public/apps/nika/index.html', 'utf8');
const apps = readFileSync('public/apps/index.html', 'utf8');
for (const phrase of ['A clearer way to create', 'See it. Hide it. Recall it.', 'New pricing', 'Your data, your choice', 'One app, your whole card-making workflow']) {
  assert.ok(!home.includes(phrase), `Removed decorative copy returned: ${phrase}`);
}
for (const amount of ['8.99', '79', '19.99']) assert.ok(home.includes(amount));
assert.ok(apps.includes('simple-project-card--compact'));
assert.ok(!home.includes('media/nika/onboarding.png'));
assert.ok(!/localhost|127\.0\.0\.1|example\.com/.test(home));
assert.ok(home.includes('https://app.vidunwedagedera.com/signin'));
assert.ok(home.includes('3840') && home.includes('2160'));
const requestedHeadline = 'Upload anything. Get cards indistinguishable from your own.';
const requestedDescription = 'Paste text, add screenshots or upload full PDFs. Nika creates any type of Anki card and automatically chooses the best type for each part - diagrams become image occlusion cards, text becomes the right text-based cards. All as if you made them yourself :)';
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
console.log('Verified requested hero copy, technology link and section order, canonical sign-in, compact listing and 4K screenshot markup.');
