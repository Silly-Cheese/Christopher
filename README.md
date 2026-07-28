# Christopher Shelley — Sermons & Biblical Teaching

A premium sermon library built with React, Vite, GitHub Pages, Firebase Authentication, and Cloud Firestore.

## Phase 1 of 3 — Public Experience

Phase 1 establishes the complete public foundation:

- Cinematic, mobile-responsive homepage
- Searchable sermon library
- Topic and Bible-book filters
- Individual sermon pages with YouTube embeds
- Structured sermon outlines and notes
- Sermon-series index and detail pages
- About page
- Firestore-powered public data layer
- Firebase Authentication initialized for Phase 2
- Firestore rules and indexes
- Automatic GitHub Pages deployment
- Demonstration content when Firebase is not configured

## Planned phases

### Phase 2 — Private Content Management

- Owner/admin sign-in
- Protected dashboard
- Create, edit, preview, publish, archive, and delete sermons
- Series and topic management
- Site settings and featured-message controls
- Role-aware staff access

### Phase 3 — Ministry Resource Platform

- Bible classes and devotionals
- Downloadable resources
- Scripture index
- Reading plans and discussion questions
- Improved discovery and content analytics

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Until Firebase values are added, the site uses polished demonstration content from `src/content.js`.

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

Firebase web configuration values identify the project; access control is enforced by `firestore.rules`.

### Firestore collections

```text
sermons/{sermonId}
series/{seriesId}
topics/{topicId}
siteSettings/{documentId}
users/{uid}
```

A public sermon should include fields such as:

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

## Firestore deployment

This repository does not use Firebase Hosting, Firebase Functions, or Firebase Storage.

After installing the Firebase CLI and selecting the project:

```bash
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules,firestore:indexes
```

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds and deploys the site whenever `main` changes.

Repository setup:

1. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Add the Firebase values under **Settings → Secrets and variables → Actions**.
3. Add the GitHub Pages domain to Firebase Authentication authorized domains before Phase 2.

## Technology boundaries

- Hosting: GitHub Pages
- Source and deployment: GitHub and GitHub Actions
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- Video: YouTube embeds
- No Firebase Hosting
- No Firebase Functions
- No Firebase Storage
- No paid backend
