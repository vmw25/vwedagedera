import test from 'node:test';
import assert from 'node:assert/strict';
import { initialiseWalkthrough } from '../assets/js/nika-walkthrough.mjs';

class Element {
  constructor() {
    this.listeners = {}; this.dataset = {}; this.attrs = {}; this.children = [];
    this.hidden = false; this.textContent = ''; this.one = {}; this.many = {};
    this.classes = new Set();
    this.classList = { add: v => this.classes.add(v), remove: v => this.classes.delete(v), toggle: (v, on) => on ? this.classes.add(v) : this.classes.delete(v) };
  }
  querySelector(key) { return this.one[key]; }
  querySelectorAll(key) { return this.many[key] ?? []; }
  setAttribute(key, value) { this.attrs[key] = value; }
  removeAttribute(key) { delete this.attrs[key]; if (key === 'src') delete this.src; }
  addEventListener(key, fn) { (this.listeners[key] ??= []).push(fn); }
  emit(key, extra = {}) { for (const fn of this.listeners[key] ?? []) fn({ target: this, preventDefault() {}, ...extra }); }
  append(child) { this.children.push(child); }
  click() { this.emit('click'); }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
}
function fixture() {
  const doc = new Element(), root = new Element(), status = new Element();
  doc.one['[data-walkthrough]'] = root;
  doc.createElement = () => new Element();
  const tabs = [new Element(), new Element(), new Element()];
  const paths = [];
  const panels = [1, 2, 1].map((count, p) => {
    const panel = new Element(); panel.id = `guide-${p}`;
    const choices = count > 1 ? [new Element(), new Element()] : [];
    const owned = Array.from({ length: count }, (_, index) => {
      const path = new Element(), controls = new Element(), back = new Element(), next = new Element(), dots = new Element();
      path.id = `path-${p}-${index}`;
      const steps = [0, 1, 2, 3].map(i => {
        const step = new Element(), heading = new Element(); heading.textContent = `Step title ${i}`;
        step.one.h3 = heading; return step;
      });
      path.many['[data-step]'] = steps;
      path.one['.walk-controls'] = controls;
      Object.assign(controls.one, { '[data-back]': back, '[data-next]': next, '.walk-dots': dots });
      paths.push({ path, controls, back, next, dots, steps });
      return path;
    });
    panel.many['[data-path-panel]'] = owned; panel.many['[data-path]'] = choices;
    return panel;
  });
  const dialog = new Element(), full = new Element(), canvas = new Element(), zoom = new Element(), close = new Element(), imageStatus = new Element(), title = new Element(), resolution = new Element();
  Object.assign(dialog.one, { '[data-full-image]': full, '.walk-zoom-canvas': canvas, '[data-zoom]': zoom, '[data-close]': close, '[data-image-status]': imageStatus, '#walk-dialog-title': title, '[data-image-resolution]': resolution });
  const link = new Element(); link.href = '/media/nika/walkthrough/source-full.webp';
  link.dataset = { caption: 'Add your material', resolution: '7680 × 4320' };
  link.one.img = { alt: 'Practice source in Nika' };
  Object.assign(root.one, { '.walk-tabs': new Element(), '.walk-dialog': dialog, '[data-walk-announcement]': status });
  Object.assign(root.many, { '[data-guide]': tabs, '[data-guide-panel]': panels, '[data-enlarge]': [link] });
  const controller = initialiseWalkthrough(doc);
  return { doc, root, tabs, panels, paths, status, dialog, full, canvas, zoom, close, imageStatus, title, resolution, link, controller };
}
test('one guide and one step are shown, with no automatic progression', () => {
  const f = fixture();
  assert.equal(f.panels.filter(p => !p.hidden).length, 1);
  assert.equal(f.tabs[0].attrs['aria-selected'], 'true');
  for (const path of f.paths) {
    assert.equal(path.steps.filter(s => !s.hidden).length, 1);
    assert.equal(path.back.disabled, true);
    assert.equal(path.next.disabled, false);
    assert.equal(path.controls.hidden, false);
  }
  assert.equal(f.status.textContent, '');
  assert.equal(f.full.src, undefined);
  assert.equal(initialiseWalkthrough(f.doc), undefined);
});
test('Next/Back/dots reach every step, clamp bounds and announce the new title', () => {
  const f = fixture(), p = f.paths[0];
  p.next.click(); assert.equal(p.steps[1].hidden, false);
  assert.equal(f.status.textContent, 'Step 2 of 4: Step title 1');
  p.dots.children[3].click(); assert.equal(p.next.disabled, true);
  p.next.click(); assert.equal(p.steps[3].hidden, false);
  p.back.click(); assert.equal(p.steps[2].hidden, false);
  p.dots.children[0].click(); p.back.click();
  assert.equal(p.steps[0].hidden, false);
  assert.equal(p.dots.children[0].attrs['aria-current'], 'step');
  assert.equal(p.dots.children[3].attrs['aria-current'], undefined);
});
test('tabs support arrows, Home and End with roving focus', () => {
  const f = fixture();
  f.tabs[0].emit('keydown', { key: 'ArrowLeft' });
  assert.equal(f.tabs[2].focused, true); assert.equal(f.panels[2].hidden, false);
  f.tabs[2].emit('keydown', { key: 'Home' }); assert.equal(f.tabs[0].tabIndex, 0);
  f.tabs[0].emit('keydown', { key: 'End' }); assert.equal(f.tabs[2].tabIndex, 0);
  f.tabs[2].emit('keydown', { key: 'ArrowRight' }); assert.equal(f.tabs[0].tabIndex, 0);
  f.tabs[1].click(); assert.equal(f.panels[1].hidden, false);
});
test('PassMed and source paths stay separate and retain the chosen step', () => {
  const f = fixture();
  f.tabs[1].click(); f.paths[1].next.click();
  const choices = f.panels[1].many['[data-path]'];
  choices[1].emit('keydown', { key: ' ' });
  assert.equal(f.paths[1].path.hidden, true); assert.equal(f.paths[2].path.hidden, false);
  choices[0].click(); assert.equal(f.paths[1].steps[1].hidden, false);
});
test('8K files load only on demand; dialog zoom, load error and focus restoration work', () => {
  const f = fixture(); f.link.click();
  assert.equal(f.dialog.open, true); assert.equal(f.full.src, f.link.href);
  assert.equal(f.full.hidden, true); assert.equal(f.zoom.disabled, true);
  f.full.onload(); assert.equal(f.full.hidden, false); assert.equal(f.imageStatus.textContent, '');
  f.zoom.click(); assert.equal(f.canvas.classes.has('is-zoomed'), true);
  assert.equal(f.zoom.attrs['aria-pressed'], 'true');
  f.close.click(); assert.equal(f.dialog.open, false); assert.equal(f.link.focused, true);
  assert.equal(f.full.src, undefined);
  f.link.click(); f.full.onerror(); assert.match(f.imageStatus.textContent, /could not load/);
  f.dialog.emit('click'); assert.equal(f.dialog.open, false);
});
test('full-image links remain normal links when dialog is unsupported', () => {
  const f = fixture(); f.dialog.showModal = undefined;
  let prevented = false;
  f.link.emit('click', { preventDefault() { prevented = true; } });
  assert.equal(prevented, false); assert.equal(f.full.src, undefined);
});
