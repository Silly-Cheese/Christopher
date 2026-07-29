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
- Automatic GitHub Pages deployment
- Demonstration content when Firestore has no published records

### Phase 2 — Private Content Management

- Owner/admin/editor sign-in at `#/admin`
- Protected dashboard
- Create, edit, preview, publish, archive, and delete sermons
- Series management
- Site settings
- Role-aware staff access
- Password reset and persistent Authentication sessions

### Phase 3 — Planned Ministry Resource Platform

- Bible classes and devotionals
- Downloadable resources
- Scripture index
- Reading plans and discussion questions
- Improved discovery and content analytics

## Local setup

```bash
npm install
npm run dev
```

The production Firebase project is already connected through `.env.production`. A local `.env` file may be used to override those values during development.

## Firebase project

```text
Project ID: christopher-5fbc6
Authentication domain: christopher-5fbc6.firebaseapp.com
```

Firebase web configuration is included in the browser application by design. Authorization is enforced through Firebase Authentication and `firestore.rules`. Never add a service-account JSON file, Admin SDK private key, or other server credential to this repository.

### Firestore collections

```text
sermons/{sermonId}
series/{seriesId}
topics/{topicId}
siteSettings/{documentId}
users/{uid}
```

A public sermon includes fields such as:

```js
{
  title: "God's Kingdom Redefines Greatness",
  slug: "gods-kingdom-redefines-greatness",
  scripture: "Philippians 2:1–11",
  scriptureBook: "Philippians",
  seriesTitle: "The Kingdom Turns Everything Around",
  seriesSlug: "the-kingdom-turns-everything-around",
  datePreached: "2026-07-12",
  duration: "8 min",
  speaker: "Christopher Shelley",
  status: "published",
  featured: true,
  youtubeId: "",
  summary: "...",
  bigIdea: "...",
  topics: ["Humility", "Jesus"],
  outline: ["Point one", "Point two"],
  notes: [{ heading: "Section title", paragraphs: ["Paragraph one"] }]
}
```

## Firebase setup still required

1. Create the Firestore database in Production mode.
2. Enable Firebase Authentication with Email/Password.
3. Add `silly-cheese.github.io` under Authentication authorized domains.
4. Create the first Authentication user.
5. Create the matching `users/{uid}` Firestore owner document.
6. Deploy the included Firestore rules and indexes.

See [`docs/PHASE_2_SETUP.md`](docs/PHASE_2_SETUP.md) for exact steps.

## Firestore deployment

This repository does not use Firebase Hosting, Firebase Functions, or Firebase Storage.

After installing the Firebase CLI:

```bash
firebase use christopher-5fbc6
firebase deploy --only firestore:rules,firestore:indexes
```

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds and deploys the site whenever `main` changes.

Repository setup:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Merge the implementation pull request into `main`.

The expected URLs are:

```text
Public site: https://silly-cheese.github.io/Christopher/
Admin:      https://silly-cheese.github.io/Christopher/#/admin
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
