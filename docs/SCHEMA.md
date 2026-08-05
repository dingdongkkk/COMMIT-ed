# Schema

Two tables, created automatically on first connection. The engine is libSQL: a local
SQLite file in development, Turso in production — same SQL either way.

## `participants`

Created automatically on first submission. No password, no email, no profile.

| Column | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `github_username` | text, unique, not null | Stored lowercased, no `@` |
| `display_name` | text, nullable | Optional, shown on the leaderboard instead of the handle |
| `created_at` | timestamp | |

## `submissions`

The only table that matters.

| Column | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `participant_id` | integer, FK → participants | |
| `pr_url` | text, unique, not null | Unique blocks double-submitting the same PR |
| `labels` | text | The PR's GitHub labels, newline-separated, read at submit time |
| `label_error` | text, nullable | Why the last label lookup failed, if it did |
| `points` | integer, default 0 | Derived from the difficulty label at approval — never typed in |
| `status` | text, default `pending` | `pending` · `approved` · `rejected` |
| `note` | text, nullable | Optional, mostly for rejection reasons |
| `submitted_at` | timestamp | |
| `reviewed_at` | timestamp, nullable | |

Only `approved` rows count on the leaderboard. `points` is written by the app from the
difficulty label (`easy` 2, `medium` 5, `hard` 10) at the moment an organiser approves, so
the stored value is a record of what was awarded even if the label changes later.

## `admins`

Not implemented. A single `ADMIN_PASSWORD` environment variable guards `/admin`; add this
table only if the event ever needs more than one organiser account.

## SQL

```sql
CREATE TABLE participants (
  id              INTEGER PRIMARY KEY,
  github_username TEXT NOT NULL UNIQUE,
  display_name    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE submissions (
  id             INTEGER PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  pr_url         TEXT NOT NULL UNIQUE,
  labels         TEXT NOT NULL DEFAULT '',
  label_error    TEXT,
  points         INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  note           TEXT,
  submitted_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at    TIMESTAMP
);

CREATE INDEX idx_submissions_status ON submissions(status);
```

## Leaderboard query

The entire business logic of the app.

```sql
SELECT
  p.github_username,
  p.display_name,
  COUNT(s.id)   AS prs,
  SUM(s.points) AS total_points
FROM participants p
JOIN submissions s ON s.participant_id = p.id
WHERE s.status = 'approved'
GROUP BY p.id
ORDER BY total_points DESC, MIN(s.reviewed_at) ASC;
```

Tiebreak: whoever reached the score first.

## Validation

Only three checks. Everything else — does the PR exist, is it merged, is it actually theirs
— is the admin's job at review time.

| Field | Rule |
|---|---|
| `github_username` | `^[a-zA-Z0-9-]{1,39}$`, strip a leading `@`, lowercase before storing |
| `name` | Optional, 60 characters max, whitespace collapsed |

Points are not user input at all — see [the scoring table](#scoring).
| `pr_url` | `^https://github\.com/[\w.-]+/[\w.-]+/pull/\d+$` |
| `pr_url` | Not already stored — return "already submitted", not a 500 |

## Scoring

`src/points.js` holds the whole rule:

| Label on the PR | Points |
|---|---|
| `easy` | 2 |
| `medium` | 5 |
| `hard` | 10 |

Matching is case-insensitive and tolerates a prefix word, so `Easy`, `difficulty: hard` and
`level/medium` all count. Anything else — `medium-priority`, `good first issue` — does not,
to keep an unrelated label from awarding points by accident. A PR carrying two difficulty
labels scores the higher one, never the sum.

A PR with no difficulty label is worth 0. Labels are read when the link is submitted, and
an organiser can re-read them from the queue once the project admin adds one.

## Backups

The database is the whole event record. Back it up daily during the event — see
[SETUP.md](SETUP.md#backups).
