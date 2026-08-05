# Setup

## Requirements

Node.js 20 or newer, and one npm dependency (`@libsql/client`). Storage is libSQL: a local
SQLite file while you develop, Turso once deployed.

## Install

```bash
git clone https://github.com/ORG/COMMIT-ed.git
cd COMMIT-ed
cp .env.example .env
```

Open `.env` and set `ADMIN_PASSWORD` to something that isn't `change-me`.

```bash
npm install
node -v    # must be >= 20
```

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | yes | Guards `/admin`. The app refuses to start if it is unset or still `change-me`. |
| `SESSION_SECRET` | recommended | Signs admin session cookies. Unset means a random secret per boot, so every restart logs admins out. |
| `GITHUB_TOKEN` | strongly recommended | Reads PR labels. Unset, the whole server shares 60 lookups/hour; with a token, 5000. A classic token with no scopes works for public repos. |
| `TURSO_DATABASE_URL` | no | `file:data.db` locally, `libsql://…` in production. Defaults to `file:data.db`. |
| `TURSO_AUTH_TOKEN` | production only | Turso token; not needed for a local file. |
| `PORT` | no | Defaults to 3000 |
| `NODE_ENV` | no | Set to `production` to mark session cookies `Secure` |

`.env` is gitignored. Never commit real values.

## Database

Tables are created on first connection, so this is only needed to check your setup:

```bash
npm run init-db
```

## Run

```bash
npm start        # or: npm run dev, which restarts on file changes
```

Then check:

- `http://localhost:3000/` — the landing page renders
- `http://localhost:3000/badge` — type a GitHub handle, the badge preview updates
- `http://localhost:3000/submit` — the form renders
- `http://localhost:3000/leaderboard` — shows an empty state, not an error
- `http://localhost:3000/admin` — asks for the password

## Verify it works end to end

1. Submit a real PR link with your own username.
2. Open `/admin`, log in, see it pending.
3. Type a number, approve.
4. Open `/leaderboard` — you're on it with that score.

If those four steps pass, the app is done. That's the entire product.

## Deploy

See [DEPLOY.md](DEPLOY.md) — Dockerfile, Railway, Fly.io and VPS instructions, plus why
serverless hosts (Vercel, Netlify Functions) cannot run this app.

## Backups

The database is the whole event record. Back it up daily while the event runs.

```bash
sqlite3 data.db ".backup 'backup-$(date +%F).db'"
```

## Troubleshooting

| Symptom | Check |
|---|---|
| App won't start | Is `ADMIN_PASSWORD` set to something other than `change-me`? Is Node >= 22.5? |
| Admins logged out after a restart | `SESSION_SECRET` is unset, so a new one is generated each boot |
| Badge avatar does not appear | The GitHub username has no account, or the network blocks `avatars.githubusercontent.com` |
| Everything shows 0 points | The PRs carry no `easy`/`medium`/`hard` label, or lookups are rate limited — set `GITHUB_TOKEN` and hit "re-check labels" |
| `/admin` rejects the right password | Environment variable loaded? Restart after editing `.env` |
| Leaderboard is empty but submissions exist | They're still `pending` — only `approved` rows count |
| Duplicate submission throws a 500 | The unique constraint on `pr_url` fired; catch it and show a message |
| Data gone after redeploy | Ephemeral disk on the host — move to a persistent volume or hosted database |
