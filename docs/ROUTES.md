# Routes

Everything the app needs. Nothing more.

## Public

### `GET /submit`

Renders the form. Two fields: `github_username`, `pr_url`.

### `POST /submit`

| Step | Behaviour |
|---|---|
| Validate | Rules in [SCHEMA.md](SCHEMA.md#validation). On failure, re-render with the error. |
| Find or create participant | Match on lowercased `github_username` |
| Insert submission | `status = 'pending'`, `points = 0` |
| Duplicate `pr_url` | Show "already submitted" — do not 500 |
| Success | Confirmation message: submitted, pending review |

No login. No email. The user is done.

### `GET /leaderboard`

Runs the [leaderboard query](SCHEMA.md#leaderboard-query). Renders rank, username, PR
count, total points.

Empty state when nothing is approved yet — an empty table, not an error.

## Admin

All admin routes sit behind the `ADMIN_PASSWORD` check.

### `GET /admin/login` · `POST /admin/login`

Password form. On success, set a session cookie (`httpOnly`, `secure`, `sameSite=lax`).

### `GET /admin`

Pending submissions, oldest first. Each row shows:

- GitHub username
- PR link — **must open in a new tab** (`target="_blank" rel="noopener"`), since reviewing
  means actually looking at the PR
- Points input
- Approve button, Reject button, optional note field

### `POST /admin/submissions/:id/approve`

Sets `points` to the submitted value, `status = 'approved'`, `reviewed_at = now()`.

### `POST /admin/submissions/:id/reject`

Sets `status = 'rejected'`, leaves `points` at 0, stores the note if given.

### `POST /admin/logout`

Clears the session.

## Not building

No `/api/*`, no JSON endpoints, no GitHub API calls, no webhook receiver, no OAuth
callback, no user profiles, no teams. Server-rendered pages and form posts are enough.

## Security notes

- The app should refuse to start if `ADMIN_PASSWORD` is unset — no insecure default.
- Compare the password in constant time.
- Every state-changing route is a `POST`, with CSRF protection on admin forms.
- Rate-limit `POST /submit` and `POST /admin/login`.
- Escape `pr_url` and `github_username` on output — they're user-supplied strings rendered
  on a public page.
- Serve over HTTPS; the admin password crosses the wire.
