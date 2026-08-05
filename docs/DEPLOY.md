# Deploy

The recommended host is **Vercel + Turso**, which is free and needs no card. Vercel runs
the app; Turso holds the database, because Vercel's own filesystem is wiped between
requests.

The same code also runs as a normal long-lived process — see [Railway](#railway),
[Fly.io](#flyio) or [a plain VPS](#a-plain-vps) further down, and the [Dockerfile](../Dockerfile).

## Vercel + Turso (free)

### 1. Create the database

1. Sign up at [turso.tech](https://turso.tech) with GitHub — the free plan is plenty for an
   event and asks for no card.
2. Create a database (any name, pick the region closest to you).
3. From its dashboard copy two things:
   - the **database URL**, which looks like `libsql://commit-ed-you.turso.io`
   - a **token**, from *Create Token* (read & write)

### 2. Import the repo to Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import `COMMIT-ed`.
2. Framework preset: **Other**. Leave the build and output settings empty — there is no
   build step.
3. Before clicking Deploy, open **Environment Variables** and add five:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | the `libsql://…` URL from step 1 |
| `TURSO_AUTH_TOKEN` | the token from step 1 |
| `ADMIN_PASSWORD` | your admin password |
| `SESSION_SECRET` | output of the command below |
| `GITHUB_TOKEN` | your GitHub token, for reading PR labels |

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

`SESSION_SECRET` is not optional here. Vercel runs many instances of the function, and
without a shared secret each one signs cookies differently — admins would be logged out at
random. The app refuses to start in production without it, on purpose.

4. **Deploy.**

### 3. Check it

- `https://your-app.vercel.app/healthz` → `ok 0`
- Submit a PR link, log into `/admin`, approve it, watch `/leaderboard`
- Redeploy, then reload the leaderboard — the entry must still be there. That proves the
  database is Turso and not something ephemeral.

### How the pieces fit

- `public/` is served by Vercel's CDN as static files, so CSS and JS never wake the function
- everything else is rewritten to [`api/index.js`](../api/index.js), which calls the same
  router the local server uses — one code path, not two
- the tables are created on first connection, so there is no migration step

### Two things to know about serverless

- **Rate limiting is weaker.** The submit and login limits are in-process, and Vercel may
  run several processes, so the effective limit is higher than the configured one. Fine for
  an event; it is not a defence against a determined attacker.
- **Cold starts.** The first request after a quiet spell takes an extra moment while the
  function boots and connects to Turso. Subsequent requests are fast.

## Railway

Paid (about $5/month for an always-on service with a volume), but zero code changes and no
external database — the app writes to a disk you mount.

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
cd /srv/commit-ed && npm install && node -v   # must be 20+
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
Environment=TURSO_DATABASE_URL=file:/srv/commit-ed/data.db
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
      that proves your database really persists
- [ ] `GITHUB_TOKEN` set, or every PR scores 0 once the hourly limit runs out

## Backups

The volume is the whole event record. Copy it out daily while the event runs.

```bash
fly ssh console -C "sqlite3 /data/data.db .dump" > backup-$(date +%F).sql
```

On Railway, use the volume's backup feature or `railway run sqlite3 /data/data.db .dump`.
On a VPS, `sqlite3 /srv/commit-ed/data.db ".backup 'backup-$(date +%F).db'"`.
