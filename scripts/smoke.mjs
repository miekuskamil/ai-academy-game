#!/usr/bin/env node
/**
 * Boot the finished single-file app and check it actually renders.
 *
 * A corrupted bundle still looks like valid HTML and still "builds", so nothing
 * upstream of this catches a file that dies on its first line of JavaScript.
 * This is the only check that runs the artefact a person will actually open.
 */
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const file = process.argv[2];
const html = await readFile(file, 'utf8');

const script = html.match(/<script type="module">([\s\S]*?)<\/script>\s*<\/body>/);
if (!script) {
  console.error('no inline module script found');
  process.exit(1);
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://example.test/',
  pretendToBeVisual: true,
});
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
// jsdom exposes these on window; the bundle expects them as globals.
for (const key of ['MutationObserver', 'HTMLElement', 'Node', 'Element', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  if (window[key] && !globalThis[key]) globalThis[key] = window[key];
}
window.matchMedia = (q) => ({
  matches: false,
  media: q,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});

const errors = [];
try {
  window.eval(script[1]);
} catch (err) {
  errors.push(err?.message ?? String(err));
}
await new Promise((r) => setTimeout(r, 500));

const text = window.document.getElementById('root').textContent.replace(/\s+/g, ' ').trim();
if (errors.length) {
  console.error('the app threw while starting:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
if (text.length < 40) {
  console.error(`the app rendered nothing (root text: ${JSON.stringify(text)})`);
  process.exit(1);
}
console.log(`smoke ok — rendered: ${text.slice(0, 90)}…`);
