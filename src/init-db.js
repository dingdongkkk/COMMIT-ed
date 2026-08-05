import './env.js';

import { openDb } from './db.js';

const db = openDb();
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  .all()
  .map((r) => r.name)
  .filter((n) => !n.startsWith('sqlite_'));

console.log(`Database ready at ${process.env.DATABASE_URL || 'data.db'}`);
console.log(`Tables: ${tables.join(', ')}`);
db.close();
