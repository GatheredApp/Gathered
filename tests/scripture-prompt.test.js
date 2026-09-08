const test = require('node:test');
const assert = require('node:assert/strict');
const { generateScripturePrompt, copyPrompt, sharePrompt, SHARE_TITLE } = require('../scripture-prompt.js');

test('generates a prompt containing prayer text without an updates section', () => {
  const prompt = generateScripturePrompt({ text: 'Please pray for wisdom about a new job.', updates: [] });
  assert.match(prompt, /"Please pray for wisdom about a new job\."/);
  assert.doesNotMatch(prompt, /Recent updates:/);
  assert.match(prompt, /3–5 Bible passages/);
  assert.match(prompt, /YouVersion/);
});

test('includes prayer updates in chronological order', () => {
  const prompt = generateScripturePrompt({ text: 'Healing after surgery', updates: [
    { text: 'Physical therapy began.', date: '2026-02-03' },
    { text: 'Surgery is scheduled.', date: '2026-01-02' },
    { text: 'Walking without assistance.', createdAt: '2026-03-01T10:00:00Z' }
  ] });
  assert.match(prompt, /Recent updates:\n\n- Surgery is scheduled\.\n- Physical therapy began\.\n- Walking without assistance\./);
});

test('copy uses the Clipboard API and reports success', async () => {
  let copied, message;
  const result = await copyPrompt('prompt', { navigator: { clipboard: { writeText: async value => { copied = value; } } }, notify: value => { message = value; } });
  assert.equal(result, true);
  assert.equal(copied, 'prompt');
  assert.equal(message, 'Prompt copied');
});

test('share invokes the Web Share API with a neutral title', async () => {
  let payload;
  await sharePrompt('prompt', { navigator: { share: async value => { payload = value; } } });
  assert.deepEqual(payload, { title: SHARE_TITLE, text: 'prompt' });
});

test('share gracefully falls back to clipboard when Web Share is unavailable', async () => {
  let copied;
  await sharePrompt('prompt', { navigator: { clipboard: { writeText: async value => { copied = value; } } } });
  assert.equal(copied, 'prompt');
});

test('copy failure leaves the local prompt selected for manual copying', async () => {
  let selected = false, message = '';
  const result = await copyPrompt('prompt', { navigator: {}, selectPrompt: () => { selected = true; }, notify: value => { message = value; } });
  assert.equal(result, false);
  assert.equal(selected, true);
  assert.match(message, /manual copying/);
});

test('prompt feature has no network integration', () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'scripture-prompt.js'), 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
});
