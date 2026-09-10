const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { generateMessagePrompt, generateDiaryMessagePrompt, copyPrompt, sharePrompt, SHARE_TITLE } = require('../message-prompt.js');

test('generates the pastoral message prompt from prayer text without an empty updates section', () => {
  const prompt = generateMessagePrompt({ text: 'Please pray for wisdom about a new job.', updates: [] });
  assert.match(prompt, /"Please pray for wisdom about a new job\."/);
  assert.doesNotMatch(prompt, /Updates to this prayer:/);
  assert.match(prompt, /500–800 words/);
  assert.match(prompt, /3–5 minute spoken message/);
});

test('includes nonblank updates in chronological and stable order', () => {
  const prompt = generateMessagePrompt({ text: 'Healing after surgery', updates: [
    { text: 'Physical therapy began.', date: '2026-02-03' },
    { text: 'Surgery is scheduled.', date: '2026-01-02' },
    { text: 'Same-day second update.', createdAt: '2026-02-03T12:00:00' },
    { text: '   ', date: '2025-01-01' },
    { text: 'Walking without assistance.', createdAt: '2026-03-01T10:00:00Z' }
  ] });
  assert.match(prompt, /Updates to this prayer:\n\n- Surgery is scheduled\.\n- Physical therapy began\.\n- Same-day second update\.\n- Walking without assistance\./);
  assert.doesNotMatch(prompt, /^\s*-\s*$/m);
});

test('includes the biblical, pastoral, accuracy, and read-aloud requirements', () => {
  const prompt = generateMessagePrompt({ text: 'Comfort in grief' });
  assert.match(prompt, /2–4 particularly relevant Bible passages/);
  assert.match(prompt, /standard YouVersion link/);
  assert.match(prompt, /Do not invent Scripture/);
  assert.match(prompt, /Do not claim to know God's specific plan/);
  assert.match(prompt, /faithful prayer guarantees the requested result/);
  assert.match(prompt, /Conclude with a short prayer of approximately 75–125 words/);
  assert.match(prompt, /sound natural when read aloud/);
  assert.match(prompt, /continuous pastoral message/);
});

test('generates a diary-specific pastoral prompt without leaking media or internal metadata', () => {
  const prompt = generateDiaryMessagePrompt({ title: 'Looking ahead', date: '2026-09-10', body: 'I am hopeful and uncertain about moving.', tags: ['change'], media: [{ id: 'media-private', name: 'home.mov' }], id: 'entry-private', updatedAt: 'private-time' });
  assert.match(prompt, /I have the following diary entry:/);
  assert.match(prompt, /Title: Looking ahead/);
  assert.match(prompt, /I am hopeful and uncertain about moving\./);
  assert.doesNotMatch(prompt, /prayer request/i);
  assert.match(prompt, /500–800 words/);
  assert.match(prompt, /2–4 particularly relevant Bible passages/);
  assert.match(prompt, /Do not claim to know God's specific plan/);
  assert.match(prompt, /Do not promise a particular outcome/);
  assert.match(prompt, /standard YouVersion link/);
  assert.match(prompt, /voice or read-aloud functionality/);
  assert.doesNotMatch(prompt, /media-private|home\.mov|entry-private|private-time/);
});

test('diary pastoral prompt omits an empty title', () => {
  const prompt = generateMessagePrompt({ title: ' ', date: '2026-09-10', body: 'Just the entry body.' }, 'diary');
  assert.doesNotMatch(prompt, /Title:/);
  assert.match(prompt, /Just the entry body\./);
});

test('copy uses the Clipboard API and reports success', async () => {
  let copied, message;
  const result = await copyPrompt('prompt', {
    navigator: { clipboard: { writeText: async value => { copied = value; } } },
    notify: value => { message = value; }
  });
  assert.equal(result, true);
  assert.equal(copied, 'prompt');
  assert.equal(message, 'Prompt copied');
});

test('clipboard failure selects the visible prompt for manual copying', async () => {
  let selected = false, message = '';
  const result = await copyPrompt('prompt', {
    navigator: { clipboard: { writeText: async () => { throw new Error('denied'); } } },
    selectPrompt: () => { selected = true; },
    notify: value => { message = value; }
  });
  assert.equal(result, false);
  assert.equal(selected, true);
  assert.match(message, /selected for manual copying/);
});

test('share invokes Web Share with the prompt and a provider-neutral title', async () => {
  let payload;
  const result = await sharePrompt('generated prompt', {
    navigator: { share: async value => { payload = value; } }
  });
  assert.equal(result, true);
  assert.deepEqual(payload, { title: SHARE_TITLE, text: 'generated prompt' });
  assert.equal(SHARE_TITLE, 'Create a Pastoral Message for a Prayer Request');
  assert.doesNotMatch(SHARE_TITLE, /ChatGPT|Claude|Gemini|Copilot/i);
});

test('missing Web Share falls back to clipboard', async () => {
  let copied;
  const result = await sharePrompt('prompt', {
    navigator: { clipboard: { writeText: async value => { copied = value; } } }
  });
  assert.equal(result, true);
  assert.equal(copied, 'prompt');
});

test('non-cancellation share failure falls back to clipboard', async () => {
  let copied;
  const result = await sharePrompt('prompt', { navigator: {
    share: async () => { throw new Error('share failed'); },
    clipboard: { writeText: async value => { copied = value; } }
  } });
  assert.equal(result, true);
  assert.equal(copied, 'prompt');
});

test('AbortError is treated as normal cancellation without copying', async () => {
  let copied = false;
  const error = new Error('cancelled');
  error.name = 'AbortError';
  const result = await sharePrompt('prompt', { navigator: {
    share: async () => { throw error; },
    clipboard: { writeText: async () => { copied = true; } }
  } });
  assert.equal(result, false);
  assert.equal(copied, false);
});

test('message prompt feature has no network integration', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'message-prompt.js'), 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
});

test('message prompt is wired into the prayer detail, accessible modal, and offline shell', () => {
  const root = path.join(__dirname, '..');
  const prayers = fs.readFileSync(path.join(root, 'standalone-prayers.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(prayers, />✦ Listen to a Message with AI<\/button>/);
  assert.match(prayers, /messagePrompt\?\.bindMessagePromptUI\(document\)/);
  assert.match(html, /id="messagePromptModal" role="dialog" aria-modal="true" aria-labelledby="messagePromptTitle" aria-describedby="messagePromptDescription messagePromptReadAloud"/);
  assert.match(html, /<textarea[^>]+id="messagePromptText" readonly/);
  assert.ok(html.indexOf('app.js') < html.indexOf('message-prompt.js'));
  assert.ok(html.indexOf('message-prompt.js') < html.indexOf('standalone-prayers.js'));
  assert.match(app, /APP_ASSETS[^\n]+message-prompt\.js/);
  assert.match(worker, /APP_SHELL[^\n]+message-prompt\.js/);
});
