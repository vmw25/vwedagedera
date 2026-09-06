import test from 'node:test';
import assert from 'node:assert/strict';
import { initialiseShowcase, initialiseDemo, initialiseNavigation, motionAllowed, nextFeature } from '../assets/js/nika-showcase.mjs';

class Element {
  constructor() {
    this.listeners = {}; this.dataset = {}; this.attrs = {}; this.hidden = false; this.textContent = '';
    this.classes = new Set(); this.classList = { add: v => this.classes.add(v), remove: v => this.classes.delete(v), toggle: (v, on) => on ? this.classes.add(v) : this.classes.delete(v) };
  }
  addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); }
  async emit(name, extra = {}) { for (const fn of this.listeners[name] ?? []) await fn({ target: this, ...extra }); }
  setAttribute(name, value) { this.attrs[name] = value; }
  getAttribute(name) { return name === 'src' ? this.src : this.attrs[name]; }
  focus() { this.focused = true; }
}
test('compact navigation closes after selection, Escape, outside click and focus leaving', async () => {
  const menu = new Element(), summary = new Element(), link = new Element(), doc = new Element();
  menu.querySelector = () => summary;
  menu.querySelectorAll = () => [link];
  menu.contains = item => [menu, summary, link].includes(item);
  initialiseNavigation(menu, doc);
  menu.open = true; await link.emit('click'); assert.equal(menu.open, false);
  menu.open = true; let prevented = false;
  await menu.emit('keydown', { key: 'Escape', preventDefault: () => { prevented = true; } });
  assert.equal(menu.open, false); assert.equal(summary.focused, true); assert.equal(prevented, true);
  menu.open = true; await doc.emit('click', { target: link }); assert.equal(menu.open, true);
  await doc.emit('click'); assert.equal(menu.open, false);
  menu.open = true; await menu.emit('focusout', { relatedTarget: link }); assert.equal(menu.open, true);
  await menu.emit('focusout', { relatedTarget: doc }); assert.equal(menu.open, false);
});
function environment({ reduced = false, saveData = false, observer = false } = {}) {
  const preference = Object.assign(new Element(), { matches: reduced });
  const connection = Object.assign(new Element(), { saveData });
  const doc = Object.assign(new Element(), { hidden: false });
  const timers = new Map(); let identity = 0;
  const win = { matchMedia: () => preference, navigator: { connection }, requestAnimationFrame: fn => fn(),
    setTimeout: fn => { timers.set(++identity, fn); return identity; }, clearTimeout: id => timers.delete(id),
    location: { assign: url => { win.redirect = url; } } };
  const observers = [];
  if (observer) win.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe(target) { this.target = target; }
  };
  return { win, doc, preference, connection, timers, observers };
}
function showcase(options) {
  const env = environment(options), root = new Element(), toggle = new Element(), phrase = new Element(), status = new Element(), controls = new Element();
  controls.hidden = true;
  const panels = [0, 1, 2, 3, 4, 5].map(i => Object.assign(new Element(), { dataset: { phrase: 'Phrase ' + i }, hidden: i !== 0 }));
  const choices = panels.map((_, i) => Object.assign(new Element(), { textContent: 'Feature ' + i }));
  root.querySelectorAll = name => name === '[data-showcase-panel]' ? panels : choices;
  root.querySelector = name => ({ '[data-showcase-motion]': toggle, '[data-showcase-controls]': controls, '[data-showcase-announcement]': status, '#showcase-phrase': phrase })[name];
  const controller = initialiseShowcase(root, env.win, env.doc);
  return { ...env, root, toggle, phrase, status, controls, panels, choices, controller };
}

test('motion requires all safety conditions, and feature cycling wraps', () => {
  const state = { paused: false, reduced: false, saveData: false, hidden: false, inView: true };
  assert.equal(motionAllowed(state), true);
  for (const key of ['paused', 'reduced', 'saveData', 'hidden', 'hovered']) assert.equal(motionAllowed({ ...state, [key]: true }), false);
  assert.equal(motionAllowed({ ...state, inView: false }), false);
  assert.equal(nextFeature(3, 4), 0); assert.equal(nextFeature(0, 0), 0);
});
test('automatic switching synchronises copy and exposes only one slide without announcements', () => {
  const f = showcase(); assert.equal(f.controls.hidden, false); assert.equal(f.timers.size, 1);
  [...f.timers.values()][0]();
  assert.equal(f.controller.index, 1); assert.equal(f.phrase.textContent, 'Phrase 1');
  assert.equal(f.panels.filter(p => !p.hidden).length, 1);
  assert.equal(f.choices[1].attrs['aria-pressed'], 'true'); assert.equal(f.status.textContent, '');
});
test('manual feature selection pauses persistently and announces its label', async () => {
  const f = showcase(); await f.choices[2].emit('click');
  assert.equal(f.controller.index, 2); assert.equal(f.timers.size, 0); assert.equal(f.status.textContent, 'Feature 2 selected');
  await f.controls.emit('pointerleave'); assert.equal(f.timers.size, 0);
  f.doc.hidden = true; await f.doc.emit('visibilitychange'); f.doc.hidden = false; await f.doc.emit('visibilitychange');
  assert.equal(f.timers.size, 0);
});
test('focus pauses; pointer click on Pause must not inadvertently restart rotation', async () => {
  const f = showcase(); await f.toggle.emit('pointerdown'); await f.root.emit('focusin'); await f.toggle.emit('click');
  assert.equal(f.controller.state.paused, true); assert.equal(f.timers.size, 0);
  await f.toggle.emit('click'); assert.equal(f.controller.state.paused, false); assert.equal(f.timers.size, 1);
});
test('control hover pauses temporarily, resting elsewhere in the hero does not freeze the headline', async () => {
  const f = showcase(); await f.root.emit('pointerenter', { pointerType: 'mouse' }); assert.equal(f.timers.size, 1);
  await f.controls.emit('pointerenter', { pointerType: 'mouse' }); assert.equal(f.timers.size, 0);
  await f.controls.emit('pointerleave'); assert.equal(f.timers.size, 1);
  f.doc.hidden = true; await f.doc.emit('visibilitychange'); assert.equal(f.timers.size, 0);
});
test('opening hero visibility starts rotation even when the screenshots are below the fold', () => {
  const f = showcase({ observer: true });
  assert.equal(f.timers.size, 0);
  assert.equal(f.observers[0].target, f.root);
  assert.equal(f.observers[0].options.threshold, 0);
  f.observers[0].callback([{ isIntersecting: true }]); assert.equal(f.timers.size, 1);
  f.observers[0].callback([{ isIntersecting: false }]); assert.equal(f.timers.size, 0);
});
test('all six feature phrases, screenshots and controls cycle together and wrap', () => {
  const f = showcase();
  for (let step = 1; step <= 6; step++) {
    [...f.timers.values()][0]();
    const index = step % 6;
    assert.equal(f.phrase.textContent, 'Phrase ' + index);
    assert.equal(f.panels[index].hidden, false);
    assert.equal(f.panels.filter(p => !p.hidden).length, 1);
    assert.equal(f.choices.filter(c => c.attrs['aria-pressed'] === 'true').length, 1);
  }
});
for (const option of ['reduced', 'saveData']) test(`${option} starts static, retains manual feature selection and responds to preference changes`, async () => {
  const f = showcase({ [option]: true }); assert.equal(f.timers.size, 0); assert.equal(f.toggle.disabled, true);
  await f.choices[3].emit('click'); assert.equal(f.controller.index, 3);
  f.preference.matches = false; f.connection.saveData = false; await f.preference.emit('change'); await f.connection.emit('change');
  assert.equal(f.toggle.disabled, false); assert.equal(f.timers.size, 0);
});

class Video extends Element {
  constructor() { super(); this.dataset.src = 'https://media.invalid/nika.mp4'; this.paused = true; this.plays = 0; this.loads = 0; }
  load() { this.loads++; }
  async play() { this.plays++; if (this.reject) throw new Error('Autoplay blocked'); this.paused = false; await this.emit('playing'); }
  pause() { this.paused = true; this.emit('pause'); }
}
function demo(options) {
  const env = environment(options), root = new Element(), preview = new Video(), player = new Video();
  const dialog = Object.assign(new Element(), { open: false });
  dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; dialog.emit('close'); };
  const watch = new Element(), close = new Element(), toggle = new Element(), status = new Element(), controls = new Element();
  const map = { '[data-demo-preview]': preview, '[data-demo-player]': player, '[data-demo-dialog]': dialog,
    '[data-demo-watch]': watch, '[data-demo-close]': close, '[data-demo-motion]': toggle, '[data-demo-status]': status, '[data-demo-controls]': controls };
  root.querySelector = name => map[name];
  const controller = initialiseDemo(root, env.win, env.doc);
  return { ...env, root, preview, player, dialog, watch, close, toggle, status, controls, controller };
}
test('eligible demo preview plays muted, but full video is not fetched automatically', async () => {
  const f = demo(); await f.controller.sync(); assert.equal(f.preview.muted, true); assert.equal(f.preview.paused, false);
  assert.equal(f.preview.loads, 1); assert.equal(f.player.loads, 0);
});
for (const option of ['reduced', 'saveData']) test(`${option} does not load a video until an explicit Watch action`, async () => {
  const f = demo({ [option]: true }); assert.equal(f.preview.loads, 0); assert.equal(f.player.loads, 0);
  await f.watch.emit('click'); assert.equal(f.player.loads, 1); assert.equal(f.dialog.open, true); assert.equal(f.close.focused, true);
  await f.close.emit('click'); assert.equal(f.player.paused, true); assert.equal(f.watch.focused, true);
  assert.equal(f.preview.loads, 0);
});
test('manual preview pause survives hidden/visible transitions and the modal close', async () => {
  const f = demo(); await f.controller.sync(); await f.toggle.emit('click'); assert.equal(f.preview.paused, true);
  f.doc.hidden = true; await f.doc.emit('visibilitychange'); f.doc.hidden = false; await f.doc.emit('visibilitychange');
  assert.equal(f.preview.paused, true);
  await f.watch.emit('click'); await f.close.emit('click'); assert.equal(f.preview.paused, true);
});
test('rejected autoplay leaves a usable player instruction and no retry loop', async () => {
  const f = demo({ reduced: true }); f.preview.reject = true;
  await f.toggle.emit('click'); await Promise.resolve(); await Promise.resolve();
  assert.equal(f.controller.state.paused, true); assert.match(f.status.textContent, /Watch the demo/);
  const attempts = f.preview.plays; await f.controller.sync(); assert.equal(f.preview.plays, attempts);
});
test('a stale pending play cannot restart a hidden preview', async () => {
  const f = demo({ reduced: true }); let finish;
  f.preview.play = () => new Promise(resolve => { finish = () => { f.preview.paused = false; resolve(); }; });
  await f.toggle.emit('click'); f.doc.hidden = true; await f.doc.emit('visibilitychange'); finish();
  await Promise.resolve(); await Promise.resolve(); assert.equal(f.preview.paused, true);
});
