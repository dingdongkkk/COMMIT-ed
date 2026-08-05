/**
 * The one place the app talks to GitHub: reading the labels off a pull request.
 *
 * Unauthenticated calls are capped at 60 per hour per IP, which an event will
 * blow through in minutes — set GITHUB_TOKEN (any classic token with no scopes
 * works for public repos) to get 5000.
 */

const API = 'https://api.github.com';
const TIMEOUT_MS = 8000;

/** Same shape the submit form already validates, reused to build the API path. */
const PR_URL_RE = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)$/;

function authHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    // GitHub rejects API calls without one.
    'User-Agent': 'COMMIT-ed-leaderboard',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Returns { labels: string[], error: string|null }. Never throws and never
 * blocks a submission: a network problem means "no labels yet", and the admin
 * can refresh from the review queue once it clears.
 */
export async function fetchPrLabels(prUrl) {
  const match = PR_URL_RE.exec(prUrl);
  if (!match) return { labels: [], error: 'That link is not a pull request URL.' };

  const [, owner, repo, number] = match;
  const url = `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo,
  )}/pulls/${encodeURIComponent(number)}`;

  try {
    const response = await fetch(url, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (response.status === 404) {
      return { labels: [], error: 'GitHub says that pull request does not exist.' };
    }
    if (response.status === 403 || response.status === 429) {
      return {
        labels: [],
        error: 'GitHub rate limit hit — refresh the labels again shortly.',
      };
    }
    if (!response.ok) {
      return { labels: [], error: `GitHub returned ${response.status}.` };
    }

    const data = await response.json();
    const labels = Array.isArray(data.labels)
      ? data.labels.map((label) => String(label?.name ?? '')).filter(Boolean)
      : [];
    return { labels, error: null };
  } catch (err) {
    const reason = err?.name === 'TimeoutError' ? 'timed out' : 'failed';
    return { labels: [], error: `Could not reach GitHub (${reason}) — try refreshing.` };
  }
}
