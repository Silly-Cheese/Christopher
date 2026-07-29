# Phase 3 Final Launch Guide

Phase 3 completes the GitHub Pages ministry platform with a public Resource Library and a protected Resource Studio.

## GitHub Pages URLs

```text
Public sermon site:
https://silly-cheese.github.io/Christopher/

Main sermon CMS:
https://silly-cheese.github.io/Christopher/#/admin

Public Resource Library:
https://silly-cheese.github.io/Christopher/resources.html

Protected Resource Studio:
https://silly-cheese.github.io/Christopher/admin-resources.html
```

## What the red 30-day warning means

Firestore was created in Test Mode. The red banner showing **30 days remaining** is a countdown until the temporary Test Mode rules expire. It is not an error count.

Test Mode must be replaced with the repository's secure rules before launch.

## No index management

The final application does not use composite Firestore queries. Sorting and additional filtering happen inside the browser after small Firestore reads.

- No `firestore.indexes.json`
- No composite index creation
- No Indexes-tab work
- No index deployment command

Firestore's automatic single-field indexes continue working without setup.

## Deploy only the security rules

```bash
firebase use christopher-5fbc6
firebase deploy --only firestore:rules
```

After deployment, refresh the Firestore console. The Test Mode warning should be replaced by the secure repository rules.

## White-screen protection

Every GitHub Pages entry point includes visible HTML before React starts:

- Main sermon website
- Resource Library
- Resource Studio

The main application also includes:

- A React error boundary
- A global startup-error handler
- A visible reload screen
- Demonstration sermon content when public Firestore reads fail
- Demonstration resource and reading-plan content when Phase 3 reads fail

A JavaScript or Firebase error will therefore produce a visible loading or recovery screen instead of a blank white page.

## Firebase owner profile

The Firebase Authentication user must have a matching Firestore document:

```text
Collection: users
Document ID: FIREBASE_AUTH_UID
```

Fields:

```text
displayName: Christopher Shelley
role: owner
active: true
```

`active` must be a Boolean.

## Authorized domain

Under **Authentication → Settings → Authorized domains**, include:

```text
silly-cheese.github.io
```

Do not include `https://` or `/Christopher`.

## GitHub Pages publication

1. Open the GitHub repository.
2. Go to **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Merge pull request #1 into `main`.
5. Confirm the **Build and Deploy GitHub Pages** workflow succeeds.
6. Hard-refresh the deployed site once to replace any cached old assets.

## Final Firestore collections

```text
sermons
series
resources
readingPlans
contentViews
siteSettings
users
```

The site creates resource and reading-plan documents through the protected dashboards. It does not require you to pre-create empty collections.

## Hosting boundaries

- GitHub Pages hosts all HTML, CSS, JavaScript, images, and optional downloads.
- GitHub Actions builds and publishes Vite.
- Firebase Authentication handles approved staff sessions.
- Cloud Firestore stores content and settings.
- YouTube hosts sermon videos.
- No Firebase Hosting.
- No Firebase Functions.
- No Firebase Storage.
- No composite Firestore indexes.
- No Cloudflare.
- No paid backend.
