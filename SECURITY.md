# Security Policy

## Reporting a vulnerability

**Do not open a public issue.**

Report privately via [GitHub's private vulnerability reporting](../../security/advisories/new),
or email `TBD — add a contact address`.

Include what the issue is, how to reproduce it, and what an attacker could do with it.

Expect an acknowledgement within 72 hours.

## What matters in this app

It's a small app, but it has three things worth attacking:

| Area | Risk |
|---|---|
| `/admin` | A single shared password guards the ability to change everyone's score |
| Leaderboard | Renders user-supplied usernames and URLs on a public page — XSS surface |
| `POST /submit` | Unauthenticated write endpoint — spam and flooding |

Reports touching any of those are in scope, including on a deployed instance you're
running yourself.

## Deployment checklist

Most realistic problems here are deployment mistakes, not code bugs:

- [ ] `ADMIN_PASSWORD` set to something strong, from the host's environment config
- [ ] App refuses to start when `ADMIN_PASSWORD` is unset — no insecure default
- [ ] HTTPS on, always — the admin password crosses the wire
- [ ] `.env` never committed (it's gitignored; check `git log` if you're unsure)
- [ ] Session cookie is `httpOnly`, `secure`, `sameSite=lax`
- [ ] CSRF protection on admin forms
- [ ] Rate limiting on `POST /submit` and `POST /admin/login`
- [ ] Username and PR URL escaped on output
- [ ] Database backed up somewhere the web server can't serve

## Out of scope

- Missing hardening headers with no demonstrated impact
- Automated scanner output without a working exploit
- Denial of service by traffic volume
- Anything requiring access to the host machine
- Participants gaming the *points* — that's a moderation problem, not a security one

## Ground rules

Test against your own instance. Don't attack a live event deployment, don't touch other
people's submissions, and don't run destructive tests.
