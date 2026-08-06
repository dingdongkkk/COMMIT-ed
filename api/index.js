/**
 * Vercel entry point. Every request that isn't a static file in public/ lands
 * here, and `handle` is the same router the local server uses — so there is
 * one code path to reason about, not two.
 *
 * The import is guarded because a failure at module load on Vercel surfaces as
 * FUNCTION_INVOCATION_FAILED with no detail on the page at all. Catching it
 * lets the response say what actually broke.
 */

let handle = null;
let startupError = null;

try {
  ({ handle } = await import('../src/app.js'));
} catch (err) {
  startupError = err;
  console.error('Startup failed:', err);
}

export default async function handler(req, res) {
  if (startupError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(
      `COMMIT-ed failed to start.\n\n${startupError.message}\n\n` +
        'Check this deployment\'s environment variables: ADMIN_PASSWORD, ' +
        'SESSION_SECRET, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, GITHUB_TOKEN.\n',
    );
    return;
  }

  await handle(req, res);
}
