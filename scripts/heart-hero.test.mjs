import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { damp, proximityFalloff, rotationAt } from '../assets/js/heart-hero.mjs';
import { easeScroll, easePortraitScroll, readingStrength, readingOpacity, portraitPose, portraitPlacement, portraitAppearance, portraitTimings } from '../assets/js/home-motion.mjs';
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
test('heart turns continuously once every 90 seconds', () => {
  assert.equal(rotationAt(0),0);
  assert.ok(Math.abs(rotationAt(45)-Math.PI)<1e-12);
  assert.ok(Math.abs(rotationAt(90))<1e-12);
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
test('centred text has a clear contrast plateau over inactive text', () => {
  assert.equal(readingOpacity(0),.24);
  assert.equal(readingOpacity(.8),1);
  assert.equal(readingOpacity(1),1);
  assert.ok(readingOpacity(.3)<.5);
  assert.ok(readingOpacity(.6)>readingOpacity(.3));
});
const flight = {
  start: { x: 72, y: 175, width: 112 }, end: { x: 120, y: 1150, width: 480 },
  rail: { x: 8, y: 175, width: 56 }, departure: 100, release: 600, arrival: 970,
};
test('background portrait fills the hero without changing its text layout', () => {
  const layout = { viewportWidth:1440, heroTop:83, heroHeight:916, copyTop:354.15, copyWidth:623 };
  const placement = portraitPlacement(layout);
  assert.ok(placement.width > 650);
  assert.equal(placement.left,layout.copyWidth*.12+28.8);
  assert.equal(layout.copyTop + placement.top, layout.heroTop + 18);
  assert.ok(placement.width * 1.25 <= layout.heroHeight - 36);
  assert.deepEqual(portraitPlacement({...layout,copyTop:layout.copyTop+20}), {...placement,top:placement.top-20});
});
test('background portrait stays within phone and short desktop hero bounds', () => {
  for (const layout of [
    { viewportWidth:390, heroTop:73, heroHeight:760, copyTop:117, copyWidth:342 },
    { viewportWidth:1440, heroTop:83, heroHeight:620, copyTop:234, copyWidth:623 },
  ]) {
    const placement = portraitPlacement(layout);
    assert.ok(placement.width >= 300);
    assert.ok(placement.left >= 0);
    assert.ok(placement.width * 1.25 < layout.heroHeight);
    assert.ok(layout.copyTop + placement.top >= layout.heroTop);
    if(layout.viewportWidth<=860)assert.ok(placement.left+placement.width<=layout.copyWidth+12);
  }
});
test('both portrait transitions use longer scroll ranges without changing the destination', () => {
  const timing=portraitTimings({viewportHeight:1000,endTop:1150,clearance:727.85,railY:199.15});
  assert.equal(timing.departure,420);
  assert.ok(timing.departure>130*3);
  assert.ok(timing.arrival-timing.release>600);
  assert.ok(1150-timing.arrival>=80);
  for(const viewportHeight of [600,720,844,1200]){
    const t=portraitTimings({viewportHeight,endTop:viewportHeight+150,clearance:viewportHeight*.75,railY:viewportHeight*.2});
    assert.ok(t.release>t.departure);
    assert.ok(t.arrival-t.release>=480);
  }
});
test('portrait follow-through is gentler than page scrolling at any refresh rate', () => {
  const simulate = hz => {let y=0;for(let i=0;i<hz;i++)y=easePortraitScroll(y,1000,1/hz);return y;};
  assert.ok(Math.abs(simulate(60)-simulate(120))<1e-9);
  assert.ok(easePortraitScroll(0,1000,.1)<easeScroll(0,1000,.1));
  assert.ok(simulate(60)<=1000);
  assert.ok(easePortraitScroll(1000,0,.05)>=0);
});
test('portrait smoothing keeps the gutter steady and docks at the real scroll position', () => {
  assert.deepEqual(portraitPose(400,flight,475),flight.rail);
  assert.deepEqual(portraitPose(flight.arrival,flight,1100),{x:120,y:50,width:480});
});
test('background fades into a clear portrait and reverses without a visual jump', () => {
  assert.deepEqual(portraitAppearance(0,flight),{clarity:0,opacity:.26});
  assert.deepEqual(portraitAppearance(flight.departure,flight),{clarity:1,opacity:1});
  assert.deepEqual(portraitAppearance(flight.arrival,flight,true),{clarity:1,opacity:1});
  assert.equal(portraitAppearance(flight.departure,flight,true).opacity,0);
  for(const mobile of [false,true])for(const edge of [flight.departure,flight.release,flight.arrival]){
    const before=portraitAppearance(edge-.001,flight,mobile),after=portraitAppearance(edge+.001,flight,mobile);
    for(const key of ['clarity','opacity'])assert.ok(Math.abs(before[key]-after[key])<.001);
  }
});
test('portrait starts above the name and docks exactly into the existing photo', () => {
  assert.deepEqual(portraitPose(0, flight), flight.start);
  assert.deepEqual(portraitPose(flight.arrival, flight), { x: 120, y: 180, width: 480 });
  assert.deepEqual(portraitPose(1200, flight), { x: 120, y: -50, width: 480 });
});
test('portrait remains in the empty gutter while the hero text passes', () => {
  for (const scroll of [100, 250, 400, 600]) {
    const pose = portraitPose(scroll, flight);
    assert.deepEqual(pose, flight.rail);
    assert.ok(pose.x + pose.width < flight.start.x);
  }
});
test('portrait motion is reversible and stays continuous at its handoffs', () => {
  const forward = [0, 50, 100, 400, 600, 800, 970].map(scroll => portraitPose(scroll, flight));
  const reverse = [970, 800, 600, 400, 100, 50, 0].map(scroll => portraitPose(scroll, flight)).reverse();
  assert.deepEqual(forward, reverse);
  for (const edge of [flight.departure, flight.release, flight.arrival]) {
    const before = portraitPose(edge - .001, flight), after = portraitPose(edge + .001, flight);
    for (const key of ['x', 'y', 'width']) assert.ok(Math.abs(before[key] - after[key]) < .01);
  }
});
