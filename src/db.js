import { createClient } from '@libsql/client';

/**
 * Storage is libSQL: a local file in development, Turso in production. Same
 * client, same SQL, only the URL changes — so what runs on your laptop is what
 * runs on the deployed site.
 */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS participants (
     id              INTEGER PRIMARY KEY,
     github_username TEXT NOT NULL UNIQUE,
     display_name    TEXT,
     created_at      TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE TABLE IF NOT EXISTS submissions (
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
   )`,
  'CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)',
];

/**
 * Accepts what each host hands you: a Turso URL, a `file:` URL, or a bare path
 * left over from the SQLite build.
 */
function resolveUrl() {
  const url =
    process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:data.db';
  return url.includes('://') ? url : `file:${url}`;
}

let ready = null;

/**
 * One connection per process, initialised once. On serverless each cold start
 * pays for this; every later request on that instance reuses it.
 */
export function db() {
  if (!ready) ready = connect();
  return ready;
}

async function connect() {
  const client = createClient({
    url: resolveUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  for (const statement of SCHEMA) await client.execute(statement);
  await migrate(client);
  return client;
}

/** Databases created before labels existed get the columns added in place. */
async function migrate(client) {
  try {
    const { rows } = await client.execute('PRAGMA table_info(submissions)');
    const columns = rows.map((r) => r.name);
    if (!columns.includes('labels')) {
      await client.execute(
        "ALTER TABLE submissions ADD COLUMN labels TEXT NOT NULL DEFAULT ''",
      );
    }
    if (!columns.includes('label_error')) {
      await client.execute('ALTER TABLE submissions ADD COLUMN label_error TEXT');
    }
  } catch {
    // A fresh database already has both columns; nothing to migrate.
  }
}

async function run(sql, args = []) {
  const client = await db();
  return client.execute({ sql, args });
}

async function one(sql, args = []) {
  const { rows } = await run(sql, args);
  return rows[0] ?? null;
}

export async function findOrCreateParticipant(username, displayName) {
  const existing = await one(
    'SELECT id, display_name FROM participants WHERE github_username = ?',
    [username],
  );

  if (existing) {
    // A later submission may carry a name where the first one did not.
    if (displayName && displayName !== existing.display_name) {
      await run('UPDATE participants SET display_name = ? WHERE id = ?', [
        displayName,
        existing.id,
      ]);
    }
    return Number(existing.id);
  }

  const result = await run(
    'INSERT INTO participants (github_username, display_name) VALUES (?, ?)',
    [username, displayName || null],
  );
  return Number(result.lastInsertRowid);
}

export async function insertSubmission(participantId, prUrl) {
  const result = await run(
    'INSERT INTO submissions (participant_id, pr_url) VALUES (?, ?)',
    [participantId, prUrl],
  );
  return Number(result.lastInsertRowid);
}

/** Labels are stored newline-separated; '' means none were found. */
export async function saveLabels(id, labels, error) {
  await run('UPDATE submissions SET labels = ?, label_error = ? WHERE id = ?', [
    labels.join('\n'),
    error || null,
    id,
  ]);
}

export function readLabels(row) {
  return row.labels ? String(row.labels).split('\n').filter(Boolean) : [];
}

export function getSubmission(id) {
  return one('SELECT * FROM submissions WHERE id = ?', [id]);
}

export async function leaderboard() {
  const { rows } = await run(
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
  );
  return rows;
}

export async function submissionsByStatus(status) {
  const order = status === 'pending' ? 's.submitted_at ASC' : 's.reviewed_at DESC';
  const { rows } = await run(
    `SELECT s.*, p.github_username, p.display_name
     FROM submissions s
     JOIN participants p ON p.id = s.participant_id
     WHERE s.status = ?
     ORDER BY ${order}`,
    [status],
  );
  return rows;
}

/**
 * Returns 'reviewed', 'already' (someone else got there first) or 'missing'.
 * The status guard is what stops two organisers with stale queues from
 * silently overwriting each other's scores.
 */
export async function reviewSubmission(id, { status, points, note }) {
  const result = await run(
    `UPDATE submissions
     SET status = ?, points = ?, note = ?, reviewed_at = datetime('now')
     WHERE id = ? AND status = 'pending'`,
    [status, points, note || null, id],
  );
  if (result.rowsAffected > 0) return 'reviewed';

  const row = await one('SELECT status FROM submissions WHERE id = ?', [id]);
  return row ? 'already' : 'missing';
}

/**
 * Correcting a row that has already been reviewed — revoking a score or
 * reinstating it. Deliberately the mirror of reviewSubmission: that one only
 * touches pending rows, this one never does, so a correction can't be used to
 * sneak a second award onto a fresh pull request.
 */
export async function adjustSubmission(id, { status, points, note }) {
  const result = await run(
    `UPDATE submissions
     SET status = ?, points = ?, note = ?, reviewed_at = datetime('now')
     WHERE id = ? AND status != 'pending'`,
    [status, points, note || null, id],
  );
  if (result.rowsAffected > 0) return 'adjusted';

  const row = await one('SELECT status FROM submissions WHERE id = ?', [id]);
  return row ? 'pending' : 'missing';
}

/**
 * Removes a submission outright, and the participant with it if that was their
 * only one. Revoking a score only hides it from the leaderboard; test rows
 * still sit in the reviewed list and still count as contributors, which is not
 * what "clear the leaderboard" means before an event.
 */
export async function deleteSubmission(id) {
  const row = await one('SELECT participant_id FROM submissions WHERE id = ?', [id]);
  if (!row) return 'missing';

  await run('DELETE FROM submissions WHERE id = ?', [id]);

  const remaining = await one(
    'SELECT COUNT(*) AS n FROM submissions WHERE participant_id = ?',
    [row.participant_id],
  );
  if (Number(remaining.n) === 0) {
    await run('DELETE FROM participants WHERE id = ?', [row.participant_id]);
    return 'deleted-with-participant';
  }
  return 'deleted';
}

export async function stats() {
  const row = await one(
    `SELECT
       (SELECT COUNT(*) FROM participants) AS participants,
       (SELECT COUNT(*) FROM submissions WHERE status = 'approved') AS approved,
       (SELECT COUNT(*) FROM submissions WHERE status = 'pending') AS pending,
       (SELECT COALESCE(SUM(points), 0) FROM submissions WHERE status = 'approved') AS points`,
  );
  // libSQL returns counts as BigInt; templates and JSON want plain numbers.
  return {
    participants: Number(row.participants),
    approved: Number(row.approved),
    pending: Number(row.pending),
    points: Number(row.points),
  };
}

export async function submittedRepositories() {
  const { rows } = await run(
    `SELECT
       s.pr_url,
       s.status,
       s.submitted_at,
       p.github_username
     FROM submissions s
     JOIN participants p ON p.id = s.participant_id
     ORDER BY s.submitted_at DESC`,
  );

  const reposMap = new Map();

  for (const row of rows) {
    const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/\d+$/i.exec(row.pr_url);
    if (!match) continue;

    const owner = match[1];
    const repo = match[2];
    const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

    if (!reposMap.has(key)) {
      reposMap.set(key, {
        owner,
        repo,
        fullName: `${owner}/${repo}`,
        repoUrl: `https://github.com/${owner}/${repo}`,
        totalPrs: 0,
        approvedPrs: 0,
        contributors: new Set(),
        latestSubmittedAt: row.submitted_at,
      });
    }

    const item = reposMap.get(key);
    item.totalPrs += 1;
    if (row.status === 'approved') {
      item.approvedPrs += 1;
    }
    item.contributors.add(row.github_username);
  }

  return Array.from(reposMap.values()).map((r) => ({
    owner: r.owner,
    repo: r.repo,
    fullName: r.fullName,
    repoUrl: r.repoUrl,
    totalPrs: r.totalPrs,
    approvedPrs: r.approvedPrs,
    contributorsCount: r.contributors.size,
    latestSubmittedAt: r.latestSubmittedAt,
  }));
}

