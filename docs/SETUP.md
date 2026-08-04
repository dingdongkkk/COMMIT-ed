# Setup

## Requirements

`TBD — runtime and version once the stack is picked. e.g. Node 20+, or Python 3.11+`

A database. SQLite is enough — this app handles a few hundred rows.

## Install

```bash
git clone https://github.com/ORG/COMMIT-ed.git
cd COMMIT-ed
cp .env.example .env
```

Open `.env` and set `ADMIN_PASSWORD` to something that isn't `change-me`.

```bash
# install dependencies — TBD
# npm install
# pip install -r requirements.txt
```

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | yes | Guards `/admin`. No default — the app should refuse to start without it. |
| `DATABASE_URL` | yes | Connection string, or a SQLite file path |
| `PORT` | no | Defaults to 3000 |

`.env` is gitignored. Never commit real values.

## Database

Create the tables from [SCHEMA.md](SCHEMA.md).

```bash
# migration / init command — TBD
```

## Run

```bash
# dev server — TBD
```

Then check:

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

`TBD — fill in once you've chosen a host.`

Whatever you pick, before the event starts:

- [ ] `ADMIN_PASSWORD` set in the host's environment config, not in a file
- [ ] Database persists across restarts — check this, free tiers often have ephemeral disks
- [ ] HTTPS on, since the admin password crosses the wire
- [ ] The submit and leaderboard URLs are public and shareable

## Backups

The database is the whole event record. Back it up daily while the event runs.

```bash
# backup command — TBD
# sqlite3 data.db ".backup 'backup-$(date +%F).db'"
```

## Troubleshooting

| Symptom | Check |
|---|---|
| App won't start | Is `ADMIN_PASSWORD` set? Is `DATABASE_URL` reachable? |
| `/admin` rejects the right password | Environment variable loaded? Restart after editing `.env` |
| Leaderboard is empty but submissions exist | They're still `pending` — only `approved` rows count |
| Duplicate submission throws a 500 | The unique constraint on `pr_url` fired; catch it and show a message |
| Data gone after redeploy | Ephemeral disk on the host — move to a persistent volume or hosted database |
