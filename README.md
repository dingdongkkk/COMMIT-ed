# COMMIT-ed

A leaderboard app for an open source event.

Contributors generate a downloadable badge from their GitHub handle, submit their pull
request links, and watch the standings.

**Points come from the pull request's difficulty label**, set by the project admin on the
repository the PR was opened against:

| Label | Points |
|---|---|
| `easy` | 2 |
| `medium` | 5 |
| `hard` | 10 |

Nothing reaches the leaderboard on labels alone. An organiser opens each pull request,
checks the work is real, and approves it — that stamp is what makes the points count. They
can revoke an approved score at any time, and reinstate it later.

## Screens

| Route | Access | Does |
|---|---|---|
| `/` | public | Landing page with live counts |
| `/badge` | public | Name + GitHub handle → contributor card, downloadable as PNG |
| `/submit` | public | Form: GitHub username + PR link → saved as `pending` |
| `/leaderboard` | public | Participants ranked by total approved points |
| `/admin` | password | Pending submissions, a points box, approve/reject |

## Stack

Node.js 24+ and nothing else — **zero dependencies**.

- `node:http` for the server, hand-rolled router, server-rendered HTML
- `node:sqlite` for storage
- `node:crypto` for signed session cookies and CSRF tokens
- One GitHub API call per submission, to read the pull request's labels
- The badge is drawn client-side on a `<canvas>`; the avatar comes from
  `avatars.githubusercontent.com`

## Setup

```bash
git clone https://github.com/ORG/COMMIT-ed.git
cd COMMIT-ed
cp .env.example .env    # set ADMIN_PASSWORD, SESSION_SECRET and GITHUB_TOKEN
npm run init-db
npm start               # http://localhost:3000
```

`GITHUB_TOKEN` is optional but wanted: without it the whole server shares GitHub's
60 label lookups per hour, which an event burns through in minutes.

`npm run dev` restarts on file changes. Full details in [docs/SETUP.md](docs/SETUP.md).

## Layout

```
src/
  server.js     routing, request handling
  github.js     the one call out: reading a pull request's labels
  points.js     the label → points table and how labels are matched
  db.js         schema + every query
  security.js   sessions, CSRF, rate limiting
  validate.js   input rules
  views.js      HTML templates
public/
  app.css       styles — comic web-slinger theme, all animation/hover states
  fx.js         motion layer — scroll reveals, count-ups, cursor reticle, tilt
  badge.js      canvas badge generator
```

## Look and feel

Comic poster: candy pink sky, black ink linework, yellow signage, hard offset shadows.
The landing page sits in front of an inked city skyline with lit windows, and the code card
drops in on a web strand and keeps swaying. Every graphic is original CSS or hand-written
SVG generated in this repo — no third-party logos, character art or fonts, and no external
requests beyond GitHub avatars.

Motion is handled in [public/fx.js](public/fx.js): scroll reveals, an animated hero title,
stat count-ups, skyline parallax, and a web-line "thwip" on click. Anything already on
screen at load skips its reveal, and the whole motion layer switches itself off under
`prefers-reduced-motion`.

The badge offers four suit themes — Gwen, Miles, Pavitr and Peter — each with its own
accent, webbing colour and card tones.

## Docs

- [docs/SETUP.md](docs/SETUP.md) — install, environment variables, running, deploying
- [docs/SCHEMA.md](docs/SCHEMA.md) — two tables, validation rules, the leaderboard query
- [docs/ROUTES.md](docs/ROUTES.md) — every endpoint the app needs
- [SECURITY.md](SECURITY.md) — reporting vulnerabilities, deployment checklist
- [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## License

[MIT](LICENSE)
