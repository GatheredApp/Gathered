const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { slides } = require('../tour.js');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'tour.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'enhancements.css'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('home invitation uses the required copy directly after the existing tagline', () => {
  assert.match(app, /Capture the Word, remember your people, and carry prayer forward from week to week\.<\/p><\/section>/);
  assert.match(source, /<\/p><button class="tour-invitation"[^>]*>Take a tour of the Gathered app<\/button><\/section>/);
  assert.match(css, /\.tour-invitation\{[^}]*justify-content:center[^}]*text-align:center/);
  assert.ok(html.indexOf('tour.js') > html.indexOf('crypto.js'));
});

test('tour presents ten accurate, ordered feature groups', () => {
  assert.equal(slides.length, 10);
  assert.equal(slides[0].title, 'Gather what matters.');
  assert.equal(slides.at(-1).title, 'Your story stays yours.');
  for (const topic of ['Small Group', 'Sunday Worship', 'Individual Devotion', 'YouVersion', 'answered', 'AI assistant', 'saves automatically', 'due date', 'Search', 'encrypted']) {
    assert.match(JSON.stringify(slides), new RegExp(topic, 'i'));
  }
});

test('controls support previous, next, Done, pagination, close, Escape, and browser Back', () => {
  assert.match(source, /data-tour-previous/);
  assert.match(source, /data-tour-next/);
  assert.match(source, /data-tour-dot/);
  assert.match(source, /\? 'Done' : 'Next'/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /history\.pushState/);
  assert.match(source, /history\.back\(\)/);
  assert.match(source, /addEventListener\('popstate'/);
});

test('tour provides modal semantics, focus handling, live slide status, and reduced motion', () => {
  assert.match(source, /role="dialog" aria-modal="true"/);
  assert.match(source, /Slide \$\{current \+ 1\} of \$\{slides\.length\}/);
  assert.match(source, /returnFocus\?\.focus/);
  assert.match(source, /event\.key !== 'Tab'/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /scroll-snap-type:x mandatory/);
  assert.match(css, /touch-action:pan-x pan-y/);
});

test('viewing the tour never calls application persistence or browser storage', () => {
  assert.doesNotMatch(source, /\bsaveState\s*\(|indexedDB|localStorage|sessionStorage/);
});

test('tour script is part of the offline application shell', () => {
  assert.match(worker, /APP_SHELL=.*'tour\.js'/);
});
