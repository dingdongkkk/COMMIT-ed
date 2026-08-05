import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** A restart invalidating open admin sessions is fine for an event this size. */
const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const SESSION_COOKIE = 'commit_ed_admin';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function sign(value) {
  return createHmac('sha256', SECRET).update(value).digest('base64url');
}

export function constantTimeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  // timingSafeEqual throws on length mismatch, so compare digests of equal size.
  const hashA = createHmac('sha256', SECRET).update(bufA).digest();
  const hashB = createHmac('sha256', SECRET).update(bufB).digest();
  return timingSafeEqual(hashA, hashB);
}

export function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function createSession(secure) {
  const payload = `${Date.now() + SESSION_TTL_MS}.${randomBytes(16).toString('hex')}`;
  const value = `${payload}.${sign(payload)}`;
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_MS / 1000}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function clearSession() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isAuthenticated(req) {
  const raw = parseCookies(req)[SESSION_COOKIE];
  if (!raw) return false;
  const idx = raw.lastIndexOf('.');
  if (idx < 0) return false;
  const payload = raw.slice(0, idx);
  const signature = raw.slice(idx + 1);
  if (sign(payload) !== signature) return false;
  const expiry = Number(payload.split('.')[0]);
  return Number.isFinite(expiry) && expiry > Date.now();
}

/**
 * CSRF token bound to the current session cookie: a stolen form token is useless
 * without the matching session, and vice versa.
 */
export function csrfToken(req) {
  const session = parseCookies(req)[SESSION_COOKIE] || 'anonymous';
  return sign(`csrf:${session}`);
}

export function csrfValid(req, submitted) {
  if (!submitted) return false;
  const expected = csrfToken(req);
  if (expected.length !== submitted.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(submitted));
}

/** Fixed-window limiter, in memory. One process, one event, good enough. */
export function rateLimiter({ windowMs, max }) {
  const hits = new Map();
  return function check(key) {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now > entry.reset) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return true;
    }
    entry.count += 1;
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    return entry.count <= max;
  };
}

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}
