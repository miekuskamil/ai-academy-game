#!/usr/bin/env node
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { inlineBundle, verifyInlined } from './inline-core.mjs';

const DIST = new URL('../dist-single', import.meta.url).pathname;
const OUT = process.argv[2];

const html = await readFile(join(DIST, 'index.html'), 'utf8');
const assets = await readdir(join(DIST, 'assets'));

const js = await readFile(join(DIST, 'assets', assets.find((f) => f.endsWith('.js'))), 'utf8');
const css = await readFile(join(DIST, 'assets', assets.find((f) => f.endsWith('.css'))), 'utf8');
const favicon = await readFile(join(DIST, 'favicon.svg'), 'utf8').catch(() => null);

const out = inlineBundle({ html, js, css, favicon });

const problems = verifyInlined(out, { js, css });
if (problems.length) {
  console.error('Inlining corrupted the bundle:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

await writeFile(OUT, out);
console.log(`${OUT}  ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB  (external requests: 0)`);
