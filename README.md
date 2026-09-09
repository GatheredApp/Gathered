# Gathered

Gathered is a local-first Progressive Web App for small groups, Sunday worship, and individual devotion. It tracks sessions, Scripture references, journal notes, members, durable prayer histories, and follow-up/action items.

## Features

- **Gatherings and journaling:** Small Group, Sunday Worship, and Individual Devotion sessions bring together the date, Scripture, journal notes, prayers, and follow-ups. New sessions become encrypted, auto-saved **Draft Sessions** that can be resumed or deleted before explicit completion.
- **Scripture:** Record a primary passage in NIV, ESV, NKJV, NLT, or KJV and open it in YouVersion. When you are ready, tap **Insert into Session Journal** to retrieve and insert the passage. Gathered can insert licensed text through configured YouVersion access and, after an explicit opt-in when NIV access is denied, public-domain KJV text. Manual text entry remains available.
- **People:** Create, view, edit, and delete member profiles with role, email, phone, birthday, and notes. Member timelines connect their prayer requests, prayer updates, and follow-ups, with call, text, and email shortcuts where details are present.
- **Persistent prayer tracking:** Create requests during a session or independently, add updates over time, edit requests and individual updates, mark prayers answered, and permanently delete requests or updates. Prayer histories retain links to the sessions where activity occurred.
- **Privacy-conscious AI prompt tools:** From a prayer, **Find Scripture with AI** prepares a prompt asking for relevant Bible passages and YouVersion links, while **Listen to a Message with AI** prepares a prompt for a short pastoral message that can be read or played with the chosen assistant's read-aloud features when available. Gathered itself does not send prayer content to an AI provider; the user chooses whether to copy or share a generated prompt and which AI assistant receives it.
- **Follow-through:** Record follow-up/action items with an owner, due date, and open or completed status, connected to their originating session and member.
- **Find and share:** Global search covers completed-session Scripture and journal notes, members, prayer requests and updates, and follow-ups. A native share action (with clipboard fallback) makes it easy to recommend Gathered.
- **Markdown formatting:** Free-text journals, prayer requests and updates, member notes, and follow-ups accept Markdown. Links, emphasis, headings, lists, blockquotes, code, paragraphs, and line breaks render in read-only views, while editors retain the original Markdown source unchanged.
- **Local-first privacy:** Application data is stored in IndexedDB on the current device and encrypted with AES-256-GCM. A random data key is protected by a PBKDF2/AES-KW passphrase envelope; manual lock, passphrase changes, and a two-hour trusted-browser session are supported. Secure device/biometric unlock is shown as unavailable unless a user-verifying WebAuthn PRF implementation can be safely provided; it is not currently enabled.
- **Recovery and maintenance:** Export and restore encrypted JSON backups, import legacy backups, receive backup-age reminders, and create safety exports before destructive operations.
- **Offline, installable PWA:** The cached app shell works offline, the manifest supports installation, and service-worker version detection offers an in-app update flow. Settings also provides an explicit **Update App** action that refreshes cached application files while preserving IndexedDB data.

An interactive, mobile-friendly feature tour can be launched at any time from the Gathered home screen.

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

## Diary

Diary is a private, chronological record alongside Gathered's sessions and prayers. Its **Day**, vertically stacked **7 Days**, and conventional **Month** views derive a calendar from completed sessions, prayer-request creation dates, and diary entries; session drafts and prayer updates are not duplicated into the calendar. Entries support safe rendered Markdown, freeform tags (including calendar filtering and global search), editing, and confirmed deletion.

Photos and videos are stored locally in a dedicated IndexedDB store rather than in application-state JSON. Each attachment is authenticated and encrypted with the same unlocked AES-GCM data key as the diary text, and only encrypted attachment records are included in version 2 encrypted backups. Gathered never uploads diary content. Native browser storage quotas still apply—especially for large videos—and attachment failures leave an existing entry intact.
