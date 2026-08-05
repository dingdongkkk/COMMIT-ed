import { handle } from '../src/app.js';

/**
 * Vercel entry point. Every request that isn't a static file in public/ lands
 * here, and `handle` is the same router the local server uses — so there is
 * one code path to reason about, not two.
 */
export default async function handler(req, res) {
  await handle(req, res);
}
