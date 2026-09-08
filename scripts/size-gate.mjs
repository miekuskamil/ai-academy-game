#!/usr/bin/env node
/**
 * Fails the build if the bundle outgrows its budget.
 *
 * The target device is a mid-range Android handset on a home connection, so
 * the budget is enforced in CI rather than checked occasionally by hand.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = { js: 200, css: 40 };
const DIST = new URL('../dist/assets', import.meta.url).pathname;

const totals = { js: 0, css: 0 };
for (const name of await readdir(DIST)) {
  const ext = name.endsWith('.js') ? 'js' : name.endsWith('.css') ? 'css' : null;
  if (!ext || name.endsWith('.map')) continue;
  const path = join(DIST, name);
  if (!(await stat(path)).isFile()) continue;
  totals[ext] += gzipSync(await readFile(path)).length;
}

let failed = false;
for (const [ext, bytes] of Object.entries(totals)) {
  const kb = bytes / 1024;
  const budget = BUDGET_KB[ext];
  const verdict = kb > budget ? 'OVER' : 'ok';
  if (kb > budget) failed = true;
  console.log(`${ext.toUpperCase().padEnd(4)} ${kb.toFixed(1).padStart(7)} KB gzip / ${budget} KB  ${verdict}`);
}

if (failed) {
  console.error('\nBundle is over budget. Trim it or raise the budget deliberately.');
  process.exit(1);
}
