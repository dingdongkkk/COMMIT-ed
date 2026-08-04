# COMMIT-ed

A leaderboard app for an open source event.

Participants submit their GitHub username and a pull request link. An admin reviews each
submission and assigns points by hand. A public leaderboard shows the standings.

The app stores and displays. It does not judge — **points are typed in by an admin**, and
the scoring rules are yours to decide, kept outside this repo.

## Screens

| Route | Access | Does |
|---|---|---|
| `/` or `/submit` | public | Form: GitHub username + PR link → saved as `pending` |
| `/leaderboard` | public | Participants ranked by total approved points |
| `/admin` | password | Pending submissions, a points box, approve/reject |

## Stack

`TBD — pick one, then fill in docs/SETUP.md`

Needs: three pages, a database, one password-protected route.

## Setup

See [docs/SETUP.md](docs/SETUP.md).

```bash
git clone https://github.com/ORG/COMMIT-ed.git
cd COMMIT-ed
cp .env.example .env    # set ADMIN_PASSWORD
# install + run — see docs/SETUP.md
```

## Docs

- [docs/SETUP.md](docs/SETUP.md) — install, environment variables, running, deploying
- [docs/SCHEMA.md](docs/SCHEMA.md) — three tables, validation rules, the leaderboard query
- [docs/ROUTES.md](docs/ROUTES.md) — every endpoint the app needs
- [SECURITY.md](SECURITY.md) — reporting vulnerabilities, deployment checklist
- [CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## Status

Pre-implementation — docs only, no code yet.

## License

[MIT](LICENSE)
