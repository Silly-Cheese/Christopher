# Phase 2 Firebase Setup

Phase 2 adds the private content-management system at:

```text
https://silly-cheese.github.io/Christopher/#/admin
```

The application uses only Firebase Authentication and Cloud Firestore. It does not use Firebase Hosting, Firebase Functions, Firebase Storage, manually managed Firestore indexes, or a paid backend.

## 1. Firebase web app connection

The Firebase web-app configuration for project `christopher-5fbc6` is already connected in `.env.production`.

Firebase web configuration identifies the client project and is included in the browser bundle by design. Access is protected by Firebase Authentication and `firestore.rules`. Never commit a service-account JSON file, Admin SDK private key, or other server credential.

## 2. Firestore Test Mode warning

The red Firebase banner that says **30 days remaining** is the Test Mode countdown. It is not an error count and it does not mean 30 records were created.

Test Mode temporarily allows broad public access. Replace it with the repository's secure rules before the countdown reaches zero.

Only security rules must be deployed. No composite indexes are used.

## 3. Enable email/password authentication

In Firebase:

1. Open **Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. Do not add public registration to this website.

New administrator accounts must be created deliberately in the Firebase console.

## 4. Add the GitHub Pages authorized domain

In **Authentication → Settings → Authorized domains**, add:

```text
silly-cheese.github.io
```

Do not include `https://`, `/Christopher`, or `#/admin`.

## 5. Create the first Authentication user

In **Authentication → Users**:

1. Select **Add user**.
2. Enter the owner's email address.
3. Choose a strong temporary password.
4. Copy the user's Firebase UID after creation.

## 6. Bootstrap the owner profile

In **Firestore Database**, create:

```text
Collection: users
Document ID: THE_FIREBASE_AUTH_UID
```

Fields:

```js
{
  displayName: "Christopher Shelley",
  role: "owner",
  active: true
}
```

Use a Boolean value for `active`, not the text `"true"`.

Supported roles:

- `owner` — complete access
- `admin` — content and settings administration
- `editor` — content editing without destructive owner controls

## 7. Deploy Firestore security rules

Install the Firebase CLI and authenticate locally, then run:

```bash
firebase use christopher-5fbc6
firebase deploy --only firestore:rules
```

There is no `firestore.indexes.json` file and no manual index deployment step.

The final rules provide:

- Public read access only to published sermons, series, resources, and reading plans
- Private access to drafts and archived content
- Staff role verification through `users/{uid}`
- Owner-controlled staff records
- Administrator-only destructive actions
- Restricted, privacy-friendly content-view counters

## 8. Enable GitHub Pages deployment

In the GitHub repository:

1. Open **Settings → Pages**.
2. Set the source to **GitHub Actions**.
3. Merge the implementation pull request into `main`.
4. Confirm the **Build and Deploy GitHub Pages** workflow succeeds.

## 9. Sign in

```text
https://silly-cheese.github.io/Christopher/#/admin
```

The dashboard verifies both a valid Firebase Authentication session and an active Firestore staff profile.

## Troubleshooting

### Red Test Mode warning

Deploy `firestore.rules`. The warning disappears after the secure rules replace the temporary Test Mode rules.

### White or blank page

The final build includes visible HTML loading screens, a React error boundary, and a global startup-error screen. Refresh once after deployment so the browser loads the new GitHub Pages assets.

### Account not approved

Confirm the `users` document ID exactly matches the Authentication UID and contains:

```text
active: true
role: owner
```

### Permission denied

Deploy `firestore.rules`, verify the staff role, and make sure the role value is lowercase.

### Login redirects or fails

Add `silly-cheese.github.io` to Firebase Authentication authorized domains.

### Published content does not appear

Confirm the document status is exactly `published` and the public site is connected to project `christopher-5fbc6`.
