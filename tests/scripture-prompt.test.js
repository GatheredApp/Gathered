const test = require('node:test');
const assert = require('node:assert/strict');
const { generateScripturePrompt, generateDiaryScripturePrompt, copyPrompt, sharePrompt, SHARE_TITLE } = require('../scripture-prompt.js');

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

test('generates a diary-specific Scripture prompt with optional title, date, body, and useful tags', () => {
  const prompt = generateDiaryScripturePrompt({ title: 'A hard week', date: '2026-09-10', body: '**Work** has left me anxious, but I am grateful.', tags: ['work', 'gratitude'], media: [{ name: 'private.jpg' }], id: 'diary-secret', createdAt: 'internal' });
  assert.match(prompt, /I have the following diary entry:/);
  assert.match(prompt, /Title: A hard week/);
  assert.match(prompt, /Date: 2026-09-10/);
  assert.match(prompt, /\*\*Work\*\* has left me anxious/);
  assert.match(prompt, /Relevant tags: work, gratitude/);
  assert.doesNotMatch(prompt, /prayer request/i);
  assert.match(prompt, /Do not invent or paraphrase Scripture/);
  assert.match(prompt, /standard YouVersion Bible URLs/);
  assert.doesNotMatch(prompt, /private\.jpg|diary-secret|internal/);
});

test('diary Scripture prompt omits an absent title cleanly', () => {
  const prompt = generateScripturePrompt({ date: '2026-09-10', body: 'A titleless reflection.' }, 'diary');
  assert.doesNotMatch(prompt, /Title:/);
  assert.match(prompt, /A titleless reflection\./);
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
