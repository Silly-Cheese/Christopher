# Christopher Shelley — Ministry Platform

A premium sermon, teaching-resource, and biblical-study platform built with React, Vite, GitHub Pages, Firebase Authentication, and Cloud Firestore.

## Completed phases

### Phase 1 — Public Sermon Experience

- Cinematic, mobile-responsive homepage
- Searchable sermon library
- Topic and Bible-book filters
- Individual sermon pages with YouTube embeds
- Structured sermon outlines and notes
- Sermon-series index and detail pages
- About page
- Firestore-powered public data layer
- Demonstration content when Firestore has no published records

### Phase 2 — Private Content Management

- Owner/admin/editor sign-in at `#/admin`
- Protected dashboard
- Create, edit, preview, publish, archive, and delete sermons
- Series management
- Site settings connected to the public homepage, biography, and ministry links
- Role-aware staff access
- Password reset and persistent Authentication sessions

### Phase 3 — Ministry Resource Platform

- Public Resource Library at `resources.html`
- Bible classes, study guides, devotionals, discussion guides, worksheets, teaching outlines, and family resources
- Search and filtering by title, passage, topic, audience, and format
- Scripture index combining sermons, resources, and reading plans
- Multi-day reading plans with reflections and questions
- Reading-plan progress saved privately in each visitor's browser
- Optional public download links for GitHub-hosted PDFs and files
- Privacy-friendly Firestore content-view counters
- Resource Studio at `admin-resources.html`
- Resource and reading-plan draft, publish, archive, preview, and delete workflows
- Resource analytics and topic-coverage insights
- Installable web manifest, crawler rules, sitemap, and GitHub Pages metadata
- Visible startup screens and runtime error recovery instead of blank white pages

## Local setup

```bash
npm install
npm run dev
```

The production Firebase project is connected through `.env.production`. A local `.env` file may override those values during development.

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
resources/{resourceId}
readingPlans/{planId}
contentViews/{contentType_contentId}
topics/{topicId}
siteSettings/main
users/{uid}
```

Published sermons, resources, and reading plans are publicly readable. Draft and archived records require an approved staff account. Content-view documents contain only a content type, content ID, count, and last-view timestamp.

## Firebase console checklist

1. Cloud Firestore exists in the Firebase project.
2. Email/Password Authentication is enabled.
3. `silly-cheese.github.io` is included under Authentication authorized domains.
4. The owner exists in Firebase Authentication.
5. A matching `users/{uid}` document contains `displayName`, `role: "owner"`, and `active: true`.
6. The included Firestore security rules are deployed before the Test Mode countdown expires.

The application uses only Firestore's automatic single-field indexes. There is no composite-index file and no manual index deployment step.

See [`docs/PHASE_2_SETUP.md`](docs/PHASE_2_SETUP.md) for owner setup and [`docs/PHASE_3_SETUP.md`](docs/PHASE_3_SETUP.md) for the final resource-platform launch checklist.

## Firestore deployment

This repository does not use Firebase Hosting, Firebase Functions, Firebase Storage, or manually managed Firestore indexes.

```bash
firebase use christopher-5fbc6
firebase deploy --only firestore:rules
```

## GitHub Pages deployment

The workflow at `.github/workflows/deploy-pages.yml` builds every entry point and deploys the generated `dist` directory whenever `main` changes.

In **Settings → Pages**, set **Source** to **GitHub Actions**, then merge the implementation pull request into `main`.

Expected URLs:

```text
Public sermon site: https://silly-cheese.github.io/Christopher/
Main sermon CMS:    https://silly-cheese.github.io/Christopher/#/admin
Resource library:   https://silly-cheese.github.io/Christopher/resources.html
Resource Studio:    https://silly-cheese.github.io/Christopher/admin-resources.html
```

## File and media strategy

- Sermon videos remain on YouTube.
- Permanent design assets and downloadable PDFs may be committed under `public/` and linked from Firestore.
- External public download URLs may also be stored in resource records.
- Firebase Storage is intentionally not used.

## Technology boundaries

- Hosting: GitHub Pages
- Source and deployment: GitHub and GitHub Actions
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- Video: YouTube embeds
- No Firebase Hosting
- No Firebase Functions
- No Firebase Storage
- No manual Firestore indexes
- No Cloudflare
- No paid backend
