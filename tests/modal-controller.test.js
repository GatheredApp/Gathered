const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createModalController } = require('../modal-controller.js');

const stylesheet = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

function computedDisplay(element) {
  // Start with the browser's hidden user-agent rule, then apply matching author
  // declarations in source order. This catches author display rules that would
  // otherwise override the hidden attribute (such as `.field { display: grid }`).
  let display = element.hidden ? 'none' : 'block';
  const rules = stylesheet.matchAll(/([^{}]+)\{([^{}]*)\}/g);
  for (const [, selectorList, declarations] of rules) {
    const declaration = declarations.match(/(?:^|;)\s*display\s*:\s*([^;]+)/);
    if (!declaration) continue;
    const matches = selectorList.split(',').some(rawSelector => {
      const selector = rawSelector.trim();
      const match = selector.match(/^\.([\w-]+)(\[hidden\])?$/);
      return match && element.className.split(/\s+/).includes(match[1]) && (!match[2] || element.hidden);
    });
    if (matches) display = declaration[1].trim();
  }
  return display;
}

class Element {
  constructor(document) { this.document = document; this.listeners = {}; this.hidden = false; this.disabled = false; this.dataset = {}; this.className = ''; this.textContent = ''; this.value = ''; }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  dispatch(type, values = {}) { const event = { preventDefault() {}, target: this, ...values }; return Promise.all((this.listeners[type] || []).map(fn => fn(event))); }
  focus() { this.document.activeElement = this; }
  closest(selector) { return selector === '[hidden]' && this.hidden ? this : null; }
  setAttribute(name, value) { this[name] = value; }
  removeAttribute(name) { delete this[name]; }
  reset() {}
}

function fixture() {
  const document = { activeElement: null, getElementById(id) { return this.elements[id]; } };
  const ids = ['appModal','appModalForm','appModalTitle','appModalDescription','appModalIcon','appModalField','appModalLabel','appModalInput','appModalError','appModalCancel','appModalSubmit'];
  document.elements = Object.fromEntries(ids.map(id => [id, new Element(document)]));
  const overlay = document.elements.appModal;
  overlay.hidden = true;
  document.elements.appModalField.className = 'modal-field field';
  overlay.querySelectorAll = () => [document.elements.appModalInput, document.elements.appModalCancel, document.elements.appModalSubmit];
  return { document, elements: document.elements, modal: createModalController(document) };
}

test('confirmation resolves explicit confirm and cancel results', async () => {
  let f = fixture();
  const confirmed = f.modal.confirm('Continue?');
  await f.elements.appModalForm.dispatch('submit');
  assert.deepEqual(await confirmed, { confirmed: true, value: undefined });
  f = fixture();
  const cancelled = f.modal.confirm('Continue?');
  await f.elements.appModalCancel.dispatch('click');
  assert.deepEqual(await cancelled, { confirmed: false, value: null });
});

test('modal field computed display is hidden for dialogs and visible for prompts', async () => {
  const scenarios = [
    ['confirm', 'none'],
    ['message', 'none'],
    ['error', 'none'],
    ['input', 'grid'],
    ['password', 'grid']
  ];

  for (const [method, expectedDisplay] of scenarios) {
    const f = fixture();
    const result = f.modal[method]('Dialog text');
    assert.equal(computedDisplay(f.elements.appModalField), expectedDisplay, `${method} field display`);
    await f.elements.appModalForm.dispatch('submit');
    await result;
  }
});

test('required input stays open until populated and password uses a password field', async () => {
  const f = fixture();
  const result = f.modal.password('Secret', { required: true });
  assert.equal(f.elements.appModalInput.type, 'password');
  await f.elements.appModalForm.dispatch('submit');
  assert.equal(f.elements.appModalError.hidden, false);
  f.elements.appModalInput.value = 'correct horse battery staple';
  await f.elements.appModalForm.dispatch('submit');
  assert.deepEqual(await result, { confirmed: true, value: 'correct horse battery staple' });
});

test('Escape cancels a safe dialog and restores invoking focus', async () => {
  const f = fixture();
  const invokingControl = new Element(f.document);
  invokingControl.focus();
  const result = f.modal.confirm('Continue?');
  await f.elements.appModal.dispatch('keydown', { key: 'Escape' });
  assert.equal((await result).confirmed, false);
  assert.equal(f.document.activeElement, invokingControl);
});

test('destructive callback runs once while duplicate submissions are blocked', async () => {
  const f = fixture();
  let release, calls = 0;
  const pending = new Promise(resolve => { release = resolve; });
  const result = f.modal.confirm('Delete?', { destructive: true, onConfirm: async () => { calls++; await pending; } });
  const first = f.elements.appModalForm.dispatch('submit');
  await Promise.resolve();
  await f.elements.appModalForm.dispatch('submit');
  assert.equal(calls, 1);
  assert.equal(f.elements.appModalSubmit.disabled, true);
  release();
  await first;
  assert.equal((await result).confirmed, true);
});
