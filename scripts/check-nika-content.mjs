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
console.log('Verified concise copy, canonical sign-in, compact listing and 4K screenshot markup.');
