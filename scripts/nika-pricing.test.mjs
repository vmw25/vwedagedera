import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkPricing } from './check-nika-pricing.mjs';
import { checkMaintenance } from './check-nika-maintenance.mjs';

test('Production follows the holding-page switch or the activated plans', () => {
  assert.match(readFileSync('data/nika.yaml', 'utf8'), /^pricing_v2_ready: true$/m);
  const html = readFileSync('public/apps/nika/index.html', 'utf8');
  const maintenance = /^maintenance_mode: true$/m.test(readFileSync('data/nika.yaml', 'utf8'));
  assert.equal(checkMaintenance(html), maintenance);
  if (!maintenance) checkPricing(html, true);
});

function renderFullProduct(t, legacyPricing = false) {
  const fixture = mkdtempSync(join(tmpdir(), 'nika-pricing-fixture-'));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  cpSync('data', join(fixture, 'data'), { recursive: true });
  const dataFile = join(fixture, 'data/nika.yaml');
  let data = readFileSync(dataFile, 'utf8').replace(/^maintenance_mode: true$/m, 'maintenance_mode: false');
  if (legacyPricing) data = data.replace(/^pricing_v2_ready: true$/m, 'pricing_v2_ready: false');
  writeFileSync(dataFile, data);
  execFileSync('hugo', ['--gc', '--minify', '--baseURL', 'https://vidunwedagedera.com/', '--destination', join(fixture, 'public')], {
    env: { ...process.env, HUGO_DATADIR: join(fixture, 'data') }, stdio: 'pipe', timeout: 120000,
  });
  return join(fixture, 'public');
}

test('Turning off maintenance restores the complete product page and all checks', (t) => {
  const output = renderFullProduct(t);
  assert.doesNotMatch(readFileSync(join(output, 'apps/nika/index.html'), 'utf8'), /data-nena-maintenance/);
  for (const script of ['check-nika.mjs', 'check-nika-content.mjs', 'check-nika-walkthrough.mjs']) {
    execFileSync(process.execPath, [join('scripts', script), output], { stdio: 'pipe', timeout: 120000 });
  }
});

test('A deliberate rollback renders only the legacy table', (t) => {
  checkPricing(readFileSync(join(renderFullProduct(t, true), 'apps/nika/index.html'), 'utf8'), false);
});
