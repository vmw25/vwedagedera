import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkPricing } from './check-nika-pricing.mjs';

test('Production continues to match existing checkout until coordinated activation', () => {
  assert.match(readFileSync('data/nika.yaml', 'utf8'), /^pricing_v2_ready: false$/m);
  checkPricing(readFileSync('public/apps/nika/index.html', 'utf8'), false);
});

test('The activated table renders all approved limits and no old annual offer', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'nika-pricing-fixture-'));
  cpSync('data', join(fixture, 'data'), { recursive: true });
  const dataFile = join(fixture, 'data/nika.yaml');
  writeFileSync(dataFile, readFileSync(dataFile, 'utf8').replace(/^pricing_v2_ready: false$/m, 'pricing_v2_ready: true'));
  execFileSync('hugo', ['--gc', '--minify', '--baseURL', 'https://vidunwedagedera.com/', '--destination', join(fixture, 'public')], {
    env: { ...process.env, HUGO_DATADIR: join(fixture, 'data') }, stdio: 'pipe', timeout: 120000,
  });
  checkPricing(readFileSync(join(fixture, 'public/apps/nika/index.html'), 'utf8'), true);
  console.log(`Approved pricing preview: ${join(fixture, 'public/apps/nika/index.html')}`);
});
