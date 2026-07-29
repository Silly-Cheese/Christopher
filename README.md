# Christopher Shelley — Sermons & Biblical Teaching

A premium sermon library and private content-management system built with React, Vite, GitHub Pages, Firebase Authentication, and Cloud Firestore.

## Completed phases

### Phase 1 — Public Experience

- Cinematic, mobile-responsive homepage
- Searchable sermon library
- Topic and Bible-book filters
- Individual sermon pages with YouTube embeds
- Structured sermon outlines and notes
- Sermon-series index and detail pages
- About page
- Firestore-powered public data layer
- Demonstration content when Firebase is not configured

### Phase 2 — Private Content Management

The protected dashboard is available at `#/admin` and includes:

- Firebase email/password sign-in
- Password-reset flow
- Firestore staff-profile and role verification
- Responsive administration layout
- Dashboard content totals and recently updated sermons
- Create and edit sermons
- Draft, publish, and archive workflow
- YouTube URL and video-ID detection
- Sermon outlines, notes, topics, series, and featured controls
- Search and status filtering
- Public sermon preview links
- Series creation, editing, ordering, publishing, and deletion
- Site-settings document editing
- Secure sign-out

See [`docs/PHASE_2_SETUP.md`](docs/PHASE_2_SETUP.md) for the exact Firebase console and first-owner setup.

## Planned Phase 3 — Ministry Resource Platform

- Bible classes and devotionals
- Downloadable resources
- Scripture index
- Reading plans and discussion questions
- Public site-settings integration
- Improved discovery and content analytics

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Until Firebase values are added, the public site uses polished demonstration content from `src/content.js`, and the admin route displays a configuration checklist.

## Firebase configuration

Create a Firebase web app, then add these values to `.env` locally and as GitHub Actions repository secrets for deployment:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Firebase web configuration values identify the project; access control is enforced by `firestore.rules`. Do not commit service-account credentials or private keys.

### Firestore collections

```text
sermons/{sermonId}
series/{seriesId}
topics/{topicId}
siteSettings/main
users/{uid}
```

A public sermon includes fields such as:

```js
{
  title: "God's Kingdom Redefines Greatness",
  slug: "gods-kingdom-redefines-greatness",
  scripture: "Philippians 2:1–11",
  scriptureBook: "Philippians",
  seriesId: "...",
  seriesTitle: "The Kingdom Turns Everything Around",
  seriesSlug: "the-kingdom-turns-everything-around",
  datePreached: "2026-07-12",
  duration: "8 min",
  speaker: "Christopher Shelley",
  status: "published",
  featured: true,
  youtubeUrl: "https://youtube.com/watch?v=...",
  youtubeId: "...",
  summary: "...",
  bigIdea: "...",
  topics: ["Humility", "Jesus"],
  outline: ["Point one", "Point two"],
  notes: [{ heading: "Sermon Notes", paragraphs: ["Paragraph one"] }]
}
```

An approved staff profile uses the Firebase Authentication UID as its document ID:

```js
{
  displayName: "Christopher Shelley",
  role: "owner",
  active: true
}
```

Supported roles are `owner`, `admin`, and `editor`.

## Firestore deployment

This repository does not use Firebase Hosting, Firebase Functions, or Firebase Storage.

After installing the Firebase CLI and selecting the project:

```bash
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules,firestore:indexes
```

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` validates pull requests and deploys the site whenever `main` changes.

Repository setup:

1. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Add the Firebase values under **Settings → Secrets and variables → Actions**.
3. Add `silly-cheese.github.io` to Firebase Authentication authorized domains.
4. Merge the implementation pull request into `main`.

The expected public URL is:

```text
https://silly-cheese.github.io/Christopher/
```

The expected administrator URL is:

```text
https://silly-cheese.github.io/Christopher/#/admin
```

## Technology boundaries

- Hosting: GitHub Pages
- Source and deployment: GitHub and GitHub Actions
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- Video: YouTube embeds
- No Firebase Hosting
- No Firebase Functions
- No Firebase Storage
- No Cloudflare
- No paid backend
