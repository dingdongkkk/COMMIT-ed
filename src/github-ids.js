/**
 * Hardcoded list of valid GitHub IDs (usernames) for account verification.
 * Usernames are normalized (lowercased, trimmed, leading @ removed).
 */
export const VALID_GITHUB_IDS = [
  'octocat',
  'ada',
  'torvalds',
  'gaearon',
  'kadenstack',
  'sindresorhus',
  'danabramov',
  'yyx990803',
  'tj',
  'defunkt',
  'mojombo',
  'pjhyett',
  'wycats',
  'ezmobius',
  'techlead',
  'dhh',
  'ry',
  'antirez',
  'vczh',
  'sw-yx',
  'addyosmani',
  'paulirish',
];

/**
 * Normalizes a raw GitHub username.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeGithubId(raw) {
  return String(raw || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
}

/**
 * Checks if a given username is in the valid GitHub IDs list.
 * @param {string} rawUsername
 * @returns {boolean}
 */
export function isValidGithubId(rawUsername) {
  const normalized = normalizeGithubId(rawUsername);
  if (!normalized) return false;
  return VALID_GITHUB_IDS.includes(normalized);
}
