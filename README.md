# Gathered

Gathered is a local-first Progressive Web App for small groups and Sunday worship. It tracks sessions, Scripture references, journal notes, members, durable prayer histories, and follow-up/action items.

## Features

- First-run small group setup
- Member create / view / edit / delete flows
- Member contact info, birthday, role, notes, and longitudinal timeline
- Small Group and Sunday Worship sessions with date, Scripture, journal, prayer requests, prayer updates, and follow-ups
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
- Settings **Update App** action that clears cached application files and re-downloads the latest deployed repository files while preserving IndexedDB data
- Installable PWA manifest

## Data model and privacy

Gathered remains local-first. Encrypted application state and non-sensitive cryptographic metadata are stored in IndexedDB on the current browser/device. There is no server database, account, analytics, telemetry, or server-side recovery. Decrypted data exists only in memory while the app is unlocked. Backups are encrypted, but should still be stored somewhere trusted.

On first use of this version, new and existing users create an app-wide passphrase. Existing sessions are classified as **Small Group** and **Completed**, and plaintext data is removed only after the encrypted state is written, read back, decrypted, and validated. A reload requires the passphrase again. Changing the passphrase re-wraps the existing data key rather than replacing user data.

**Gathered cannot recover a forgotten passphrase.** Without the passphrase or a separately supported unlock method, encrypted data cannot be recovered. Device unlock is deliberately unavailable unless the browser and platform can provide a user-verifying WebAuthn authenticator with secure PRF-derived key material; Gathered never simulates biometrics or stores a passphrase/raw key as a fallback.

Existing users are prompted to encrypt data from the legacy `smallGroupJournal.v1` localStorage record or plaintext IndexedDB state. The old copy remains intact if setup or round-trip verification fails.

## Run locally

PWAs require an HTTP(S) origin for service workers. From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy

The app is static and can be deployed to GitHub Pages, Netlify, Cloudflare Pages, Vercel, or another HTTPS static host. No build step is required.

The **Update App** button refreshes files from the app's deployed origin. When deployed from this repository (for example with GitHub Pages), that effectively discards the current cached app shell and downloads the latest deployed repository version.

## YouVersion links

Gathered uses standard `bible.com/bible/{versionId}/{passage}` URLs. Mobile operating systems may hand these URLs to the installed YouVersion Bible app through universal/app-link association; otherwise the passage opens on bible.com.
