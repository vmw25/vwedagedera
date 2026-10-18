import assert from 'node:assert/strict';

export function checkMaintenance(html) {
  if (!html.includes('data-nena-maintenance')) return false;
  assert.match(html, /<h1>Major updates(?:<br\s*\/?>|\s)+in progress\.<\/h1>/);
  assert.match(html, /I’m working on the next version of nena/);
  assert.match(html, /Check back soon\./);
  assert.match(html, /nena-maintenance\.min\.[a-f0-9]+\.css/);
  assert.match(html, /media\/nena\/wordmark\.svg/);
  assert.match(html, /Back to apps/);
  assert.match(html, /href=["']?\/apps\//);
  assert.match(html, /https:\/\/vidunwedagedera\.com\/apps\/nika\//);
  assert.match(html, /noindex,follow/);
  for (const label of ['Privacy', 'Terms', 'Contact', 'Vidun’s website']) assert.ok(html.includes(label));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<script\b|data-download-platform|data-installer|data-nika-showcase|data-guide-panel|data-pricing-version|nika-showcase\.|nika-walkthrough\.|media\/nika\//);
  assert.doesNotMatch(html, /example\.com|localhost|127\.0\.0\.1/);
  return true;
}
