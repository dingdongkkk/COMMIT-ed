# Deploy

The app is a single long-running Node process with a SQLite file next to it. It needs a
host that gives you **a process that stays up** and **a disk that survives restarts**.

Serverless platforms — Vercel, Netlify Functions, Cloudflare Workers — provide neither.
Vercel in particular will fail with `FUNCTION_INVOCATION_FAILED`: there is no handler to
invoke, and the filesystem is read-only. Don't spend time on it.

There's a [Dockerfile](../Dockerfile) at the root. Everything below uses it.

## What every host needs

| Setting | Value |
|---|---|
| Port | Read from `PORT`, defaults to 3000 — most hosts inject this |
| Volume mount | `/data` — the image already points `DATABASE_URL` at `/data/data.db` |
| Health check | `GET /healthz` returns `ok <participant count>` |

Environment variables to set in the host's dashboard (never in a file — `.env` is
gitignored and is not deployed):

| Variable | Notes |
|---|---|
| `ADMIN_PASSWORD` | Required. The app refuses to start without it. |
| `SESSION_SECRET` | Any long random string. Without it, every restart signs admins out. |
| `GITHUB_TOKEN` | Lifts PR label lookups from 60/hour to 5000. |

`NODE_ENV=production` is already set in the image, which marks session cookies `Secure`.
Every host below terminates HTTPS for you, so that is what you want.

Generate a session secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Railway

Easiest of the three — all dashboard, no CLI.

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** →
   pick `COMMIT-ed`. It finds the Dockerfile on its own.
2. **Variables** tab → add `ADMIN_PASSWORD`, `SESSION_SECRET`, `GITHUB_TOKEN`.
3. **Settings → Volumes** → add a volume, mount path `/data`. Do this *before* your event
   starts — without it the database is wiped on every redeploy.
4. **Settings → Networking** → **Generate Domain**. HTTPS is automatic.
5. Open `https://your-app.up.railway.app/healthz` — it should print `ok 0`.

## Fly.io

Needs the CLI, but volumes are first-class and it stays up cheaply.

```bash
fly launch --no-deploy          # answer no when it offers a database
fly volumes create data --size 1
fly secrets set ADMIN_PASSWORD=... SESSION_SECRET=... GITHUB_TOKEN=...
fly deploy
```

The included [fly.toml](../fly.toml) already mounts the volume at `/data` and points the
health check at `/healthz`.

## A plain VPS

Most control, and the cheapest if you already have a box.

```bash
git clone https://github.com/ORG/COMMIT-ed.git /srv/commit-ed
cd /srv/commit-ed && node -v      # must be 24+
```

Create `/etc/systemd/system/commit-ed.service`:

```ini
[Unit]
Description=COMMIT-ed leaderboard
After=network.target

[Service]
WorkingDirectory=/srv/commit-ed
ExecStart=/usr/bin/node src/server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_URL=/srv/commit-ed/data.db
Environment=ADMIN_PASSWORD=change-me
Environment=SESSION_SECRET=change-me
Environment=GITHUB_TOKEN=
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now commit-ed
```

Put Caddy or nginx in front for HTTPS — the admin password crosses the wire, and `Secure`
cookies will not be sent over plain HTTP on a real domain.

## Before the event starts

- [ ] `/healthz` responds
- [ ] `/submit` accepts a real PR link and shows its point value
- [ ] `/admin` login works **on the deployed HTTPS URL**, not just locally
- [ ] Approve one submission and confirm it lands on `/leaderboard`
- [ ] Redeploy once, then check the leaderboard still has that entry — this is the test
      that proves your volume is real
- [ ] `GITHUB_TOKEN` set, or every PR scores 0 once the hourly limit runs out

## Backups

The volume is the whole event record. Copy it out daily while the event runs.

```bash
fly ssh console -C "sqlite3 /data/data.db .dump" > backup-$(date +%F).sql
```

On Railway, use the volume's backup feature or `railway run sqlite3 /data/data.db .dump`.
On a VPS, `sqlite3 /srv/commit-ed/data.db ".backup 'backup-$(date +%F).db'"`.
