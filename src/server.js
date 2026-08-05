import './env.js';

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  openDb,
  findOrCreateParticipant,
  insertSubmission,
  adjustSubmission,
  leaderboard,
  submissionsByStatus,
  reviewSubmission,
  stats,
} from './db.js';
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
import {
  validateName,
  validatePoints,
  validatePrUrl,
  validateUsername,
} from './validate.js';
import {
  adminLoginPage,
  adminPage,
  badgePage,
  errorPage,
  homePage,
  leaderboardPage,
  submitPage,
} from './views.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'change-me') {
  console.error(
    'ADMIN_PASSWORD is unset (or still "change-me"). Set it in .env before starting.',
  );
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
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

const db = openDb();
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
  'GET /': (req, res) => send(res, 200, homePage({ stats: stats(db) })),
  'GET /badge': (req, res) => send(res, 200, badgePage()),
  'GET /leaderboard': (req, res) =>
    send(res, 200, leaderboardPage({ rows: leaderboard(db) })),

  'GET /submit': (req, res) =>
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

    try {
      const participantId = findOrCreateParticipant(db, username.value, name.value);
      insertSubmission(db, participantId, prUrl.value);
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

    return send(
      res,
      200,
      submitPage({
        values: {},
        success: `Submitted. Your pull request is pending review — check the leaderboard once an organiser has scored it.`,
      }),
    );
  },

  'GET /admin/login': (req, res) =>
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

  'GET /admin': (req, res) => {
    if (!requireAdmin(req, res)) return;
    send(
      res,
      200,
      adminPage({
        pending: submissionsByStatus(db, 'pending'),
        reviewed: [
          ...submissionsByStatus(db, 'approved'),
          ...submissionsByStatus(db, 'rejected'),
        ].sort((a, b) => String(b.reviewed_at).localeCompare(String(a.reviewed_at))),
        stats: stats(db),
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
  // A rejection never carries points, whatever is sitting in the input box.
  let points = 0;
  if (action === 'approve') {
    const parsed = validatePoints(form.get('points'));
    if (parsed.error) return send(res, 400, errorPage(400, parsed.error, '/admin'));
    points = parsed.value;
  }

  const outcome = reviewSubmission(db, id, {
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
  if (action !== 'update' && action !== 'revoke') {
    return send(res, 400, errorPage(400, 'Unknown action.', '/admin'));
  }

  const note = String(form.get('note') || '').trim().slice(0, 300);
  let points = 0;
  if (action === 'update') {
    const parsed = validatePoints(form.get('points'));
    if (parsed.error) return send(res, 400, errorPage(400, parsed.error, '/admin'));
    points = parsed.value;
  }

  const outcome = adjustSubmission(db, id, {
    status: action === 'update' ? 'approved' : 'rejected',
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

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'GET' && pathname !== '/' && (await serveStatic(res, pathname))) {
      return;
    }

    const action = pathname.match(/^\/admin\/submissions\/(\d+)\/(review|adjust)$/);
    if (action && req.method === 'POST') {
      const id = Number(action[1]);
      return action[2] === 'review'
        ? await handleReview(req, res, id)
        : await handleAdjust(req, res, id);
    }

    const handler = routes[`${req.method} ${pathname}`];
    if (handler) return await handler(req, res);

    // HEAD is handled as a GET with the body discarded by Node.
    send(res, 404, errorPage(404, 'That page does not exist.'));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(res, 500, errorPage(500, 'Something went wrong.'));
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`COMMIT-ed running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close();
  server.close(() => process.exit(0));
});
