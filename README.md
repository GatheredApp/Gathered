# Gathered

Gathered is a local-first Progressive Web App for small groups, Sunday worship, and individual devotion. It tracks sessions, Scripture references, journal notes, members, durable prayer histories, and follow-up/action items.

## Features

- First-run small group setup
- Member create / view / edit / delete flows
- Member contact info, birthday, role, notes, and longitudinal timeline
- Small Group, Sunday Worship, and Individual Devotion sessions with date, Scripture, journal, prayer requests, prayer updates, and follow-ups
- Automatic NIV text through the built-in public YouVersion application key, with an optional user-key override and an explicit opt-in public-domain KJV fallback
- Durable, debounced session auto-save with resumable **Draft Sessions** and explicit finalization
- Persistent prayer lifecycle from initial request through updates and answered prayer
- Follow-up/action items with owner, due date, and completion status
- Global search across members, Scripture, journal notes, prayers, prayer updates, and follow-ups
- YouVersion passage links for NIV, ESV, NKJV, NLT, and KJV
- App-wide AES-256-GCM encryption, a random data-encryption key, and PBKDF2/AES-KW passphrase protection
- IndexedDB persistence with crash-safe migration from earlier plaintext IndexedDB and `localStorage` schemas
- Encrypted JSON backup/restore with legacy backup import and safety export before destructive actions
- Full prayer-request editing and permanent deletion, including reference cleanup, alongside individual update editing/deletion
- Backup-age reminder and last-backup status
- Offline-capable service worker with network-first same-origin refresh behavior
- Automatic service-worker version detection with an in-app update prompt
- Settings **Update App** action that clears cached application files and re-downloads the latest deployed repository files while preserving IndexedDB data
- Installable PWA manifest

## Data model and privacy

Gathered remains local-first. Encrypted application state and non-sensitive cryptographic metadata are stored in IndexedDB on the current browser/device. There is no server database, account, analytics, telemetry, or server-side recovery. Decrypted data exists only in memory while the app is unlocked. Backups are encrypted, but should still be stored somewhere trusted.

On first use of this version, new and existing users create an app-wide passphrase. After authentication, Gathered creates an **absolute two-hour trusted session**; activity does not extend it. The DEK is stored only in AES-KW-wrapped form, protected by a non-extractable Web Crypto wrapping key persisted by IndexedDB. This browser mechanism prevents raw-key export, but it is not a second user-verification boundary: anyone with access to the same unlocked browser profile can reopen Gathered until the window expires. Manual lock and security-sensitive changes revoke the session across open tabs. Existing sessions are classified as **Small Group** and **Completed**, and plaintext data is removed only after the encrypted state is written, read back, decrypted, and validated. After the trusted window expires, a reload requires the passphrase again. Changing the passphrase re-wraps the existing data key rather than replacing user data.

**Gathered cannot recover a forgotten passphrase.** Without the passphrase or a separately supported unlock method, encrypted data cannot be recovered. Device unlock is deliberately unavailable unless the browser and platform can provide a user-verifying WebAuthn authenticator with secure PRF-derived key material; Gathered never simulates biometrics or stores a passphrase/raw key as a fallback.

Existing users are prompted to encrypt data from the legacy `smallGroupJournal.v1` localStorage record or plaintext IndexedDB state. The old copy remains intact if setup or round-trip verification fails.

## Run locally

PWAs require an HTTP(S) origin for service workers. From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy

`public-config.js` defines `PUBLIC_YOUVERSION_APP_KEY` and is loaded before `app.js`. This is an **intentionally public browser configuration value**, not a secret: it is downloaded to every browser, cached for installed PWAs, and can be inspected by users. A project owner should place only the approved public application key there. Never place a confidential server credential in that file.

Users may enter their own YouVersion key in Settings as an optional override. Only that override is part of encrypted user state and backup exports; the built-in public key remains application configuration and is never serialized into either. NIV is requested from YouVersion Bible ID `111`. On an authorization or translation-access failure, Gathered asks before using the public-domain KJV supplied by [bible-api.com](https://bible-api.com/). The provider documents its default KJV text as public domain. Because this fallback is independent of YouVersion, it also avoids relying on a YouVersion Bible identifier that may not exist for the application key. The inserted block is labeled “KJV” and includes a public-domain attribution.

For browser-hosted deployments, the YouVersion application must permit the deployed web origin as well as Bible ID `111`. A `403` can therefore occur even when the application has NIV access if its allowed-origin configuration does not exactly match the PWA origin (scheme, host, and port). Gathered displays YouVersion's response detail when available and otherwise distinguishes a rejected key (`401`) from denied application/origin access (`403`) without displaying the credential.

The optional `api/scripture.js` server endpoint remains available for deployments that need it outside the browser flow. Configure its confidential credential with `YOUVERSION_API_KEY`, plus optional `SCRIPTURE_ALLOWED_TRANSLATIONS`, `SCRIPTURE_RATE_LIMIT`, and `SCRIPTURE_COPYRIGHT_NOTICE`; do not copy that server credential into `public-config.js`.

The **Update App** button refreshes files from the app's deployed origin. When deployed from this repository (for example with GitHub Pages), that effectively discards the current cached app shell and downloads the latest deployed repository version.

## YouVersion links

Gathered uses standard `bible.com/bible/{versionId}/{passage}` URLs. Mobile operating systems may hand these URLs to the installed YouVersion Bible app through universal/app-link association; otherwise the passage opens on bible.com.

Gathered never scrapes bible.com. If licensed retrieval is unavailable, the editor retains the link and supports manual NIV paste. Only an NIV authorization or translation-access response offers the user the independent public-domain KJV fallback described above; the inserted text and saved translation are labeled KJV.
