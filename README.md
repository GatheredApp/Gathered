# Small Group Journal PWA

A local-first Progressive Web App for church small groups. It tracks sessions, Scripture references, journal notes, members, and prayer requests.

## Features

- First-run small group setup
- Member create / view / edit / delete flows
- Member contact info, birthday, role, and notes
- New Small Group Entry flow with date, Scripture, journal, and prayer requests
- YouVersion passage links generated from common references such as `John 3:16-18`, `Romans 8:28`, and `Psalm 23`
- NIV, ESV, NKJV, NLT, and KJV link support
- Active and answered prayer-request tracking
- Session history and member-specific prayer history
- Offline-capable service worker
- Installable PWA manifest
- Local-only browser storage
- JSON export/import backup

## Run locally

PWAs require an HTTP(S) origin for service workers. From this folder, run any static web server, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy

The app is static and can be deployed to GitHub Pages, Netlify, Cloudflare Pages, Vercel, or any HTTPS static host. No build step is required.

## YouVersion links

The app uses standard `bible.com/bible/{versionId}/{passage}` URLs. Mobile operating systems may hand these URLs to the installed YouVersion Bible app through their universal/app-link association; otherwise the passage opens on bible.com.

## Privacy

All data is stored in `localStorage` on the current browser/device. There is no server database or authentication in this version. Export backups before changing devices or clearing browser storage, and handle backup files carefully because prayer requests may contain sensitive information.
