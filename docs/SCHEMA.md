# Schema

Three tables. Illustrative SQL — adapt to your stack.

## `participants`

Created automatically on first submission. No password, no email, no profile.

| Column | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `github_username` | text, unique, not null | Stored lowercased, no `@` |
| `created_at` | timestamp | |

## `submissions`

The only table that matters.

| Column | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `participant_id` | integer, FK → participants | |
| `pr_url` | text, unique, not null | Unique blocks double-submitting the same PR |
| `points` | integer, default 0 | Typed in by the admin at review |
| `status` | text, default `pending` | `pending` · `approved` · `rejected` |
| `note` | text, nullable | Optional, mostly for rejection reasons |
| `submitted_at` | timestamp | |
| `reviewed_at` | timestamp, nullable | |

Only `approved` rows count on the leaderboard. The app never computes `points` — it stores
whatever the admin enters.

## `admins`

Skip this table entirely if you're using a single `ADMIN_PASSWORD` environment variable.

| Column | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `username` | text, unique | |
| `password_hash` | text | Hashed, never plaintext |

## SQL

```sql
CREATE TABLE participants (
  id              INTEGER PRIMARY KEY,
  github_username TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
  id             INTEGER PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  pr_url         TEXT NOT NULL UNIQUE,
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
| `pr_url` | `^https://github\.com/[\w.-]+/[\w.-]+/pull/\d+$` |
| `pr_url` | Not already stored — return "already submitted", not a 500 |

## Backups

The database is the whole event record. Back it up daily during the event — see
[SETUP.md](SETUP.md#backups).
