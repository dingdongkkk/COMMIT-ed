import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS participants (
  id              INTEGER PRIMARY KEY,
  github_username TEXT NOT NULL UNIQUE,
  display_name    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id             INTEGER PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  pr_url         TEXT NOT NULL UNIQUE,
  labels         TEXT NOT NULL DEFAULT '',
  label_error    TEXT,
  points         INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  note           TEXT,
  submitted_at   TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
`;

/**
 * DATABASE_URL is either a bare file path or a sqlite:// URL. Anything else is a
 * mistake we would rather catch at boot than at the first query.
 */
function resolveDbPath(url) {
  if (!url) return resolve('data.db');
  if (url.startsWith('sqlite://')) return resolve(url.slice('sqlite://'.length));
  if (url.includes('://')) {
    throw new Error(`DATABASE_URL must be a SQLite file path, got: ${url}`);
  }
  return resolve(url);
}

export function openDb(url = process.env.DATABASE_URL) {
  const path = resolveDbPath(url);
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Databases created before labels existed get the columns added in place. */
function migrate(db) {
  const columns = db
    .prepare('PRAGMA table_info(submissions)')
    .all()
    .map((c) => c.name);
  if (!columns.includes('labels')) {
    db.exec("ALTER TABLE submissions ADD COLUMN labels TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.includes('label_error')) {
    db.exec('ALTER TABLE submissions ADD COLUMN label_error TEXT');
  }
}

export function findOrCreateParticipant(db, username, displayName) {
  const existing = db
    .prepare('SELECT * FROM participants WHERE github_username = ?')
    .get(username);

  if (existing) {
    // A later submission may carry a name where the first one did not.
    if (displayName && displayName !== existing.display_name) {
      db.prepare('UPDATE participants SET display_name = ? WHERE id = ?').run(
        displayName,
        existing.id,
      );
    }
    return existing.id;
  }

  const info = db
    .prepare('INSERT INTO participants (github_username, display_name) VALUES (?, ?)')
    .run(username, displayName || null);
  return Number(info.lastInsertRowid);
}

export function insertSubmission(db, participantId, prUrl) {
  const info = db
    .prepare('INSERT INTO submissions (participant_id, pr_url) VALUES (?, ?)')
    .run(participantId, prUrl);
  return Number(info.lastInsertRowid);
}

/** Labels are stored newline-separated; '' means none were found. */
export function saveLabels(db, id, labels, error) {
  db.prepare('UPDATE submissions SET labels = ?, label_error = ? WHERE id = ?').run(
    labels.join('\n'),
    error || null,
    id,
  );
}

export function readLabels(row) {
  return row.labels ? row.labels.split('\n').filter(Boolean) : [];
}

export function getSubmission(db, id) {
  return db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
}

export function leaderboard(db) {
  return db
    .prepare(
      `SELECT
         p.github_username,
         p.display_name,
         COUNT(s.id)   AS prs,
         SUM(s.points) AS total_points
       FROM participants p
       JOIN submissions s ON s.participant_id = p.id
       WHERE s.status = 'approved'
       GROUP BY p.id
       ORDER BY total_points DESC, MIN(s.reviewed_at) ASC`,
    )
    .all();
}

export function submissionsByStatus(db, status) {
  return db
    .prepare(
      `SELECT s.*, p.github_username, p.display_name
       FROM submissions s
       JOIN participants p ON p.id = s.participant_id
       WHERE s.status = ?
       ORDER BY ${status === 'pending' ? 's.submitted_at ASC' : 's.reviewed_at DESC'}`,
    )
    .all(status);
}

/**
 * Returns 'reviewed', 'already' (someone else got there first) or 'missing'.
 * The status guard is what stops two organisers with stale queues from
 * silently overwriting each other's scores.
 */
export function reviewSubmission(db, id, { status, points, note }) {
  const info = db
    .prepare(
      `UPDATE submissions
       SET status = ?, points = ?, note = ?, reviewed_at = datetime('now')
       WHERE id = ? AND status = 'pending'`,
    )
    .run(status, points, note || null, id);
  if (info.changes > 0) return 'reviewed';

  const row = db.prepare('SELECT status FROM submissions WHERE id = ?').get(id);
  return row ? 'already' : 'missing';
}

/**
 * Correcting a row that has already been reviewed — raising, lowering or
 * revoking a score after the fact. Deliberately the mirror of
 * reviewSubmission: that one only touches pending rows, this one never does,
 * so a correction can't be used to sneak a second award onto a fresh PR.
 * Returns 'adjusted', 'pending' (use the queue instead) or 'missing'.
 */
export function adjustSubmission(db, id, { status, points, note }) {
  const info = db
    .prepare(
      `UPDATE submissions
       SET status = ?, points = ?, note = ?, reviewed_at = datetime('now')
       WHERE id = ? AND status != 'pending'`,
    )
    .run(status, points, note || null, id);
  if (info.changes > 0) return 'adjusted';

  const row = db.prepare('SELECT status FROM submissions WHERE id = ?').get(id);
  return row ? 'pending' : 'missing';
}

export function stats(db) {
  const row = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM participants) AS participants,
         (SELECT COUNT(*) FROM submissions WHERE status = 'approved') AS approved,
         (SELECT COUNT(*) FROM submissions WHERE status = 'pending') AS pending,
         (SELECT COALESCE(SUM(points), 0) FROM submissions WHERE status = 'approved') AS points`,
    )
    .get();
  return row;
}
