import { existsSync } from 'node:fs';

/**
 * Imported first, before any module that reads process.env at load time —
 * ES module bodies run in import order, so this has to be its own module.
 */
if (existsSync('.env')) process.loadEnvFile('.env');
