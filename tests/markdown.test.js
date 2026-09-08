const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderMarkdown, safeLink } = require('../markdown.js');

test('renders links with safe external browser attributes', () => {
  const html = renderMarkdown('Check [YouVersion](https://www.bible.com/)');
  assert.match(html, /<a href="https:\/\/www\.bible\.com\/" target="_blank" rel="noopener noreferrer">YouVersion<\/a>/);
});

test('renders bold, italic, strikethrough, and inline code', () => {
  assert.equal(renderMarkdown('**bold** and *italic* and ~~old~~ and `code`'), '<p><strong>bold</strong> and <em>italic</em> and <del>old</del> and <code>code</code></p>');
});

test('renders bulleted and numbered lists', () => {
  assert.equal(renderMarkdown('- one\n- two\n\n1. first\n2. second'), '<ul><li>one</li><li>two</li></ul><ol><li>first</li><li>second</li></ol>');
});

test('renders paragraphs and line breaks', () => {
  assert.equal(renderMarkdown('line one\nline two\n\nnext'), '<p>line one<br>line two</p><p>next</p>');
});

test('plain text remains text', () => assert.equal(renderMarkdown('ordinary words'), '<p>ordinary words</p>'));

test('neutralizes raw HTML, event handlers, and script tags', () => {
  const html = renderMarkdown('<img src=x onerror=alert(1)><script>alert(2)</script>');
  assert.doesNotMatch(html, /<img|<script/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('rejects javascript and other unsafe URL schemes', () => {
  assert.equal(renderMarkdown('[bad](javascript:alert(1))'), '<p>bad</p>');
  assert.equal(safeLink('data:text/html,x'), null);
});

test('editors preserve escaped raw Markdown and persistence stores raw values', () => {
  const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  assert.match(app, /<textarea class="textarea" id="journal"[\s\S]*?\$\{esc\(entry\.journal\)\}<\/textarea>/);
  assert.match(app, /journal:document\.getElementById\('journal'\)\.value\.trim\(\)/);
  assert.doesNotMatch(app, /journal:renderMarkdown/);
});

test('all free-text read-only paths use the centralized renderer', () => {
  const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  const prayers = fs.readFileSync(require.resolve('../standalone-prayers.js'), 'utf8');
  for (const expression of ['renderMarkdown(e.journal)', 'renderMarkdown(p.text)', 'renderMarkdown(f.text', 'renderMarkdown(m.notes)', 'renderMarkdown(t.text)', 'renderMarkdown(h.meta']) assert.ok(app.includes(expression), expression);
  assert.ok(prayers.includes('renderMarkdown(update.text)'));
  assert.ok(prayers.includes('renderMarkdown(p.text)'));
});

test('YouVersion Scripture behavior and offline asset registration remain present', () => {
  const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  const sw = fs.readFileSync(require.resolve('../sw.js'), 'utf8');
  assert.match(app, /https:\/\/www\.bible\.com\/bible/);
  assert.match(app, /class="scripture-link"/);
  assert.match(sw, /'markdown\.js'/);
});
