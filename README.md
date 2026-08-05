# COMMIT-ed

A leaderboard app for an open source event.

Contributors generate a downloadable badge from their GitHub handle, submit their pull
request links, and watch the standings. An admin reviews each submission by hand and
assigns the points.

The app stores and displays. It does not judge — **points are typed in by an admin**, and
the scoring rules are yours to decide, kept outside this repo.

## Screens

| Route | Access | Does |
|---|---|---|
| `/` | public | Landing page with live counts |
| `/badge` | public | Name + GitHub handle → contributor card, downloadable as PNG |
| `/submit` | public | Form: GitHub username + PR link → saved as `pending` |
| `/leaderboard` | public | Participants ranked by total approved points |
| `/admin` | password | Pending submissions, a points box, approve/reject |

## Stack

Node.js (22.5+) and nothing else — **zero dependencies**.

- `node:http` for the server, hand-rolled router, server-rendered HTML
- `node:sqlite` for storage
- `node:crypto` for signed session cookies and CSRF tokens
- The badge is drawn client-side on a `<canvas>`; the avatar comes from
  `avatars.githubusercontent.com`, so there are no GitHub API calls or tokens

## Setup

```bash
git clone https://github.com/ORG/COMMIT-ed.git
cd COMMIT-ed
cp .env.example .env    # set ADMIN_PASSWORD and SESSION_SECRET
npm run init-db
npm start               # http://localhost:3000
```

`npm run dev` restarts on file changes. Full details in [docs/SETUP.md](docs/SETUP.md).

## Layout

```
src/
  server.js     routing, request handling
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

Comic-book web-slinger: red and blue palette, halftone dots, web patterns and panel
borders. Every graphic is original CSS or hand-written SVG drawn in this repo — no
third-party logos, character art or fonts, and no external requests beyond GitHub avatars.

Motion is handled in [public/fx.js](public/fx.js): scroll reveals, an animated hero title,
stat count-ups, a web-line "thwip" on click, a trailing cursor reticle, and pointer tilt on
the badge preview. Anything already on screen at load skips its reveal, and the whole motion
layer switches itself off under `prefers-reduced-motion`.

## Docs

- [docs/SETUP.md](docs/SETUP.md) — install, environment variables, running, deploying
- [docs/SCHEMA.md](docs/SCHEMA.md) — two tables, validation rules, the leaderboard query
- [docs/ROUTES.md](docs/ROUTES.md) — every endpoint the app needs
- [SECURITY.md](SECURITY.md) — reporting vulnerabilities, deployment checklist
- [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## License

[MIT](LICENSE)
