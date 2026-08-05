import { createServer } from 'node:http';

import { handle } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

const server = createServer(handle);

server.listen(PORT, () => {
  console.log(`COMMIT-ed running on http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  // Don't hang forever on a stuck connection.
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
