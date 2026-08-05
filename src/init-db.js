import './env.js';

import { db } from './db.js';

const client = await db();
const { rows } = await client.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
);
const tables = rows.map((r) => r.name).filter((n) => !n.startsWith('sqlite_'));

console.log(
  `Database ready at ${process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'data.db'}`,
);
console.log(`Tables: ${tables.join(', ')}`);
