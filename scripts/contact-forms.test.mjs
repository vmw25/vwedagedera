import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/site-controls.js', import.meta.url), 'utf8');
function makeForm() {
  const status = { textContent: '' };
  const button = { textContent: 'Send enquiry', disabled: false };
  return {
    status, button, resets: 0, valid: true, attributes: {}, handlers: {},
    dataset: { contactConfigured: 'true' }, action: 'https://formspree.io/f/xeajeklr',
    querySelector(selector) { return selector === '[data-contact-status]' ? status : button; },
    addEventListener(name, handler) { this.handlers[name] = handler; },
    reportValidity() { return this.valid; },
    reset() { this.resets++; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    submit() { return this.handlers.submit.call(this, { preventDefault() {} }); }
  };
}
function boot(fetch) {
  const forms = [makeForm(), makeForm()];
  const observers = [];
  const footer = {};
  const floating = { attributes: {}, classes: {}, classList: { toggle(name, value) { floating.classes[name] = value; } }, setAttribute(name, value) { this.attributes[name] = value; } };
  const document = {
    body: { append() {} },
    documentElement: { dataset: { theme: 'dark' } },
    querySelector(selector) { return selector === '.floating-contact' ? floating : selector === '[data-contact-section]' ? footer : null; },
    querySelectorAll(selector) { return selector === '[data-contact-form]' ? forms : []; },
    getElementById() { return null; }, addEventListener() {}
  };
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() {}
  }
  class FormData extends Map { constructor() { super(); } }
  // No network or real email is used by this harness.
  vm.runInNewContext(source, { document, navigator: {}, FormData, fetch, IntersectionObserver,
    window: { IntersectionObserver, location: { href: 'http://127.0.0.1:1314/' } } });
  return { forms, floating, contactObserver: observers.find(observer => observer.target === footer) };
}
test('footer and dialog independently submit through the existing endpoint', async () => {
  const calls = [];
  const { forms } = boot(async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ ok: true }) }; });
  await forms[1].submit();
  assert.equal(forms[1].resets, 1);
  assert.match(forms[1].status.textContent, /enquiry has been sent/);
  assert.equal(forms[0].status.textContent, '');
  await forms[0].submit();
  assert.equal(calls.length, 2);
  for (const { url, options } of calls) {
    assert.equal(url, 'https://formspree.io/f/xeajeklr');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Accept, 'application/json');
    assert.equal(options.body.get('source_page'), 'http://127.0.0.1:1314/');
  }
  assert.equal(forms[1].button.disabled, false);
  assert.equal(forms[1].attributes['aria-busy'], undefined);
});
test('failed requests retain the enquiry and show a retry message', async () => {
  const { forms } = boot(async () => ({ ok: false, json: async () => ({ error: 'Not sent' }) }));
  await forms[1].submit();
  assert.equal(forms[1].resets, 0);
  assert.match(forms[1].status.textContent, /try again/);
  assert.equal(forms[1].button.disabled, false);
});
test('invalid fields and double submissions do not send extra requests', async () => {
  let finish, calls = 0;
  const { forms } = boot(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  forms[0].valid = false;
  await forms[0].submit();
  assert.equal(calls, 0);
  const pending = forms[1].submit();
  await forms[1].submit();
  assert.equal(calls, 1);
  finish({ ok: true, json: async () => ({ ok: true }) });
  await pending;
});
test('floating contact control hides at the footer and returns afterwards', () => {
  const { floating, contactObserver } = boot(async () => { throw new Error('Unexpected request'); });
  contactObserver.callback([{ isIntersecting: true }]);
  assert.equal(floating.classes['is-at-contact'], true);
  assert.equal(floating.inert, true);
  assert.equal(floating.attributes['aria-hidden'], 'true');
  contactObserver.callback([{ isIntersecting: false }]);
  assert.equal(floating.classes['is-at-contact'], false);
  assert.equal(floating.inert, false);
});
