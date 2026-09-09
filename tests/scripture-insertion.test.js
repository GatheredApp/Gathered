const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const editorBinding = source.slice(source.indexOf('function bindEntryEditor'), source.indexOf('\nfunction entryDetail'));

test('session editor exposes an explicit Scripture insertion control', () => {
  assert.match(source, /<button class="btn secondary scripture-insert" type="button" id="insertScripture">Insert into Session Journal<\/button>/);
  assert.match(editorBinding, /insertScripture\.addEventListener\('click',loadScripture\)/);
});

test('citation and translation edits update only the local preview', () => {
  assert.match(editorBinding, /scripture\.addEventListener\('input',updatePreview\)/);
  assert.match(editorBinding, /translation\.addEventListener\('change',updatePreview\)/);
  assert.doesNotMatch(editorBinding, /setTimeout\(loadScripture/);
  assert.doesNotMatch(editorBinding, /onblur\s*=\s*loadScripture/);
});

test('button validates locally before invoking the existing provider', () => {
  const load = editorBinding.slice(editorBinding.indexOf('const loadScripture'), editorBinding.indexOf('const updatePreview'));
  assert.ok(load.indexOf("if(!parseScripture(reference,translation.value))") < load.indexOf('fetchScripturePassage('));
  assert.match(load, /Enter a valid Bible passage, such as Romans 8:28\./);
  assert.match(load, /fetchScripturePassage\(reference,requestedTranslation,selectedCredential\(\),scriptureRequest\.signal\)/);
});

test('loading state prevents concurrent insertion requests', () => {
  assert.match(editorBinding, /if\(insertingScripture\)return/);
  assert.match(editorBinding, /insertScripture\.disabled=true;insertScripture\.textContent='Inserting…'/);
  assert.match(editorBinding, /insertScripture\.disabled=false;insertScripture\.textContent='Insert into Session Journal'/);
});

test('insertion preserves journal notes and notifies draft autosave', () => {
  assert.match(editorBinding, /else journal\.value=block\+journal\.value/);
  assert.doesNotMatch(editorBinding, /journal\.value=block;/);
  assert.match(editorBinding, /journal\.dispatchEvent\(new Event\('input',\{bubbles:true\}\)\)/);
  assert.match(editorBinding, /catch\(error\).*scriptureStatus\.textContent=/s);
});
