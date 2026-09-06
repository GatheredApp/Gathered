const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('page and service worker declare the same app version', () => {
  const pageVersion = app.match(/const APP_VERSION = '([^']+)'/)[1];
  const workerVersion = serviceWorker.match(/const APP_VERSION='([^']+)'/)[1];
  assert.equal(pageVersion, workerVersion);
});

test('service worker reports its version to the page', () => {
  assert.match(serviceWorker, /GET_APP_VERSION/);
  assert.match(serviceWorker, /type:'APP_VERSION',version:APP_VERSION/);
  assert.match(app, /installedVersion!==APP_VERSION/);
});

test('an accessible update prompt provides update and dismiss actions', () => {
  assert.match(index, /role="dialog" aria-modal="true"/);
  assert.match(index, /id="installUpdate"[^>]*>Update App</);
  assert.match(index, /id="dismissUpdate"[^>]*>Not now</);
});
