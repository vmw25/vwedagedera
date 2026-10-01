import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkPricing } from './check-nika-pricing.mjs';

test('Production matches the activated UK plans and limits', () => {
  assert.match(readFileSync('data/nika.yaml', 'utf8'), /^pricing_v2_ready: true$/m);
  checkPricing(readFileSync('public/apps/nika/index.html', 'utf8'), true);
});

test('A deliberate rollback renders only the legacy table', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'nika-pricing-fixture-'));
  cpSync('data', join(fixture, 'data'), { recursive: true });
  const dataFile = join(fixture, 'data/nika.yaml');
  writeFileSync(dataFile, readFileSync(dataFile, 'utf8').replace(/^pricing_v2_ready: true$/m, 'pricing_v2_ready: false'));
  execFileSync('hugo', ['--gc', '--minify', '--baseURL', 'https://vidunwedagedera.com/', '--destination', join(fixture, 'public')], {
    env: { ...process.env, HUGO_DATADIR: join(fixture, 'data') }, stdio: 'pipe', timeout: 120000,
  });
  checkPricing(readFileSync(join(fixture, 'public/apps/nika/index.html'), 'utf8'), false);
});
