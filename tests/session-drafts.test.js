const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const security = fs.readFileSync(path.join(root, 'crypto.js'), 'utf8');
const enhancements = fs.readFileSync(path.join(root, 'enhancements.css'), 'utf8');

test('hash navigation resolves the enhanced render function at event time', () => {
  assert.match(app, /addEventListener\('hashchange',\(\)=>render\(\)\)/);
  assert.doesNotMatch(app, /addEventListener\('hashchange',render\)/);
});

test('new-session picker exposes every supported session type', () => {
  for (const type of ['small-group', 'sunday-worship', 'individual-devotion']) {
    assert.match(security, new RegExp(`data-session-choice=["']${type}["']`));
    assert.match(security, new RegExp(`<option value=["']${type}["']`));
  }
});

test('draft editing captures input immediately and persists it after debounce', () => {
  assert.match(security, /form\.addEventListener\('input',autosave\)/);
  assert.match(security, /capture\(\);.*Saving…/);
  assert.match(security, /setTimeout\(\(\)=>saveState\(\).*700/);
  assert.match(security, /status:'draft'/);
  assert.match(security, /createDraft\(choice\.dataset\.sessionChoice\)/);
});

test('home draft notice is spaced apart from the new-session card', () => {
  assert.match(security, /class=["']notice draft-notice["']/);
  assert.match(enhancements, /\.draft-notice\{margin-bottom:12px\}/);
});
