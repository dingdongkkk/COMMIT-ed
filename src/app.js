import './env.js';

import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findOrCreateParticipant,
  insertSubmission,
  adjustSubmission,
  getSubmission,
  leaderboard,
  readLabels,
  saveLabels,
  submissionsByStatus,
  submittedRepositories,
  reviewSubmission,
  stats,
} from './db.js';
import { fetchPrLabels, fetchRepoDetails } from './github.js';
import { scoreLabels } from './points.js';
import {
  clearSession,
  clientIp,
  constantTimeEqual,
  createSession,
  csrfToken,
  csrfValid,
  isAuthenticated,
  rateLimiter,
} from './security.js';
import { validateName, validatePrUrl, validateUsername } from './validate.js';
import {
  adminLoginPage,
  adminPage,
  badgePage,
  errorPage,
  homePage,
  leaderboardPage,
  projectsPage,
  submitPage,
} from './views.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Misconfiguration is reported per request, not thrown at import. A throw at
 * module scope on a serverless host shows up as an opaque
 * FUNCTION_INVOCATION_FAILED with nothing to act on; this way the page itself
 * names the variable that is missing.
 */
function configError() {
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'change-me') {
    return 'ADMIN_PASSWORD is not set on this deployment (or is still "change-me").';
  }
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    return 'SESSION_SECRET is not set on this deployment. Without it, admin logins break as soon as a second instance starts.';
  }
  if (!process.env.TURSO_DATABASE_URL && process.env.NODE_ENV === 'production') {
    return 'TURSO_DATABASE_URL is not set on this deployment, so there is nowhere to store submissions.';
  }
  return null;
}

if (!process.env.GITHUB_TOKEN) {
  console.warn(
    'GITHUB_TOKEN is unset — label lookups are capped at 60/hour for the whole ' +
      'server. Set a token before the event.',
  );
}

if (!process.env.SESSION_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn(
    'SESSION_SECRET is unset — a random one is generated per boot, so every ' +
      'restart signs admins out. Set it before the event.',
  );
}

const PORT = Number(process.env.PORT) || 3000;
const SECURE_COOKIES = process.env.NODE_ENV === 'production';
if (SECURE_COOKIES) {
  console.log('NODE_ENV=production: session cookies are Secure, so /admin needs HTTPS.');
}
const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));

// A whole campus can share one public IP, so these are per-IP burst guards,
// not per-person quotas. Login only spends budget on a wrong password.
const submitLimit = rateLimiter({ windowMs: 60_000, max: 60 });
const loginFailures = rateLimiter({ windowMs: 15 * 60_000, max: 25 });

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...headers,
  });
  res.end(body);
}

function redirect(res, location, headers = {}) {
  res.writeHead(303, { Location: location, ...headers });
  res.end();
}

async function readBody(req, limit = 16 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('body too large');
    chunks.push(chunk);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

async function serveStatic(res, pathname) {
  const rel = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const file = join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR)) return false;
  try {
    const data = await readFile(file);
    send(res, 200, data, {
      'Content-Type': MIME[extname(file)] || 'application/octet-stream',
      // Revalidate every load: the CSS and badge script are small, and a stale
      // copy after a deploy is more annoying than the extra request.
      'Cache-Control': 'no-cache',
    });
    return true;
  } catch {
    return false;
  }
}

function requireAdmin(req, res) {
  if (isAuthenticated(req)) return true;
  redirect(res, '/admin/login');
  return false;
}

const routes = {
  'GET /': async (req, res) => send(res, 200, homePage({ stats: await stats() })),
  'GET /badge': async (req, res) => send(res, 200, badgePage()),

  // Health check for the host: proves the process is up and the database reads.
  'GET /healthz': async (req, res) => {
    const { participants } = await stats();
    send(res, 200, `ok ${participants}`, { 'Content-Type': 'text/plain; charset=utf-8' });
  },
  'GET /leaderboard': async (req, res) =>
    send(res, 200, leaderboardPage({ rows: await leaderboard() })),

  'GET /projects': async (req, res) => {
    const rawProjects = await submittedRepositories();
    const projects = await Promise.all(
      rawProjects.map(async (p) => {
        const details = await fetchRepoDetails(p.owner, p.repo);
        return {
          ...p,
          description: details.description,
          language: details.language,
          topics: details.topics,
          techStack: details.techStack,
          stars: details.stars,
        };
      }),
    );
    send(res, 200, projectsPage({ projects }));
  },

  'GET /submit': async (req, res) =>
    send(res, 200, submitPage({ values: {}, success: '' })),

  'POST /submit': async (req, res) => {
    if (!submitLimit(clientIp(req))) {
      return send(res, 429, errorPage(429, 'Too many submissions. Try again in a minute.'));
    }
    const form = await readBody(req);
    const values = {
      name: form.get('name') || '',
      github_username: form.get('github_username') || '',
      pr_url: form.get('pr_url') || '',
    };

    const name = validateName(values.name);
    const username = validateUsername(values.github_username);
    const prUrl = validatePrUrl(values.pr_url);
    const error = name.error || username.error || prUrl.error;
    if (error) return send(res, 400, submitPage({ values, error }));

    let submissionId;
    try {
      const participantId = await findOrCreateParticipant(username.value, name.value);
      submissionId = await insertSubmission(participantId, prUrl.value);
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        return send(
          res,
          409,
          submitPage({ values, error: 'That pull request has already been submitted.' }),
        );
      }
      throw err;
    }

    // Read the difficulty label now so the contributor sees what it is worth.
    const lookup = await fetchPrLabels(prUrl.value);
    const { labels } = lookup;
    await saveLabels(submissionId, labels, lookup.error);
    const { tier, points } = scoreLabels(labels);

    return send(
      res,
      200,
      submitPage({
        values: {},
        success: 'Submitted — your pull request is now waiting for an organiser to check it.',
        scored: { tier, points, labels, error: lookup.error },
      }),
    );
  },

  'GET /admin/login': async (req, res) =>
    send(res, 200, adminLoginPage({ csrf: csrfToken(req) })),

  'POST /admin/login': async (req, res) => {
    const form = await readBody(req);
    if (!csrfValid(req, form.get('csrf'))) {
      return send(res, 403, adminLoginPage({ csrf: csrfToken(req), error: 'Session expired, try again.' }));
    }
    if (!constantTimeEqual(form.get('password') || '', ADMIN_PASSWORD)) {
      if (!loginFailures(clientIp(req))) {
        return send(res, 429, errorPage(429, 'Too many wrong passwords. Try again later.'));
      }
      return send(
        res,
        401,
        adminLoginPage({ csrf: csrfToken(req), error: 'Wrong password.' }),
      );
    }
    return redirect(res, '/admin', { 'Set-Cookie': createSession(SECURE_COOKIES) });
  },

  'GET /admin': async (req, res) => {
    if (!requireAdmin(req, res)) return;
    send(
      res,
      200,
      adminPage({
        pending: await submissionsByStatus('pending'),
        reviewed: [
          ...await submissionsByStatus('approved'),
          ...await submissionsByStatus('rejected'),
        ].sort((a, b) => String(b.reviewed_at).localeCompare(String(a.reviewed_at))),
        stats: await stats(),
        csrf: csrfToken(req),
      }),
    );
  },

  'POST /admin/logout': async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const form = await readBody(req);
    if (!csrfValid(req, form.get('csrf'))) return send(res, 403, errorPage(403, 'Bad CSRF token.'));
    redirect(res, '/', { 'Set-Cookie': clearSession() });
  },
};

async function handleReview(req, res, id) {
  if (!requireAdmin(req, res)) return;
  const form = await readBody(req);
  if (!csrfValid(req, form.get('csrf'))) {
    return send(res, 403, errorPage(403, 'Bad CSRF token. Reload the admin page.', '/admin'));
  }

  const action = form.get('action');
  if (action !== 'approve' && action !== 'reject') {
    return send(res, 400, errorPage(400, 'Unknown action.', '/admin'));
  }

  const note = String(form.get('note') || '').trim().slice(0, 300);

  // The label decides the score; approving is the organiser's stamp on it.
  const row = await getSubmission(id);
  if (!row) return send(res, 404, errorPage(404, 'Submission not found.', '/admin'));
  const points = action === 'approve' ? scoreLabels(readLabels(row)).points : 0;

  const outcome = await reviewSubmission(id, {
    status: action === 'approve' ? 'approved' : 'rejected',
    points,
    note,
  });
  if (outcome === 'missing') {
    return send(res, 404, errorPage(404, 'Submission not found.', '/admin'));
  }
  if (outcome === 'already') {
    return send(
      res,
      409,
      errorPage(
        409,
        'Another organiser already reviewed this pull request. Your score was not ' +
          'applied — reload the queue to see what they gave it.',
        '/admin',
      ),
    );
  }
  redirect(res, '/admin');
}

async function handleAdjust(req, res, id) {
  if (!requireAdmin(req, res)) return;
  const form = await readBody(req);
  if (!csrfValid(req, form.get('csrf'))) {
    return send(res, 403, errorPage(403, 'Bad CSRF token. Reload the admin page.', '/admin'));
  }

  const action = form.get('action');
  if (action !== 'restore' && action !== 'revoke') {
    return send(res, 400, errorPage(400, 'Unknown action.', '/admin'));
  }

  const note = String(form.get('note') || '').trim().slice(0, 300);
  const row = await getSubmission(id);
  if (!row) return send(res, 404, errorPage(404, 'Submission not found.', '/admin'));
  const points = action === 'restore' ? scoreLabels(readLabels(row)).points : 0;

  const outcome = await adjustSubmission(id, {
    status: action === 'restore' ? 'approved' : 'rejected',
    points,
    note,
  });
  if (outcome === 'missing') {
    return send(res, 404, errorPage(404, 'Submission not found.', '/admin'));
  }
  if (outcome === 'pending') {
    return send(
      res,
      409,
      errorPage(409, 'That pull request is still pending — score it in the queue above.', '/admin'),
    );
  }
  redirect(res, '/admin');
}

async function handleRefresh(req, res, id) {
  if (!requireAdmin(req, res)) return;
  const form = await readBody(req);
  if (!csrfValid(req, form.get('csrf'))) {
    return send(res, 403, errorPage(403, 'Bad CSRF token. Reload the admin page.', '/admin'));
  }

  const row = await getSubmission(id);
  if (!row) return send(res, 404, errorPage(404, 'Submission not found.', '/admin'));

  const { labels, error } = await fetchPrLabels(row.pr_url);
  await saveLabels(id, labels, error);
  redirect(res, '/admin');
}

export async function handle(req, res) {
  const problem = configError();
  if (problem) {
    console.error(`Configuration error: ${problem}`);
    return send(res, 500, errorPage(500, `Not configured yet — ${problem}`));
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'GET' && pathname !== '/' && (await serveStatic(res, pathname))) {
      return;
    }

    const action = pathname.match(/^\/admin\/submissions\/(\d+)\/(review|adjust|refresh)$/);
    if (action && req.method === 'POST') {
      const id = Number(action[1]);
      if (action[2] === 'review') return await handleReview(req, res, id);
      if (action[2] === 'adjust') return await handleAdjust(req, res, id);
      return await handleRefresh(req, res, id);
    }

    const handler = routes[`${req.method} ${pathname}`];
    if (handler) return await handler(req, res);

    // HEAD is handled as a GET with the body discarded by Node.
    send(res, 404, errorPage(404, 'That page does not exist.'));
  } catch (err) {
    console.error(err);
    // Surface the reason while you are still setting the deployment up; a
    // generic page here costs an hour of guessing at the dashboard.
    const detail = process.env.SHOW_ERRORS === 'true' ? `: ${err?.message}` : '.';
    if (!res.headersSent) send(res, 500, errorPage(500, `Something went wrong${detail}`));
    else res.end();
  }
}
