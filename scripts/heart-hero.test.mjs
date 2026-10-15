import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { damp, proximityFalloff } from '../assets/js/heart-hero.mjs';
test('proximity deformation stays local and smooth', () => {
  assert.equal(proximityFalloff(0, 0), 1);
  assert.ok(proximityFalloff(.2, .2) > proximityFalloff(.8, .8));
  assert.ok(proximityFalloff(2, 2) < .00001);
});
test('damping has the same response at 60 and 120 Hz without overshoot', () => {
  const simulate = hz => { let n=0; for(let i=0;i<hz;i++) n=damp(n,1,1/hz); return n; };
  assert.ok(Math.abs(simulate(60)-simulate(120)) < 1e-12);
  assert.ok(damp(0,1,.05)>0 && damp(0,1,.05)<1);
});
test('mesh has a small, valid, texture-free binary payload', () => {
  const mesh=readFileSync(new URL('../assets/models/heart.bin', import.meta.url));
  assert.equal(mesh.toString('ascii',0,4),'VWHT');
  assert.equal(mesh.readUInt32LE(4),1);
  const count=mesh.readUInt32LE(8), faces=mesh.readUInt32LE(12), lines=mesh.readUInt32LE(16);
  assert.ok(count>2000 && count<10000);
  assert.equal(mesh.length,24+count*24+(faces+lines)*2);
  assert.ok(mesh.length<300000);
  assert.equal(faces%3,0);assert.equal(lines%2,0);
  for(let i=24+count*24;i<mesh.length;i+=2) assert.ok(mesh.readUInt16LE(i)<count);
  for(let i=24;i<24+count*24;i+=4) assert.ok(Number.isFinite(mesh.readFloatLE(i)));
});
test('animation has accessibility and resource-use gates', () => {
  const code=readFileSync(new URL('../assets/js/heart-hero.mjs', import.meta.url),'utf8');
  for(const gate of ['prefers-reduced-motion','IntersectionObserver','document.hidden','cancelAnimationFrame','webglcontextlost','data-heart-motion']) assert.ok(code.includes(gate),gate);
  assert.ok(code.includes('Math.min(devicePixelRatio || 1, 1.75)'));
  assert.doesNotMatch(code,/preventDefault\(\).*scroll|addEventListener\(['"]wheel/);
});
