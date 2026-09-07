const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'crypto.js'), 'utf8');

test('trusted restoration precedes locked mode and uses a wrapped DEK', () => {
  assert.match(source, /const restored=await restoreUnlockSession\(envelope\).*mode:'unlocked'.*mode:'locked'/s);
  assert.match(source, /generateKey\(\{name:'AES-KW',length:256\},false/);
  assert.match(source, /wrappedDek:b64\(wrappedDek\)/);
  assert.doesNotMatch(source, /UNLOCK_SESSION_KEY[^\n]*(passphrase|plaintextDek)/i);
});

test('window is absolute, rejects exact expiry, malformed data, and rollback', () => {
  assert.match(source, /UNLOCK_TTL_MS = 2 \* 60 \* 60 \* 1000/);
  assert.match(source, /expiresAt:now\+UNLOCK_TTL_MS/);
  assert.match(source, /now<record\.expiresAt/);
  assert.match(source, /now>=record\.authenticatedAt&&now>=record\.lastSeenAt/);
  assert.match(source, /typeof record\.wrappedDek==='string'/);
});

test('lock, reset, passphrase change and import revoke trusted state', () => {
  assert.match(source, /lockGathered.*clearUnlockSession/s);
  assert.match(source, /pre-reset',false\);await clearUnlockSession\(\)/);
  assert.match(source, /cryptoSession\.envelope=candidate;await lockGathered\(\)/);
  assert.match(source, /pre-import',false\);await clearUnlockSession\(\)/);
});

test('revocation crosses tabs and automatic lock flushes drafts first', () => {
  assert.match(source, /new BroadcastChannel\('gathered-trusted-unlock'\)/);
  assert.match(source, /addEventListener\('storage'.*UNLOCK_REVOCATION_KEY/s);
  assert.match(source, /if\(flush\)await flushPendingDraftSaves\(\)/);
  assert.match(source, /flushPendingDraftSaves[\s\S]*await saveChain/);
});
