import { isValidGithubId } from './github-ids.js';

const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;
const PR_URL_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/;

export function normalizeUsername(raw) {
  return String(raw || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
}

export function validateUsername(raw) {
  const username = normalizeUsername(raw);
  if (!username) return { error: 'GitHub username is required.' };
  if (!USERNAME_RE.test(username)) {
    return { error: 'That is not a valid GitHub username (letters, numbers and hyphens).' };
  }
  if (!isValidGithubId(username)) {
    return { error: 'GitHub username is not recognized in the list of valid event participants.' };
  }
  return { value: username };
}

export function validatePrUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) return { error: 'Pull request link is required.' };
  if (!PR_URL_RE.test(url)) {
    return { error: 'Link must look like https://github.com/owner/repo/pull/123' };
  }
  return { value: url };
}

export function validateName(raw) {
  const name = String(raw || '').trim().replace(/\s+/g, ' ');
  if (name.length > 60) return { error: 'Name is too long (60 characters max).' };
  return { value: name };
}
