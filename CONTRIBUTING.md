# Contributing

## Setup

See [docs/SETUP.md](docs/SETUP.md).

## Scope

Three things: a submit form, an admin scoring page, a leaderboard. See
[docs/ROUTES.md](docs/ROUTES.md) for the full surface.

Not building: GitHub OAuth, GitHub API calls, webhooks, automatic PR verification, teams,
profiles, badges, notifications. Points are typed in by a human — the app has no scoring
logic and shouldn't gain any.

## Workflow

1. Open an issue before anything non-trivial.
2. Branch: `feat/`, `fix/`, `docs/`, or `chore/` + short description.
3. Commits: `feat(admin): add reject button`
4. One logical change per PR.

## Before opening a PR

- [ ] It runs locally
- [ ] No secrets committed — config comes from environment variables
- [ ] No new dependency without saying why in the PR

Be decent to each other.
