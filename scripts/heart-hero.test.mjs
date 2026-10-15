import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { damp, proximityFalloff, rotationAt } from '../assets/js/heart-hero.mjs';
import { easeScroll, readingStrength } from '../assets/js/home-motion.mjs';
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
  for(const gate of ['prefers-reduced-motion','IntersectionObserver','document.hidden','cancelAnimationFrame','webglcontextlost']) assert.ok(code.includes(gate),gate);
  assert.ok(code.includes('Math.min(devicePixelRatio || 1, 1.75)'));
  assert.doesNotMatch(code,/preventDefault\(\).*scroll|addEventListener\(['"]wheel/);
});
test('heart turns continuously once every 150 seconds', () => {
  assert.equal(rotationAt(0),0);
  assert.ok(Math.abs(rotationAt(75)-Math.PI)<1e-12);
  assert.ok(Math.abs(rotationAt(150))<1e-12);
});
test('stage easing is frame-rate independent and never overshoots', () => {
  const simulate = hz => {let y=0;for(let i=0;i<hz;i++)y=easeScroll(y,1000,1/hz);return y;};
  assert.ok(Math.abs(simulate(60)-simulate(120))<1e-9);
  assert.ok(simulate(60)<=1000);
  assert.ok(easeScroll(1000,0,.05)>=0);
});
test('reading emphasis peaks at the viewport centre and fades smoothly', () => {
  assert.equal(readingStrength(520,0,1000),1);
  assert.equal(readingStrength(2520,2000,1000),1);
  assert.ok(readingStrength(700,0,1000)>readingStrength(1000,0,1000));
  assert.equal(readingStrength(2000,0,1000),0);
});
