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

Below the queue the page also lists everything already reviewed, so a mis-scored PR is easy
to spot.

### `POST /admin/logout`

Clears the session.

## Not building

No `/api/*`, no JSON endpoints, no GitHub API calls, no webhook receiver, no OAuth
callback, no user profiles, no teams. Server-rendered pages and form posts are enough.
The badge is the one piece of client-side JavaScript, and it talks to nothing but the
public avatar CDN.

## Security notes

- The app should refuse to start if `ADMIN_PASSWORD` is unset — no insecure default.
- Compare the password in constant time.
- Every state-changing route is a `POST`, with CSRF protection on admin forms.
- Rate-limit `POST /submit` (10/min per IP) and `POST /admin/login` (10 per 15 min per IP).
- Escape `pr_url` and `github_username` on output — they're user-supplied strings rendered
  on a public page.
- Serve over HTTPS; the admin password crosses the wire.
