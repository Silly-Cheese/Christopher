# Phase 2 Firebase Setup

Phase 2 adds the private content-management system at:

```text
https://silly-cheese.github.io/Christopher/#/admin
```

The application uses only Firebase Authentication and Cloud Firestore. It does not use Firebase Hosting, Firebase Functions, Firebase Storage, or a paid backend.

## 1. Firebase web app connection

The Firebase web-app configuration for project `christopher-5fbc6` is already connected in `.env.production`.

Firebase web configuration identifies the client project and is included in the browser bundle by design. Access is protected by Firebase Authentication and `firestore.rules`. Never commit a service-account JSON file, Admin SDK private key, or other server credential.

For local development, either use the committed production configuration or create a local `.env` file with alternate values.

## 2. Create the Firestore database

In the Firebase console:

1. Open **Firestore Database**.
2. Select **Create database**.
3. Choose **Production mode**.
4. Select the preferred region.

The repository rules will replace the initial production-mode rules during deployment.

## 3. Enable email/password authentication

In Firebase:

1. Open **Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. Do not add public registration to this website.

The admin portal contains only sign-in and password-reset flows. New administrator accounts must be created deliberately in the Firebase console.

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

The first owner profile must be created manually because the Firestore rules correctly prevent an unapproved account from granting itself a role.

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

Supported roles are:

- `owner` — complete access, including staff administration
- `admin` — content and settings administration
- `editor` — sermon and series editing without owner-level user management

## 7. Deploy Firestore rules and indexes

Install the Firebase CLI and authenticate locally, then run:

```bash
firebase use christopher-5fbc6
firebase deploy --only firestore:rules,firestore:indexes
```

The included rules provide:

- Public read access only to published sermons and series
- Private access to drafts and archived content
- Staff role verification through `users/{uid}`
- Owner-controlled staff records
- Administrator-only destructive actions and site settings

## 8. Enable GitHub Pages deployment

In the GitHub repository:

1. Open **Settings → Pages**.
2. Set the source to **GitHub Actions**.
3. Merge the implementation pull request into `main`.
4. Confirm the **Build and Deploy GitHub Pages** workflow succeeds.

## 9. Sign in

Open:

```text
https://silly-cheese.github.io/Christopher/#/admin
```

After signing in, the dashboard verifies both:

1. A valid Firebase Authentication session
2. An active Firestore staff profile with an approved role

## Phase 2 dashboard capabilities

- Dashboard counts for all, published, draft, and archived sermons
- Create and edit sermons
- Draft, publish, and archive workflow
- YouTube URL and video-ID detection
- Sermon outlines and long-form notes
- Topic and series assignment
- Featured-sermon control
- Public preview links
- Search and status filters
- Series creation, ordering, publishing, editing, and deletion
- Site-settings document editing
- Password reset and secure sign-out
- Responsive desktop and mobile administration

## Troubleshooting

### Firebase is not connected yet

Confirm `.env.production` exists on the deployed branch and rerun the GitHub Pages workflow.

### The account is not approved

Confirm that the `users` document ID exactly matches the Authentication UID and contains:

```text
active: true
role: owner
```

### Permission denied

Deploy `firestore.rules`, verify the user's role, and make sure the role value is lowercase.

### Login redirects or fails on GitHub Pages

Add `silly-cheese.github.io` to Firebase Authentication authorized domains.

### Published sermon does not appear

Confirm:

- `status` is exactly `published`
- `datePreached` has a value
- the required Firestore indexes are deployed
- the public site is connected to project `christopher-5fbc6`
