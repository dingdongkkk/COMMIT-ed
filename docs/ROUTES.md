# Routes

Everything the app needs. Nothing more.

## Public

### `GET /`

Landing page: what the event is, the four steps, and live counts (contributors, approved
PRs, points awarded).

### `GET /badge`

The badge generator. Entirely client-side: the visitor types a name and GitHub handle, the
card is drawn on a `<canvas>`, and "Download PNG" saves it. Nothing is stored, and no
GitHub API call is made — the avatar is loaded straight from
`https://avatars.githubusercontent.com/<username>` with `crossOrigin="anonymous"` so the
canvas stays exportable.

### `GET /submit`

Renders the form. Three fields: `name` (optional), `github_username`, `pr_url`.

### `POST /submit`

| Step | Behaviour |
|---|---|
| Validate | Rules in [SCHEMA.md](SCHEMA.md#validation). On failure, re-render with the error. |
| Find or create participant | Match on lowercased `github_username` |
| Insert submission | `status = 'pending'`, `points = 0` |
| Store the name | Saved on the participant, used on the leaderboard |
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

### `POST /admin/submissions/:id/review`

One endpoint, two buttons — the `action` field is `approve` or `reject`.

- `approve` — sets `points` to the submitted value (0–1000), `status = 'approved'`,
  `reviewed_at = now()`
- `reject` — sets `status = 'rejected'`, forces `points` to 0 whatever is in the box, and
  stores the note if given

A review only applies to a `pending` row. If another organiser got there first, the second
one gets a 409 saying so and their score is not applied — two people working from stale
queues can never overwrite each other.

### `POST /admin/submissions/:id/adjust`

Correcting a row that has already been reviewed, from the inline controls in the reviewed
table. `action` is `update` (set a new points value, keeping it approved) or `revoke`
(status back to `rejected`, points to 0). Scores can be raised or lowered here at any time,
with an optional note explaining why.

This route never touches a `pending` row, and `review` never touches a reviewed one — so
the correction path can't be used to award a fresh pull request twice.

Below the queue the page lists everything already reviewed, so a mis-scored PR is easy
to spot.

### `POST /admin/logout`

Clears the session.

## Not building

No `/api/*`, no JSON endpoints, no GitHub API calls, no webhook receiver, no OAuth
callback, no user profiles, no teams. Server-rendered pages and form posts are enough.
Client-side JavaScript is limited to two files: the badge generator and the presentation
layer (`fx.js`). Neither talks to anything but the public avatar CDN.

## Security notes

- The app should refuse to start if `ADMIN_PASSWORD` is unset — no insecure default.
- Compare the password in constant time.
- Every state-changing route is a `POST`, with CSRF protection on admin forms.
- Rate-limit `POST /submit` (10/min per IP) and `POST /admin/login` (10 per 15 min per IP).
- Escape `pr_url` and `github_username` on output — they're user-supplied strings rendered
  on a public page.
- Serve over HTTPS; the admin password crosses the wire.
