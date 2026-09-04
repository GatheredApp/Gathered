# Gathered

Gathered is a local-first Progressive Web App for church small groups. It tracks sessions, Scripture references, journal notes, members, durable prayer histories, and follow-up/action items.

## Features

- First-run small group setup
- Member create / view / edit / delete flows
- Member contact info, birthday, role, notes, and longitudinal timeline
- New session flow with date, Scripture, journal, prayer requests, prayer updates, and follow-ups
- Persistent prayer lifecycle from initial request through updates and answered prayer
- Follow-up/action items with owner, due date, and completion status
- Global search across members, Scripture, journal notes, prayers, prayer updates, and follow-ups
- YouVersion passage links for NIV, ESV, NKJV, NLT, and KJV
- IndexedDB persistence with automatic migration from the original `localStorage` schema
- Validated JSON backup/restore with safety export before import or reset
- Backup-age reminder and last-backup status
- Offline-capable service worker with network-first same-origin refresh behavior
- Settings **Update App** action that clears cached application files and re-downloads the latest deployed repository files while preserving IndexedDB data
- Installable PWA manifest

## Data model and privacy

Gathered remains local-first. Primary data is stored in IndexedDB on the current browser/device. There is no server database or authentication in this version. Prayer requests and member notes may contain sensitive information, so backups should be stored somewhere trusted.

Existing users are migrated automatically from the legacy `smallGroupJournal.v1` localStorage record into IndexedDB the first time the updated app loads successfully.

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
