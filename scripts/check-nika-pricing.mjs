import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function checkPricing(html, v2 = /^pricing_v2_ready: true$/m.test(readFileSync('data/nika.yaml', 'utf8'))) {
  const section = html.match(/<section\b[^>]*\bid=(?:"plans"|plans)[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'One pricing section must be rendered');
  assert.equal((html.match(/\bid=(?:"plans"|plans)[\s>]/g) || []).length, 1);
  const plain = section.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  if (!v2) {
    assert.match(section, /data-pricing-version=(?:"legacy"|legacy)/);
    for (const price of ['£8.99', '£79', '£19.99']) assert.ok(plain.includes(price));
    for (const price of ['£9.99', '£24.99', '£4.99']) assert.ok(!plain.includes(price), 'Do not offer inactive prices');
    return;
  }
  assert.match(section, /data-pricing-version=(?:"2026-09-29"|2026-09-29)/);
  for (const price of ['£0', '£9.99', '£24.99', '£4.99', '£19.99']) assert.ok(plain.includes(price));
  for (const old of ['£8.99', '£79', '£6.58', 'billed yearly', 'calendar month']) assert.ok(!html.includes(old), `Legacy terms leaked: ${old}`);
  const rows = [...section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(match =>
    [...match[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map(cell => cell[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()));
  const expected = [
    ['AI credits', '100 once', '250 / month', '700 / month'],
    ['Source generation jobs', '3 completed jobs', 'Within your credits', 'Within your credits'],
    ['PassMedicine AI requests', '20 completed AI requests', 'Within your credits', 'Within your credits'],
    ['Selected PDF pages per job', '10', '100', '300'],
    ['Original PDF file size', '10 MB', '50 MB', '100 MB'],
    ['Text characters per job', '5,000', '50,000', '150,000'],
    ['Images or diagrams per job', '1', '5', '20'],
    ['Jobs running at once', '1', '1', '2'],
  ];
  for (const row of expected) assert.deepEqual(rows.find(actual => actual[0] === row[0]), row);
  for (const term of ['7 days from activation', 'No card required', 'AI rewrites', 'same quality', 'not as separate allowances', 'do not spend generation credits', '£19.99', 'never top up automatically', 'billing date', 'do not roll over', 'Existing subscribers keep their agreed price and access']) assert.ok(plain.includes(term), `Missing limit or billing explanation: ${term}`);
  assert.ok(!/unlimited|priority queue/i.test(plain));
  assert.match(html, /purchased credits carry forward/i);
  for (const term of ['UK residents only', 'no UK VAT is charged', 'Full refund within 14 days', 'even if you start using it']) assert.ok(plain.includes(term), `Missing UK purchase policy: ${term}`);
  assert.match(section, /\/terms\/2026-09-30/);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkPricing(readFileSync('public/apps/nika/index.html', 'utf8'));
  console.log('Pricing table matches its release gate and approved plan limits.');
}
