# Gathered v1.2-v1.4 One-Shot Codex Implementation Prompt

Repository: https://github.com/GatheredApp/Gathered

Implement Gathered v1.2 through v1.4 in one cohesive change set. Inspect the current repository first, understand the existing architecture and data model, then make all necessary code, UI, migration, service-worker, backup/restore, documentation, and testing changes.

Do not stop for clarification. Make reasonable implementation decisions consistent with the requirements below. Preserve the existing local-first architecture, existing user data, offline PWA behavior, GitHub Pages compatibility, and current visual design.

Do not add a server, account system, cloud database, external authentication service, analytics, telemetry, or runtime CDN dependency.

The final product must implement all of the following.

---

# 1. v1.2: Small Group and Sunday Worship Sessions

Gathered currently treats every journal entry as a small-group session.

Extend the existing session/entry model so every session has a `sessionType`.

Supported values:

- `small-group`
- `sunday-worship`

## Data migration

Existing sessions that do not have `sessionType` must automatically migrate to:

`sessionType: "small-group"`

Existing sessions that do not have an explicit draft/completion status must automatically migrate to:

`status: "completed"`

Migration must be idempotent and must not destroy or duplicate existing data.

Increment the application/state schema version as appropriate.

## New-session flow

When creating a session, the user should first select:

**What are you gathering for?**

Present two polished choices:

- Small Group
- Sunday Worship

Then continue into the existing session editor.

Both types should retain the existing capabilities:

- Date
- Scripture
- Bible translation
- YouVersion linking
- Journal
- New prayer requests
- Prayer updates
- Follow-ups

Do not create two separate underlying session systems. Use one session model differentiated by `sessionType`.

## Session UI

Update applicable UI so the distinction is clear without adding clutter.

Examples:

- Session history/list should identify the session type.
- Session detail should identify the type.
- New/edit session screens should identify the type.
- Recent sessions/home cards should identify the type where appropriate.
- Search results involving sessions should identify the type where appropriate.

Use human-readable labels:

- Small Group
- Sunday Worship

Existing sessions must continue to behave exactly as they do now except that they are classified as Small Group.

Allow the session type to be changed while editing an existing session.

Do not make Sunday Worship dependent on a specific small-group member.

---

# 2. v1.2: Session Auto-Save and Draft Sessions

This feature is required because a partially entered session can currently be lost if the user navigates away before pressing Save.

A user who starts a session must not lose their work merely because they:

- Navigate to another Gathered screen
- Press the browser/device back button
- Switch apps
- Reload the PWA
- Close and reopen the installed PWA
- Experience an ordinary browser refresh or page lifecycle event

Implement durable session drafts and automatic saving.

## Session status

Use the existing session/entry model and add a status field rather than creating a separate draft data system.

Supported session status values:

- `draft`
- `completed`

Existing sessions migrate to `completed`.

Draft sessions remain normal session objects in the same underlying collection, differentiated by status.

## Creating a draft

Once the user chooses Small Group or Sunday Worship and enters the new-session editor, create a persistent draft session.

Do not wait until the user presses the final Save Session button before creating persistent state.

The draft should immediately have at least:

- Unique session ID
- `sessionType`
- `status: "draft"`
- Session date
- Created timestamp
- Updated timestamp
- Empty/default values for the remaining session fields

This ensures that navigating away immediately after beginning a session cannot destroy the session shell.

Avoid creating duplicate drafts if the new-session route/editor is re-rendered.

## Auto-save behavior

Automatically save edits to the draft while the user works.

Auto-save all session-editable data, including:

- Session type
- Date
- Scripture
- Translation
- Journal text
- New prayer request rows
- Prayer-update rows
- Follow-up rows
- Any other editable session fields introduced by this implementation

Use a debounced save strategy so normal typing does not create an excessive number of IndexedDB writes.

A target debounce window around 500-1000 ms is reasonable.

Also flush pending draft changes when appropriate browser lifecycle signals occur, including where practical:

- `visibilitychange`
- `pagehide`
- navigation within Gathered
- before abandoning/replacing the editor view

Do not rely exclusively on `beforeunload`.

Because IndexedDB is asynchronous, design this defensively rather than assuming an async write is guaranteed to finish after unload has begun.

Prefer continuous debounced persistence so lifecycle flushes are merely a final safeguard.

## Draft prayer requests and follow-ups

Do not prematurely create durable prayer-history records merely because the user typed text into an unfinished draft row.

Draft-only prayer-request rows, prayer-update rows, and follow-up rows may remain embedded as draft editor data until the session is finalized, unless a clean architecture permits safe provisional records.

The key requirement is:

**Everything the user typed in the draft session must be recoverable when the draft is reopened.**

When the user finalizes the session, convert valid draft rows into the normal durable `state.prayers`, prayer updates, and `state.followUps` structures exactly once.

Do not duplicate prayers, updates, or follow-ups if auto-save ran many times.

If provisional durable objects are used internally, they must be explicitly marked and reconciled safely.

## Finalizing a session

The existing **Save Session** action should become the intentional completion/finalization action.

When pressed:

1. Validate required final-session fields.
2. Reconcile draft prayer requests, prayer updates, and follow-ups into the normal durable data model exactly once.
3. Set:
   `status: "completed"`
4. Persist the completed session.
5. Remove any obsolete draft-only editor payload.
6. Navigate to the completed session detail view.

Do not lose data if finalization fails.

If final persistence fails, leave the session as a recoverable draft.

## Draft Sessions UI

Create a clearly discoverable place called:

**Draft Sessions**

The Sessions area should distinguish:

- Draft Sessions
- Completed session history

A reasonable implementation is a Draft Sessions section at the top of the Sessions page.

Each draft should show useful identifying information such as:

- Session type
- Session date
- Scripture if entered
- Last edited time

Provide actions to:

- Resume draft
- Delete draft

Deleting a draft must require confirmation.

Deleting a draft must also clean up any draft-only/provisional dependent records created by the chosen implementation.

Do not delete already-established durable prayers merely because they were referenced or updated by a draft unless those changes were explicitly created as draft-only data.

## Draft indicators

When editing a draft, show a subtle status indicator such as:

- `Draft`
- `Saving...`
- `Saved`

Avoid intrusive toast messages on every auto-save.

The user should be able to tell that their work has been preserved.

If an auto-save fails, show a visible warning and continue retaining the current in-memory editor contents so the user can retry.

## Draft recovery

When a user resumes a draft, restore the editor exactly enough that they can continue where they left off, including:

- Session type
- Date
- Scripture
- Translation
- Journal
- Unsaved/new prayer rows
- Prayer-update rows
- Follow-up rows

Do not silently discard partially completed fields merely because they would fail final validation.

Final validation belongs at finalization time, not draft-save time.

## Navigation behavior

Do not force users to answer a modal confirmation merely because they navigate away from a draft.

The point of this feature is that Gathered safely saves the draft automatically.

A user should be able to navigate away naturally and later resume from Draft Sessions.

## Search and home behavior

Drafts should not be treated as completed sessions.

Do not mix them into completed session history.

Do not include incomplete draft text in global search unless the UI clearly labels the result as a Draft Session.

Prefer excluding drafts from ordinary global search unless there is a strong UX reason to include them.

Home/recent-session views should not present a draft as though it were a completed gathering.

It is acceptable to show a separate lightweight "You have X draft sessions" affordance.

## Encryption interaction

Once v1.4 encryption is active, draft session content must receive the same encryption-at-rest protection as the rest of Gathered state.

Do not create a plaintext draft store as a shortcut.

Do not put draft text into:

- `localStorage`
- `sessionStorage`
- Cache Storage
- URLs
- service-worker caches

Draft data must be persisted through the encrypted state/persistence architecture.

---

# 3. v1.3: Full Prayer Request Editing and Deletion

Inspect the current prayer implementation carefully before changing it.

The current application already has substantial prayer editing functionality and individual prayer-update edit/delete functionality. Preserve those capabilities.

## Prayer request editing

Make editing the underlying prayer request itself obvious in the UI.

A prayer request must support editing:

- Person/member
- Prayer request text
- Original/start date
- Active/answered status

Preserve existing prayer updates and history when editing the underlying request.

Use an explicit label such as:

**Edit Request**

Do not call the primary editing action merely "Update" if that is ambiguous with adding a prayer update.

## Prayer request deletion

Add the ability to permanently delete the entire prayer request.

The delete action should be available from an appropriate prayer-request editing/detail screen.

Require confirmation with language substantially equivalent to:

**Delete this prayer request? This will permanently delete the request and all of its updates. This cannot be undone.**

On deletion:

1. Remove the prayer from `state.prayers`.
2. Remove the prayer ID from every session/entry `prayerIds` collection.
3. Delete all updates belonging to the prayer as part of deleting the prayer object.
4. Remove any draft-session references to the prayer where applicable.
5. Ensure no dangling references remain.
6. Ensure member timelines, search, session details, prayer lists, and other derived views no longer reference the deleted prayer.
7. Navigate safely back to the prayer list after deletion.
8. Persist the deletion immediately.

Do not delete the session in which the prayer originated.

Preserve the existing ability to independently edit and delete individual prayer updates.

---

# 4. v1.4: App-Wide Encryption

This is the most important architectural part of the task.

Gathered stores potentially sensitive journal, member, and prayer information. Implement real client-side encryption at rest.

The encryption must cover all user-content state persisted by Gathered, including Draft Sessions.

Do not merely encrypt selected text fields.

Do not create cosmetic "locked" UI while leaving plaintext user state in IndexedDB or localStorage.

## Security architecture

Use envelope encryption.

### Data Encryption Key

Generate a cryptographically random 256-bit Data Encryption Key, or DEK, using the Web Crypto API.

Use the DEK to encrypt the complete Gathered application state using:

**AES-256-GCM**

Generate a fresh cryptographically random IV for every state encryption operation.

Never reuse an AES-GCM IV with the same DEK.

The raw DEK must never be persisted unprotected.

### Passphrase Key Encryption Key

The user establishes an app-wide passphrase.

Derive a Key Encryption Key, or KEK, from the passphrase using the Web Crypto API.

Preferred implementation:

- PBKDF2
- HMAC-SHA-256
- 256-bit derived key
- Strong iteration count suitable for modern mobile devices, with the parameters persisted as metadata
- Target approximately 600,000 iterations unless device-performance considerations require a carefully justified adjustment

Generate a random salt.

Use the passphrase-derived KEK to wrap the DEK using an appropriate Web Crypto wrapping algorithm such as AES-KW.

Changing the user's passphrase should normally require re-wrapping the DEK, not decrypting and re-encrypting every application record.

Never store:

- The user's passphrase
- A plaintext copy of the DEK
- Decrypted application state in persistent browser storage

Decrypted state may exist in application memory while Gathered is unlocked.

## IndexedDB layout

Refactor persistence as necessary so IndexedDB contains only:

1. Non-sensitive encryption metadata required to unlock the application.
2. Wrapped key material that is cryptographically protected.
3. Encrypted Gathered state ciphertext.

An appropriate encrypted envelope may contain values such as:

- encryption format version
- KDF name
- KDF parameters
- KDF salt
- wrapped DEK
- state IV
- state ciphertext
- schema/version information necessary to read the encrypted envelope

Do not include user journal content, prayer text, draft-session text, member notes, contact information, or other user content in plaintext metadata.

Do not write sensitive data to console logs.

Do not put sensitive data in URLs.

## App lock/unlock lifecycle

When encryption has been configured:

Opening or reloading Gathered should present a polished locked screen before displaying user content.

Flow:

**Gathered -> Unlock -> Application**

The user enters the app-wide passphrase.

If correct:

- Derive the KEK.
- Unwrap the DEK.
- Decrypt the state.
- Validate the decrypted state.
- Load the normal application UI.

If incorrect:

- Do not reveal technical cryptographic details.
- Show a simple error such as **Incorrect passphrase**.
- Remain locked.

Do not persist the entered passphrase.

Do not persist the raw DEK outside protected browser memory.

Add a Settings action:

**Lock Gathered**

Before deliberately locking from an active editor, flush pending draft auto-save work where practical.

Then clear decrypted state/key references from normal application variables as far as reasonably possible in JavaScript and return to the locked screen.

A full reload/close must require unlocking again unless device unlock described below has been intentionally enabled.

---

# 5. Passphrase Setup and Strength Meter

Existing users must not lose data.

New users should establish a passphrase as part of initial setup.

Existing plaintext users should be prompted to protect Gathered with a passphrase before continuing with the encrypted version.

## Passphrase UX

Provide:

- New passphrase
- Confirm passphrase
- Show/hide passphrase control
- Strength/entropy meter
- Clear guidance

Favor long memorable passphrases rather than arbitrary complexity requirements.

Do not require rules such as:

- mandatory uppercase letter
- mandatory symbol
- mandatory number

Implement a reasonable strength estimator locally.

It does not need to claim mathematically exact Shannon entropy.

The UI may show:

- Weak
- Fair
- Good
- Strong

Penalize obvious weak patterns such as:

- very short passwords
- repeated characters
- simple sequences
- extremely common passwords/passphrases

Reward length heavily.

Require a modest minimum strength sufficient to prevent obviously weak passphrases. A reasonable target is approximately 40 bits of estimated search resistance plus a practical minimum length, but use a score-based implementation if that produces a more defensible UX.

Recommend stronger passphrases rather than preventing reasonable memorable phrases.

No strength-checking data may leave the device.

Do not use a network API for password evaluation.

Include this warning during initial setup:

**Gathered cannot recover your passphrase. If you forget it and do not have another way to unlock your data, your encrypted data cannot be recovered.**

Require the user to acknowledge this before encryption is enabled.

---

# 6. Safe Migration of Existing Plaintext Data

This must be handled carefully.

Existing Gathered users already have state stored locally.

Implement a one-time plaintext-to-encrypted migration.

The migration should:

1. Load and validate the existing plaintext state using the existing migration logic.
2. Apply all required schema migrations, including:
   - missing `sessionType` -> `small-group`
   - missing session `status` -> `completed`
3. Ask the user to establish a passphrase.
4. Generate the DEK.
5. Encrypt the state.
6. Persist the encrypted envelope.
7. Read the encrypted data back.
8. Successfully decrypt and validate it.
9. Only after successful round-trip verification remove the obsolete plaintext persisted state.
10. Never delete the user's existing data before encrypted persistence is verified.

Migration must be crash-safe to the extent reasonably possible.

If migration fails, leave the original plaintext data intact and tell the user encryption setup could not be completed.

Do not silently reset Gathered.

Preserve the existing legacy `localStorage` -> IndexedDB migration behavior, but ensure the final persisted user state becomes encrypted.

---

# 7. Change Passphrase

Add a Settings workflow:

**Change Passphrase**

Require the current passphrase unless the application already has sufficient unlocked key material and you implement an equally secure confirmation mechanism.

The user enters and confirms the new passphrase.

Evaluate the new passphrase with the same strength rules.

Generate a new KDF salt.

Derive a new KEK.

Re-wrap the existing DEK.

Persist and verify the new metadata before discarding the previous wrapped-key configuration.

The user's encrypted application state should remain intact.

Changing the passphrase must not erase prayer histories, sessions, Draft Sessions, members, follow-ups, or settings.

---

# 8. Device/Biometric Unlock

Implement optional device-assisted unlock only when it can be done securely using capabilities actually exposed by the browser/device.

Do not pretend biometrics exist by storing the passphrase or raw encryption key in localStorage, IndexedDB, cookies, Cache Storage, or another unprotected browser store.

Preferred architecture:

Use a WebAuthn platform authenticator with user verification and, where supported, the WebAuthn PRF extension or another standards-based mechanism that produces secret material suitable for wrapping/unwrapping the Gathered DEK.

Conceptually:

1. The normal passphrase remains the root recovery/unlock method.
2. After Gathered is unlocked with the passphrase, Settings may offer:
   **Enable Device Unlock**
3. Feature-detect whether a user-verifying platform authenticator is available.
4. Feature-detect whether the browser/authenticator exposes a secure PRF or equivalent capability that can derive secret material.
5. If available:
   - Create/register a local WebAuthn platform credential.
   - Require user verification.
   - Use PRF-derived secret material plus HKDF or another appropriate derivation step to derive a biometric/device KEK.
   - Use that KEK to wrap the same DEK.
   - Persist only the credential identifier, non-sensitive parameters, and wrapped DEK.
6. At future app launch:
   - Offer **Unlock with Device**
   - Invoke the platform authenticator.
   - Require user verification.
   - Derive the device KEK.
   - Unwrap the DEK.
   - Decrypt Gathered.

The operating system may satisfy user verification with fingerprint, face recognition, device PIN, or another approved mechanism. Do not falsely claim the exact modality if the WebAuthn API does not disclose it.

If secure device unlock is unavailable, simply omit or disable the feature and keep passphrase unlock fully functional.

Do not weaken encryption to make biometric unlock available.

Do not store the raw DEK in credential metadata.

Do not implement insecure fallback "biometrics."

Add a Settings action to disable device unlock. Disabling it should delete Gathered's local biometric/device-unlock metadata and wrapped-DEK copy without affecting the passphrase-encrypted data.

Passphrase unlock must always continue to work even when device unlock is configured.

---

# 9. Backup and Restore

The existing backup/restore system must be updated for encryption.

New backups must never contain plaintext Gathered user data.

Export an encrypted Gathered backup containing enough information to decrypt and validate the backup with the appropriate passphrase.

Include:

- backup format/version
- crypto metadata
- wrapped DEK or equivalent protected key material
- encrypted state ciphertext
- IVs/nonces
- necessary KDF parameters
- integrity/authentication information supplied by the authenticated-encryption design

Do not include the passphrase.

Do not include a plaintext state copy.

Draft Sessions must be included in encrypted backups.

## Restore

Support restoring an encrypted Gathered backup on a new device.

The restore flow must:

1. Read and validate the backup envelope.
2. Prompt for the backup's passphrase when necessary.
3. Attempt to unwrap/decrypt.
4. Reject an incorrect passphrase cleanly.
5. Validate the decrypted Gathered state before replacing existing state.
6. Preserve the application's existing safety-export behavior before destructive import where practical.
7. Persist the restored state encrypted.

If appropriate, allow the restored data to be re-protected with the current device's Gathered passphrase after successful decryption.

Preserve backward compatibility with legacy plaintext Gathered JSON backups if reasonably feasible.

If importing a legacy plaintext backup:

- Clearly identify it as an older unencrypted backup.
- Validate it using the existing validation logic.
- Import it only while Gathered is unlocked.
- Immediately persist the resulting application state encrypted.
- Never create a new plaintext backup.

---

# 10. Persistence Refactor

The existing `loadState()` and `saveState()` architecture should remain conceptually simple for the rest of the application.

Prefer creating a dedicated crypto/persistence layer rather than scattering encryption logic throughout UI code.

For example, it is acceptable to introduce a file such as:

`crypto.js`

or another clearly named persistence/security module.

The rest of Gathered should continue to interact with decrypted in-memory `state` through clean abstractions.

Ensure all asynchronous save operations are properly awaited.

Prevent overlapping saves from causing an older ciphertext snapshot to overwrite a newer one.

This is especially important now that Session Auto-Save may trigger frequent persistence requests.

Implement a serialized save queue, revision check, or equivalent mechanism so stale asynchronous writes cannot overwrite newer state.

Draft auto-save and ordinary application saves must share the same safe persistence mechanism.

---

# 11. Offline PWA and Service Worker

Gathered must remain:

- Installable
- Offline capable
- Static-host compatible
- GitHub Pages compatible

If new JS/CSS/assets are added:

- Include them in the app shell as necessary.
- Update service-worker caching.
- Update the application's Update App asset list.
- Bump cache versions where appropriate.

Do not cache decrypted user data through the service worker.

Do not put encrypted user state into Cache Storage as an alternative persistence mechanism.

Do not put plaintext Draft Session data in the service worker or cache.

---

# 12. Search and Derived Views

Regression-test features that traverse the full state:

- Global search
- Member detail/timeline
- Prayer history
- Session details
- Completed session lists
- Draft Sessions
- Active/answered prayer lists
- Follow-ups
- Home/recent activity

They must work normally after decryption.

Search must only operate on decrypted in-memory state while Gathered is unlocked.

No searchable plaintext index of user content may be persisted separately.

Drafts must never be mislabeled as completed sessions.

---

# 13. UI and Design

Preserve the current Gathered aesthetic.

Do not redesign the entire app.

New session, draft, and security UX should feel native to the existing application.

Required UI includes:

- Small Group / Sunday Worship selection
- Draft Sessions section
- Draft / Saving... / Saved state indicator
- Resume Draft
- Delete Draft
- Explicit Edit Request
- Delete Prayer Request
- Passphrase setup
- Passphrase strength meter
- Passphrase confirmation
- Unlock screen
- Incorrect-passphrase state
- Lock Gathered
- Change Passphrase
- Enable Device Unlock when securely supported
- Disable Device Unlock when configured
- Encrypted-backup messaging
- Forgotten-passphrase warning

Ensure usable mobile layouts, particularly on Android/Pixel-size screens.

Maintain accessible labels and keyboard behavior.

---

# 14. Security Requirements

Do not:

- invent custom cryptographic primitives
- use XOR encryption
- use Base64 as "encryption"
- use unauthenticated AES modes
- reuse AES-GCM IVs
- persist the passphrase
- persist the raw DEK
- log secrets
- send user data or password-strength information over the network
- silently fall back to plaintext
- weaken encryption when WebAuthn/device unlock is unsupported
- add a hidden master password
- add a password-recovery backdoor
- create an unencrypted persistence path specifically for Draft Sessions

Use `crypto.getRandomValues()` or appropriate Web Crypto key generation for all cryptographic randomness.

Use constant, explicit encryption format versions so future migrations are possible.

Treat AES-GCM authentication failures as unlock/decryption failures and do not attempt to use partially decrypted data.

---

# 15. Documentation

Update README.md to accurately describe:

- Small Group and Sunday Worship sessions
- Session Auto-Save
- Draft Sessions
- Prayer request editing/deletion
- App-wide encrypted local storage
- Passphrase behavior
- Device unlock when supported
- Encrypted backups
- Forgotten-passphrase consequences
- Local-first architecture
- No server-side recovery
- Migration from previous Gathered versions

Do not claim that Gathered is "zero knowledge" unless the implementation technically justifies that term.

Do not make absolute security claims.

---

# 16. Testing and Verification

Before considering the work complete, test the following scenarios.

## Existing user migration

- Existing plaintext state loads.
- Passphrase setup is offered.
- Encryption completes.
- Data survives reload.
- Plaintext state is removed only after verification.
- Sessions, prayers, updates, members, and follow-ups remain intact.
- Existing sessions migrate to `small-group`.
- Existing sessions migrate to `completed`.

## New user

- Initial setup works.
- Passphrase setup works.
- User can create both session types.
- Reload requires unlock.
- Correct passphrase unlocks.
- Incorrect passphrase does not.

## Session auto-save and drafts

- Start a Small Group session.
- Enter journal text.
- Navigate away without pressing Save Session.
- Draft appears in Draft Sessions with the entered content.
- Resume draft and verify content is intact.
- Repeat with Sunday Worship.
- Enter Scripture and immediately navigate away.
- Content survives.
- Add incomplete/new prayer-request rows and navigate away.
- Draft restores those rows.
- Add prayer-update rows and navigate away.
- Draft restores those rows.
- Add follow-up rows and navigate away.
- Draft restores those rows.
- Reload the PWA while editing a draft.
- Draft survives.
- Close/reopen the PWA.
- Draft survives.
- Auto-save does not create duplicate sessions.
- Auto-save does not create duplicate prayers, updates, or follow-ups.
- Finalize the draft.
- Draft becomes one completed session.
- Finalization converts valid draft prayer/update/follow-up data exactly once.
- Draft no longer appears in Draft Sessions.
- Delete a draft.
- Draft is removed without damaging unrelated durable prayer history.
- Simulate a persistence failure if practical and confirm in-memory data remains visible with an error indication.
- Confirm draft data is encrypted at rest after encryption is enabled.

## Sessions

- Create Small Group session.
- Create Sunday Worship session.
- Edit both.
- Change session type.
- Existing sessions migrate to Small Group.
- Delete session behavior remains correct.
- Completed history excludes drafts.

## Prayer requests

- Create prayer request from a session.
- Create standalone prayer request.
- Edit underlying prayer request.
- Add prayer update.
- Edit prayer update.
- Delete prayer update.
- Delete entire prayer request.
- Verify all completed-session and draft-session prayer-ID references are cleaned up.

## Encryption

- No user-content plaintext remains in IndexedDB after encryption.
- No user-content plaintext appears in localStorage.
- No Draft Session content appears in plaintext persistence.
- Reload cannot display user content before successful unlock.
- Every save produces valid decryptable ciphertext.
- AES-GCM uses a fresh IV for each state encryption.
- Change Passphrase works without data loss.
- Frequent draft auto-saves cannot cause an older state snapshot to overwrite newer changes.

## Backup/restore

- Encrypted backup exports.
- Backup file does not expose prayer/journal/member/draft content as readable plaintext.
- Backup restores on a clean installation with the correct passphrase.
- Wrong backup passphrase fails safely.
- Draft Sessions survive backup and restore.
- Legacy backup import works if supported.

## Device unlock

Where the environment supports secure WebAuthn platform authentication plus the necessary secret-derivation capability:

- Enable Device Unlock.
- Reload.
- Unlock using platform user verification.
- Passphrase unlock still works.
- Disable Device Unlock.
- Device unlock no longer works.
- Passphrase unlock remains unaffected.

Where the capability is unsupported:

- The application does not error.
- Device Unlock is not misleadingly presented as available.
- Passphrase unlock remains fully functional.

## PWA

- App shell loads.
- Service worker registers.
- Offline use still works after initial load.
- Update App still works.
- New assets are correctly refreshed.
- Draft auto-save works during ordinary installed-PWA use.

Run syntax/lint/tests available in the repository.

At minimum, syntax-check every JavaScript file you modify.

Add lightweight automated tests for pure crypto, migration, passphrase-strength, session-draft reconciliation, reference cleanup, and save-ordering helpers where practical without introducing an unnecessary build framework.

---

# 17. Implementation Constraints

This is an incremental evolution of the current Gathered codebase, not a rewrite.

Preserve:

- Current routes where practical
- Existing data
- Existing visual design
- YouVersion integration
- Standalone prayers
- Prayer-update timestamps/edit/delete
- IndexedDB local-first storage
- JSON backup/restore concept
- Update App
- PWA installation
- Offline capability

Avoid large third-party dependencies.

Do not add runtime network dependencies.

If a small library is absolutely necessary, vendor it locally and justify the choice, but prefer native Web APIs.

---

# 18. Completion Standard

Do not stop after scaffolding.

Do not leave TODOs for any required feature.

Do not implement mock biometric support.

Do not merely describe the encryption design.

Do not implement Session Auto-Save as an in-memory-only feature.

Implement the functionality end-to-end.

Before finishing:

1. Review the complete diff.
2. Look specifically for accidental plaintext persistence.
3. Look specifically for plaintext Draft Session persistence.
4. Look for broken legacy migration paths.
5. Look for dangling prayer references.
6. Look for duplicate draft reconciliation into durable prayers/updates/follow-ups.
7. Look for service-worker/cache omissions.
8. Look for async persistence race conditions, especially during rapid auto-save.
9. Verify navigating away from an unfinished session does not lose work.
10. Verify existing functionality was not unnecessarily removed.

Then provide a concise completion report containing:

- Files changed
- Data-model/schema changes
- Session Auto-Save implementation
- Draft Sessions behavior
- Draft reconciliation/finalization behavior
- Encryption architecture used
- Migration behavior
- Backup/restore behavior
- Device-unlock implementation and exact feature-detection requirements
- Save serialization/race-prevention approach
- Tests/checks performed
- Any genuine browser/platform limitation that remains

The implementation is complete only when Gathered can safely upgrade an existing user from the current version through the encrypted v1.4 architecture without losing their existing sessions, prayer histories, members, or follow-ups, and when a user can begin a new session, navigate away without saving, and reliably resume that work later from Draft Sessions.
